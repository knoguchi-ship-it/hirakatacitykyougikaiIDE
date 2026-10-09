/**
 * Skill の中身が実在するものを指しているかを検査する（2026-10-09 新設）。
 *
 * Skill は**呼ばれたときに初めて読まれる**ので、間違っていても普段は誰も気づかない。
 * 気づくのは、リリース中に書かれたコマンドを打って失敗したときになる。
 * それは最悪のタイミングなので、ここで先に落とす。
 *
 * 検査できないこと: Skill が実際に読み込まれるか（セッション開始時に決まるため、
 * テストからは確かめられない）。読み込みの確認は新しいセッションの冒頭で行う。
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const SKILLS_DIR = path.join(root, '.claude', 'skills');

interface Skill { dir: string; file: string; body: string; fm: Record<string, string> }

function loadSkills(): Skill[] {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  return fs.readdirSync(SKILLS_DIR)
    .filter((d) => fs.existsSync(path.join(SKILLS_DIR, d, 'SKILL.md')))
    .map((dir) => {
      const file = path.join(SKILLS_DIR, dir, 'SKILL.md');
      const raw = fs.readFileSync(file, 'utf8');
      const m = raw.match(/^---\n([\s\S]*?)\n---\n/);
      const fm: Record<string, string> = {};
      if (m) {
        for (const line of m[1].split('\n')) {
          const i = line.indexOf(':');
          if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
        }
      }
      return { dir, file, body: m ? raw.slice(m[0].length) : raw, fm };
    });
}

const skills = loadSkills();
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const npmScripts = new Set(Object.keys(pkg.scripts || {}));
const gasSrc = fs.readFileSync(path.join(root, 'gas-src', 'Code.full.gs'), 'utf8');

test('Skill が 1 本以上ある', () => {
  assert.ok(skills.length > 0, '.claude/skills/ に SKILL.md が無い');
  console.log('  検査対象: ' + skills.map((s) => '/' + s.dir).join(' '));
});

test('frontmatter が妥当（name がディレクトリ名と一致・description がある）', () => {
  const bad: string[] = [];
  for (const s of skills) {
    if (!s.fm.name) bad.push(`${s.dir}: name が無い`);
    else if (s.fm.name !== s.dir) bad.push(`${s.dir}: name="${s.fm.name}" がディレクトリ名と違う`);
    if (!s.fm.description) bad.push(`${s.dir}: description が無い（呼び出し判断に使われる）`);
    else if (s.fm.description.length > 1536) bad.push(`${s.dir}: description が 1536 字を超える`);
  }
  assert.deepEqual(bad, [], bad.join('\n  '));
});

test('★Skill が書いている npm コマンドが実在する', () => {
  // リリース中に打って「そんなスクリプトは無い」となるのを防ぐ。
  const missing: string[] = [];
  for (const s of skills) {
    for (const m of s.body.matchAll(/npm run ([a-z0-9:_-]+)/g)) {
      if (!npmScripts.has(m[1])) missing.push(`/${s.dir}: npm run ${m[1]}`);
    }
  }
  assert.deepEqual([...new Set(missing)], [], '存在しない npm スクリプト:\n  ' + missing.join('\n  '));
});

test('★Skill が参照しているファイルが実在する', () => {
  const missing: string[] = [];
  for (const s of skills) {
    // `docs/xxx.md` `scripts/xxx.mts` `gas-src/...` のようなバッククォート内のパス
    for (const m of s.body.matchAll(/`([a-zA-Z0-9_./-]+\.(?:md|mts|mjs|ts|tsx|gs|json|html))`/g)) {
      const p = m[1];
      if (p.startsWith('.')) continue;
      if (!/^(docs|scripts|src|gas-src|gas|backend)\//.test(p)) continue;
      if (!fs.existsSync(path.join(root, ...p.split('/')))) missing.push(`/${s.dir}: ${p}`);
    }
  }
  assert.deepEqual([...new Set(missing)], [], '存在しないファイル:\n  ' + missing.join('\n  '));
});

test('★Skill が名指しする GAS 関数が実在する', () => {
  // 手順書が消えた関数を指していると、読んだ人が探して時間を失う。
  const missing: string[] = [];
  for (const s of skills) {
    for (const m of s.body.matchAll(/`([a-zA-Z][a-zA-Z0-9]*_)\(?`/g)) {
      const name = m[1];
      if (!new RegExp(`function ${name}\\s*\\(`).test(gasSrc)) missing.push(`/${s.dir}: ${name}`);
    }
  }
  assert.deepEqual([...new Set(missing)], [], '存在しない GAS 関数:\n  ' + missing.join('\n  '));
});

test('★Skill が参照している別の Skill が実在する', () => {
  const names = new Set(skills.map((s) => s.dir));
  const missing: string[] = [];
  for (const s of skills) {
    for (const m of s.body.matchAll(/`\/([a-z][a-z0-9-]*)`/g)) {
      if (!names.has(m[1])) missing.push(`/${s.dir} → /${m[1]}`);
    }
  }
  assert.deepEqual([...new Set(missing)], [], '存在しない Skill への参照:\n  ' + missing.join('\n  '));
});

test('AGENTS.md の呼び出し表が実在する Skill と一致する', () => {
  const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
  const listed = [...agents.matchAll(/^\| `\/([a-z-]+)` \|/gm)].map((m) => m[1]);
  const actual = skills.map((s) => s.dir).sort();
  assert.deepEqual(listed.slice().sort(), actual,
    `AGENTS.md の表: ${listed.join(', ')} / 実際: ${actual.join(', ')}`);
});

test('Skill が追跡対象になっている（共有されないと意味がない）', () => {
  const tracked = execFileSync('git', ['ls-files', '.claude/skills'], { cwd: root, encoding: 'utf8' })
    .split('\n').filter(Boolean);
  const untracked = skills.filter((s) => !tracked.includes(`.claude/skills/${s.dir}/SKILL.md`));
  assert.deepEqual(untracked.map((s) => s.dir), [],
    'git に追跡されていない Skill がある（.gitignore を確認）');
});
