#!/usr/bin/env node
/**
 * SessionStart — 直前に別の担当（ClaudeCode ⇔ Codex）が作業していたら、その作業全体のレビューを指示する（H10・2026-11-02）。
 *
 * 使い方: node guard-cross-agent-review.mjs <claude|codex>
 * 記録: <リポジトリ直下>/.tmp/agent-activity.json = { agent, fromHead, at }（最後に起動した担当と、そのときの HEAD）。
 *   初回は自分を記録する。担当交代時は前の記録を残し、レビュー後の --ack で更新する。
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
  const head = git('rev-parse', 'HEAD');
  const record = () => {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify({ agent: me, fromHead: head, at: new Date().toISOString() }), 'utf8');
  };
  if (process.argv[3] === '--ack') { record(); process.exit(0); }
  if (!prev) { record(); process.exit(0); }
  if (!NAMES[prev.agent]) throw new Error('担当記録が不正です');
  if (prev.agent === me) process.exit(0);

  let range;
  let commits = '不明';
  try {
    git('merge-base', '--is-ancestor', String(prev.fromHead), head);
    range = `${String(prev.fromHead).slice(0, 8)}..${head.slice(0, 8)}`;
    commits = git('rev-list', '--count', `${prev.fromHead}..${head}`);
  } catch {
    range = `不明（記録の HEAD ${String(prev.fromHead).slice(0, 8)} が今の履歴に無い）。${prev.at} 以降のコミットを \`git log --since\` で引く`;
  }
  const dirty = git('status', '--porcelain').split('\n').filter(Boolean).length;
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: `【担当交代レビューの指示】直前は ${NAMES[prev.agent]} が作業していた（記録 ${prev.at}）。`
        + `operator の最初の依頼に取りかかる前に、Skill /cross-review（Codex は \`.claude/skills/cross-review/SKILL.md\` を最後まで読む）で、`
        + `${NAMES[prev.agent]} の作業全体を評価してレビューを返すこと。対象: コミット範囲 ${range}（${commits} 件）・未コミットの変更 ${dirty} 件。`
        + '**レビューと提案だけを行い、修正・コミット・本番操作はしない。** 重要度別（重大／高／中／低・提案）の箇条書きで報告し、operator の指示を待つ。'
        + 'operator の最初の依頼が急ぎであれば、レビューを後回しにしてよいか一言たずねる。',
    },
  }));
} catch (err) {
  process.stderr.write('担当交代の確認に失敗しました。記録と hook の設定を確認してください。\n');
  process.exit(1);
}
process.exit(0);
