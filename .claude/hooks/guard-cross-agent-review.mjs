#!/usr/bin/env node
/**
 * SessionStart — 直前に別の担当（ClaudeCode ⇔ Codex）が作業していたら、その作業全体のレビューを指示する（H10・2026-11-02）。
 *
 * 使い方: node guard-cross-agent-review.mjs <claude|codex> [--ack]
 * 記録: <リポジトリ直下>/.tmp/agent-activity.json = { agent, fromHead, at, pending }
 *   agent / fromHead / at … 最後に起動した担当と、その担当が作業を始めたときの HEAD（同じ担当の再起動では動かさない）。
 *   pending … まだレビューが済んでいない相手の作業 { agent, fromHead, at }。--ack で消す。
 * 2026-11-03 是正: 以前は「最後の担当」だけを持ち、レビューを --ack せずに終えると記録が前の担当のまま残り、
 *   次に起動した元の担当には「直前も自分」と見えて、相手の作業が通知されなかった（Codex → ClaudeCode で実際に起きた）。
 *   起動のたびに自分を記録し、未レビューの作業は pending に分けて持つ。
 * 中身（何を見てどう報告するか）は Skill /cross-review が正本。レビューと提案だけで、修正はしない。
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
  // 自分の作業の始まり: 直前も自分なら最初に起動したときの HEAD を保つ（再起動で範囲を縮めない）。
  const mine = prev && prev.agent === me ? { fromHead: prev.fromHead, at: prev.at } : { fromHead: head, at: now };
  const write = (pending) => {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify({ agent: me, ...mine, pending: pending || null }), 'utf8');
  };
  if (process.argv[3] === '--ack') { write(null); process.exit(0); }

  // レビューする相手の作業: 直前が相手ならその作業。直前も自分なら、まだ済んでいない相手の作業（自分の作業は対象外）。
  let target = null;
  if (prev && prev.agent !== me) target = { agent: prev.agent, fromHead: prev.fromHead, at: prev.at };
  else if (prev && prev.pending && prev.pending.agent !== me) target = prev.pending;
  write(target);
  if (!target) process.exit(0);

  let range;
  let commits = '不明';
  try {
    git('merge-base', '--is-ancestor', String(target.fromHead), head);
    range = `${String(target.fromHead).slice(0, 8)}..${head.slice(0, 8)}`;
    commits = git('rev-list', '--count', `${target.fromHead}..${head}`);
  } catch {
    range = `不明（記録の HEAD ${String(target.fromHead).slice(0, 8)} が今の履歴に無い）。${target.at} 以降のコミットを \`git log --since\` で引く`;
  }
  const dirty = git('status', '--porcelain').split('\n').filter(Boolean).length;
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: `【担当交代レビューの指示】直前は ${NAMES[target.agent]} が作業していた（記録 ${target.at}）。`
        + `operator の最初の依頼に取りかかる前に、Skill /cross-review（Codex は \`.claude/skills/cross-review/SKILL.md\` を最後まで読む）で、`
        + `${NAMES[target.agent]} の作業全体を評価してレビューを返すこと。対象: コミット範囲 ${range}（${commits} 件）・未コミットの変更 ${dirty} 件。`
        + '**レビューと提案だけを行い、修正・コミット・本番操作はしない。** 重要度別（重大／高／中／低・提案）の箇条書きで報告し、operator の指示を待つ。'
        + 'operator の最初の依頼が急ぎであれば、レビューを後回しにしてよいか一言たずねる。',
    },
  }));
} catch (err) {
  process.stderr.write('担当交代の確認に失敗しました。記録と hook の設定を確認してください。\n');
  process.exit(1);
}
process.exit(0);
