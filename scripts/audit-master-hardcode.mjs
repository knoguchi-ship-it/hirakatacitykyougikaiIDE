// 2026-10-19: M_ マスタの値（コード・名称）がソースに直書きされている箇所の棚卸し（読むだけ・prerelease 外）。
//
// 使い方: npm run audit:master-hardcode            … マスタごとの件数
//         npm run audit:master-hardcode -- --list  … 直すべき種類（OPTION/LABEL/ALLOW/TYPE）の全件
//
// マスタの値は gas-src の マスタ初期値 を実際に評価して得る（一覧をこのファイルに書かない）。
// 分類:
//   OPTION … <option> の並び（選択肢）。連続する行をひとまとまりで数える
//   LABEL  … コード → 名称 の対応（名称表・三項演算子・case・{ value, label }）
//   ALLOW  … 許可値の配列（['A', 'B'].indexOf など）
//   TYPE   … TypeScript の型の列挙（'A' | 'B'）
//   BRANCH … コードでの振る舞い分岐。仕様なので原則残す（件数のみ）
// ADMIN・STAFF・EMAIL のように他の意味でも使う語は誤検出がある。結果は docs/309 で人が仕分けている。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const gasPath = path.join(ROOT, 'gas-src', 'Code.full.gs');
const gas = fs.readFileSync(gasPath, 'utf8');
const LIST = process.argv.includes('--list');

const s = gas.indexOf('var マスタ初期値 = {');
const e = gas.indexOf('\n};', s) + 3;
const seed = new Function(gas.slice(s, e) + '\nreturn マスタ初期値;')();
const seedStart = gas.slice(0, s).split('\n').length;
const seedEnd = gas.slice(0, e).split('\n').length;
const SKIP_MASTERS = new Set(['M_申込者区分']); // v360 で廃止（全行 有効=false）
const masters = Object.entries(seed).filter(([n]) => !SKIP_MASTERS.has(n)).map(([name, rows]) => ({
  name, codes: rows.map((r) => String(r[0])), labels: rows.map((r) => String(r[1])),
}));

function listSources(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const full = path.join(dir, d.name);
    if (d.isDirectory()) return listSources(full);
    return /\.(tsx?|mjs)$/.test(d.name) ? [full] : [];
  });
}
const files = [gasPath, ...listSources(path.join(ROOT, 'src'))];
const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isComment = (t) => t.startsWith('//') || t.startsWith('*') || t.startsWith('/*') || t.startsWith('{/*');
const JP = '[^\\x00-\\x7F]';

function codesIn(line, m) {
  return m.codes.filter((c) => new RegExp(`['"\`]${esc(c)}['"\`]|MemberType\\.${esc(c)}\\b|value=["']${esc(c)}["']|(?:^|[\\s{,])${esc(c)}\\s*:\\s*['"\`]`).test(line));
}

function classify(line, hits) {
  if (/<option\b/.test(line)) return 'OPTION';
  const c = hits.map(esc).join('|');
  if (new RegExp(`(?:${c})['"\`]?\\s*\\]?\\s*:\\s*['"\`]${JP}`).test(line)) return 'LABEL';
  if (new RegExp(`['"\`](?:${c})['"\`]\\s*\\?\\s*['"\`]${JP}|[=!]==\\s*(?:MemberType\\.)?['"\`]?(?:${c})['"\`]?\\s*\\)?\\s*\\?\\s*['"\`]?${JP}`).test(line)) return 'LABEL';
  if (new RegExp(`case\\s+['"\`](?:${c})['"\`]\\s*:\\s*return\\s+['"\`]${JP}`).test(line)) return 'LABEL';
  if (new RegExp(`value:\\s*['"\`](?:${c})['"\`].*label:\\s*['"\`]`).test(line)) return 'LABEL';
  if (/&&\s*<span/.test(line) && new RegExp(`===\\s*['"\`](?:${c})`).test(line)) return 'LABEL';
  if (hits.length >= 2 && /\|/.test(line) && /(type\s+\w+\s*=|:\s*['"`]|<['"`]|useState<)/.test(line) && !/\|\|/.test(line)) return 'TYPE';
  if (hits.length >= 2 && /\[\s*['"`]/.test(line)) return 'ALLOW';
  return 'BRANCH';
}

const rows = [];
for (const file of files) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  fs.readFileSync(file, 'utf8').split('\n').forEach((raw, i) => {
    const ln = i + 1;
    if (file === gasPath && ln >= seedStart && ln <= seedEnd) return;
    const t = raw.trim();
    if (isComment(t)) return;
    // 1 行は「コードが最も多く一致したマスタ」に寄せる（ADMIN などの重複コード対策）
    let best = null;
    for (const m of masters) {
      const hits = codesIn(raw, m);
      if (!hits.length) continue;
      const score = hits.length * 10 + m.labels.filter((l) => l.length >= 2 && raw.includes(l)).length;
      if (!best || score > best.score) best = { m, hits, score };
    }
    if (best) rows.push({ master: best.m.name, kind: classify(raw, best.hits), file: rel, line: ln, codes: best.hits, text: t.slice(0, 110) });
  });
}

const groups = [];
for (const r of rows.filter((x) => x.kind === 'OPTION').sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)) {
  const g = groups[groups.length - 1];
  if (g && g.file === r.file && r.line - g.end <= 2) { g.end = r.line; g.items.push(r); } else groups.push({ file: r.file, start: r.line, end: r.line, items: [r] });
}
for (const g of groups) {
  const codes = g.items.flatMap((x) => x.codes);
  let best = null;
  for (const m of masters) {
    const n = codes.filter((c) => m.codes.includes(c)).length;
    if (!best || n > best.n) best = { m, n };
  }
  g.master = best.m.name;
  g.codes = [...new Set(codes)];
}

console.log('master'.padEnd(14), ['OPTION群', 'LABEL', 'ALLOW', 'TYPE', 'BRANCH'].map((k) => k.padStart(8)).join(''));
for (const m of masters) {
  const r = rows.filter((x) => x.master === m.name);
  const n = (k) => r.filter((x) => x.kind === k).length;
  console.log(m.name.padEnd(14), [groups.filter((g) => g.master === m.name).length, n('LABEL'), n('ALLOW'), n('TYPE'), n('BRANCH')]
    .map((v) => String(v).padStart(8)).join(''));
}
if (LIST) {
  for (const m of masters) {
    const og = groups.filter((g) => g.master === m.name);
    const r = rows.filter((x) => x.master === m.name && x.kind !== 'BRANCH' && x.kind !== 'OPTION');
    if (!og.length && !r.length) continue;
    console.log(`\n## ${m.name}`);
    for (const g of og) console.log(`  OPTION ${g.file}:${g.start}-${g.end}  ${g.codes.join(',')}`);
    for (const x of r) console.log(`  ${x.kind.padEnd(6)} ${x.file}:${x.line}  ${x.text}`);
  }
}
