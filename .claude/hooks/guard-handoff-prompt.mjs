#!/usr/bin/env node
/**
 * UserPromptSubmit — ハンドオフの指示を見つけたら「ハンドオフ中」の印を付け、AI に /handoff とレビューを指示する（H9・2026-11-01）。
 *
 * 強制の本体は guard-handoff-stop.mjs（印があるのにレビューの記録が無ければ、返答を終わらせない）。
 * ここは言葉で拾う入口。打った `/handoff` もそのままの文字で届く（公式ドキュメントで確認・2026-11-01）。
 * 出力: hookSpecificOutput.additionalContext（AI の文脈に足される）。判断に失敗したら何もしない（fail-open）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handoffPendingPath } from './handoff-state.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const STATE = process.env.GUARD_STATE_ROOT || ROOT;

// 独立した直接依頼だけを拾う。部分一致で引用・否定・条件文まで発火させない。
const WORD = '(?:ハンドオフ|引き?継ぎ|引継)';
const END = '[。．！!\\s]*$';
const HANDOFF_PATTERNS = [
  /^\s*[\/$]handoff(?:\s|$)/i,                                    // /handoff（ClaudeCode）・$handoff（Codex の Skill 指定）と打った
  new RegExp(String.raw`^\s*${WORD}[。．！!\s]*$`),                // 「ハンドオフ」だけ
  new RegExp(`^(?:(?:では|それでは)[、,\\s]*)?${WORD}(?:を)?(?:して(?:ください|下さい)?|お願い(?:します|いたします)?|よろしく(?:お願いします)?|しましょう|実施してください|行ってください|進めてください)${END}`),
  new RegExp(`^まとめて閉じ(?:て(?:ください|下さい)?|ましょう)${END}`),
  new RegExp(`^(?:ここで)?(?:区切りましょう|区切りにしましょう|区切ってください)${END}`),
];

function isHandoffRequest(prompt) {
  let fence = null;
  return String(prompt).split(/\r?\n/).some((raw) => {
    const line = raw.trim();
    const marker = line.match(/^(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = { kind: marker[1][0], length: marker[1].length };
      else if (marker[1][0] === fence.kind && marker[1].length >= fence.length
        && line.slice(marker[1].length).trim() === '') fence = null;
      return false;
    }
    if (fence || /^>/.test(line) || /[`「」『』“”"]/.test(line)) return false;
    return HANDOFF_PATTERNS.some((re) => re.test(line));
  });
}

// Codex（Windows）の前段 .codex/run-handoff-hook.ps1 は、読み終えた入力をファイルで渡す（stdin は前段が読んでいる）
function handle(raw) {
  try {
    const input = JSON.parse(raw || '{}');
    const prompt = String(input.prompt || '');
    if (!isHandoffRequest(prompt)) process.exit(0);
    const PENDING = handoffPendingPath(STATE, String(input.session_id || ''));
    fs.mkdirSync(path.dirname(PENDING), { recursive: true });
    fs.writeFileSync(PENDING, JSON.stringify({ sessionId: String(input.session_id || ''), at: Date.now(), blocks: 0 }), 'utf8');
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: '【ハンドオフの指示を検知】Skill /handoff（Codex は `.agents/skills/handoff` → 正本 `.claude/skills/handoff/SKILL.md`）を最初から最後まで実行すること。'
          + '判断の項目（実装と規定の突き合わせ・仕様書の旧い記述・未検証の書き分け）を行い、'
          + '最後に `npm run handoff:review` を通すこと。この HEAD でレビューが通るまで、hook が返答を終わらせない。'
          + '引き継ぎの指示ではない（言葉が偶然一致した）と判断した場合は、その旨を operator に一言伝えること。',
      },
    }));
  } catch { /* fail-open */ }
  process.exit(0);
}

if (process.env.HANDOFF_HOOK_INPUT_FILE) {
  let raw = '';
  try { raw = fs.readFileSync(process.env.HANDOFF_HOOK_INPUT_FILE, 'utf8'); } catch { process.exit(0); }
  handle(raw);
} else {
  let raw = '';
  process.stdin.on('data', (c) => { raw += c; });
  process.stdin.on('end', () => handle(raw));
}
