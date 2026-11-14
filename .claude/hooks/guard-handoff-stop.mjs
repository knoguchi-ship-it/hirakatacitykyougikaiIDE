#!/usr/bin/env node
/**
 * Stop — ハンドオフ中なのに、この HEAD でレビュー（npm run handoff:review）が通っていなければ返答を終わらせない（H9・2026-11-01）。
 *
 * 返答のたびに動くので軽くする: セッション別の印（旧形式は .tmp/handoff-pending.json）があるときだけgitを呼ぶ。
 * 形式（公式ドキュメントで確認・2026-11-01）: `{"decision":"block","reason":"…"}` で作業へ戻す。
 * ループ止め: 同じ印で 2 回戻しても通らなければ 3 回目は終わらせ、operator に判断を渡す（systemMessage）。
 * 印は別の会話のもの・24 時間より古いものは無視する。判断に失敗したら何もしない（fail-open）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handoffPendingForStop, removeHandoffPending } from './handoff-state.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const STATE = process.env.GUARD_STATE_ROOT || ROOT;
const MARKER = path.join(STATE, '.tmp', 'handoff-review-ok.json');
const MAX_BLOCKS = 2;
const DAY = 24 * 60 * 60 * 1000;

const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const out = (obj) => { process.stdout.write(JSON.stringify(obj)); process.exit(0); };
// 止めないとき。Codex の Stop は exit 0 のとき JSON を期待するので '{}' を返す（ClaudeCode は何も出さない）
const allow = () => { if (process.env.CODEX_HOOK_RUNTIME === '1') process.stdout.write('{}'); process.exit(0); };

let raw = '';
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', async () => {
  try {
    const input = JSON.parse(raw || '{}');
    const PENDING = handoffPendingForStop(STATE, String(input.session_id || ''));
    if (!fs.existsSync(PENDING)) allow();
    const pending = readJson(PENDING);
    if (!pending) allow();
    const stale = Date.now() - Number(pending.at || 0) > DAY;
    const otherSession = pending.sessionId && input.session_id && pending.sessionId !== String(input.session_id);
    if (otherSession) allow(); // 別の会話が使っている印を消さない
    if (stale) { removeHandoffPending(PENDING, STATE); allow(); }

    const { execFileSync } = await import('node:child_process');
    const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: input.cwd || ROOT, encoding: 'utf8' }).trim();
    const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: input.cwd || ROOT, encoding: 'utf8' }).trim();
    const marker = readJson(MARKER);
    if (marker && marker.head === head && Number(marker.at || 0) >= Number(pending.at || 0) && !dirty) {
      removeHandoffPending(PENDING, STATE);
      allow(); // レビュー済み
    }

    const blocks = Number(pending.blocks || 0);
    if (blocks >= MAX_BLOCKS) {
      removeHandoffPending(PENDING, STATE);
      out({ systemMessage: `引き継ぎ前のレビュー（npm run handoff:review）が、${MAX_BLOCKS} 回戻しても通らないまま終わりました。`
        + '通らない理由を AI の報告で確かめ、引き継ぎを続けるか判断してください。' });
    }
    fs.writeFileSync(PENDING, JSON.stringify({ ...pending, blocks: blocks + 1 }), 'utf8');
    const why = !marker ? 'レビューの記録がありません'
      : marker.head !== head ? `レビューの後に HEAD が変わりました（記録 ${String(marker.head).slice(0, 8)} / 現在 ${head.slice(0, 8)}）`
        : Number(marker.at || 0) < Number(pending.at || 0) ? 'レビューの記録がハンドオフの指示より古いです'
          : 'レビュー後の未コミット差分・未追跡ファイルがあります';
    out({
      decision: 'block',
      reason: `ハンドオフの指示がありましたが、引き継ぎ前のレビューが済んでいません（${why}）。`
        + 'Skill /handoff（Codex は `.claude/skills/handoff/SKILL.md`）の手順（判断の項目を含む）を終え、`npm run handoff:review` を通してから返答を終えてください。'
        + `どうしても通せない理由がある場合は、その理由を operator に報告してください（あと ${MAX_BLOCKS - blocks} 回でこの確認は止まります）。`,
    });
  } catch { allow(); }
});
