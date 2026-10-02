// prerelease が最後まで通ったことを記録する。
//
// なぜ要るか: `npm run prerelease` は「自分で打たないと動かない」。打ち忘れを防げない。
// PreToolUse hook（.claude/hooks/guard-bash.mjs）がこの記録を見て、
// ゲート未通過の `git push` を拒否する。
//
// 記録は `.tmp/`（gitignored）に置く。これは各自の環境で通すべきもので、共有しない。
// 設計の正本: docs/296_RULES_ARCHITECTURE_DESIGN_2026-10-02.md §3.4 / §4.2
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
let head = '';
try {
  head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
} catch {
  // git が無い / リポジトリ外。記録しない（hook 側は記録なし＝未通過として扱う）
  process.exit(0);
}

const dir = path.join(root, '.tmp');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(
  path.join(dir, 'prerelease-ok.json'),
  JSON.stringify({ head, at: new Date().toISOString() }, null, 2) + '\n',
  'utf8',
);
console.log(`prerelease OK を記録しました（HEAD ${head.slice(0, 8)}）`);
