#!/usr/bin/env node
/**
 * SessionStart — 担当交代時の未レビュー範囲を通知する（H10・2026-11-14 条件整理）。
 *
 * 使い方: node guard-cross-agent-review.mjs <claude|codex> [--ack]
 * 記録: <リポジトリ直下>/.tmp/agent-activity.json = { agent, fromHead, at, pending, pendingReviews }
 *   agent / fromHead / at … 最後に起動した担当と、その担当が作業を始めたときの HEAD（同じ担当の再起動では動かさない）。
 *   pendingReviews … 未レビュー範囲 { agent, fromHead, toHead, at, dirty } の一覧。
 *   pending … 旧記録との互換用。自分が確認すべき先頭の範囲。--ackは相手の保留範囲だけを消す。
 * 2026-11-03 是正: 以前は「最後の担当」だけを持ち、レビューを --ack せずに終えると記録が前の担当のまま残り、
 *   次に起動した元の担当には「直前も自分」と見えて、相手の作業が通知されなかった（Codex → ClaudeCode で実際に起きた）。
 *   起動のたびに自分を記録し、未レビューの作業は pending に分けて持つ。
 * レビュー範囲と修正依頼の扱いは Skill /cross-review が正本。
 * 出力: hookSpecificOutput.additionalContext（ClaudeCode / Codex とも SessionStart で文脈に足される・公式確認 2026-11-02）。
 * 判断に失敗したらエラーを通知し、記録を更新しない。
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const STATE = process.env.GUARD_STATE_ROOT || ROOT;
const FILE = path.join(STATE, '.tmp', 'agent-activity.json');
const NAMES = { claude: 'ClaudeCode', codex: 'Codex' };

const me = String(process.argv[2] || '').toLowerCase();
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();

try {
  if (!NAMES[me]) process.exit(0);
  let prev = null;
  try { prev = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (err) { if (err.code !== 'ENOENT') throw err; }
  if (prev && !NAMES[prev.agent]) throw new Error('担当記録が不正です');
  if (prev && prev.pending && !NAMES[prev.pending.agent]) throw new Error('担当記録が不正です');
  const head = git('rev-parse', 'HEAD');
  const now = new Date().toISOString();
  if (prev?.pendingReviews && (!Array.isArray(prev.pendingReviews)
    || prev.pendingReviews.some((p) => !p || !NAMES[p.agent] || !p.fromHead || !p.toHead))) {
    throw new Error('未レビュー範囲が不正です');
  }
  const dirty = git('status', '--porcelain').split('\n').filter(Boolean).length;
  // 自分の作業の始まり: 再起動で範囲を縮めない。
  const mine = prev && prev.agent === me ? { fromHead: prev.fromHead, at: prev.at } : { fromHead: head, at: now };
  // 旧形式は最初の移行時に終点を固定。以後、自分の変更を相手の範囲へ足さない。
  let reviews = prev?.pendingReviews || (prev?.pending ? [{ ...prev.pending, toHead: head, dirty }] : []);
  reviews = reviews.filter((p) => p.fromHead !== p.toHead || p.dirty).map((p) => ({ ...p }));
  if (prev && prev.agent !== me) {
    const candidate = { agent: prev.agent, fromHead: prev.fromHead, toHead: head, at: prev.at, dirty };
    if ((candidate.fromHead !== head || dirty) && !reviews.some((p) =>
      p.agent === candidate.agent && p.fromHead === candidate.fromHead && p.toHead === candidate.toHead)) {
      reviews.push(candidate);
    }
  }
  const write = () => {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify({ agent: me, ...mine,
      pending: reviews.find((p) => p.agent !== me) || null, pendingReviews: reviews }), 'utf8');
  };
  if (process.argv[3] === '--ack') {
    reviews = reviews.filter((p) => p.agent === me);
    write();
    process.exit(0);
  }

  const targets = reviews.filter((p) => p.agent !== me);
  const descriptions = targets.map((target) => {
    try {
      git('merge-base', '--is-ancestor', String(target.fromHead), String(target.toHead));
      const commits = git('rev-list', '--count', `${target.fromHead}..${target.toHead}`);
      return `${NAMES[target.agent]}: ${String(target.fromHead).slice(0, 8)}..${String(target.toHead).slice(0, 8)}（${commits} 件）・交代時の未コミット ${target.dirty || 0} 件`;
    } catch {
      return `${NAMES[target.agent]}: 範囲 不明（記録のHEADが今の履歴に無い）。${target.at} 以降を \`git log --since\` で特定`;
    }
  });
  write();
  if (!targets.length) process.exit(0);
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: `【担当交代・未レビュー範囲の通知】${descriptions.join(' / ')}。現在の未コミット ${dirty} 件。`
        + '説明・読み取り調査は止めずに回答してよい。既存物の変更前に、Skill /cross-review（正本 `.claude/skills/cross-review/SKILL.md`）で関連範囲と依存先をレビューする。'
        + '全体レビューの明示依頼なら全範囲を確認する。レビュー自体では修正・コミット・本番操作はしない。重大／高／中／低・提案と未検証事項を分ける。'
        + '修正も依頼済みなら関連レビュー後に承認範囲内で続行できる。一部確認・調査・後回しでは--ackせず、全未レビュー範囲を確認したときだけ--ackする。',
    },
  }));
} catch (err) {
  process.stderr.write('担当交代の確認に失敗しました。記録と hook の設定を確認してください。\n');
  process.exit(1);
}
process.exit(0);
