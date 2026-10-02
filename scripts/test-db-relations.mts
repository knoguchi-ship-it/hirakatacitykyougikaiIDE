/**
 * DB リレーション検査（2026-10-02 新設 / operator 依頼）
 *
 * 「正常にリレーションを貼れているか」をスキーマ層で機械検査する。
 *
 * この DB は Spreadsheet なので、RDB のような外部キー制約は張れない。
 * 代わりに 2 つの層がある。
 *
 *   (A) マスタコード FK — `入力規則定義` に宣言し、シートの入力規則（プルダウン）として
 *       実際に書き込みを制限する。**DB 側で効く唯一の制約。**
 *   (B) ID FK（会員ID・職員ID・研修ID など）— 宣言も強制も無く、コードの整合性に依存する。
 *       ER 図（docs/er-metadata.json）には描かれているが、DB は何も守ってくれない。
 *
 * 本テストは次を固定する。
 *   1. ER 図の関係が、実在するテーブル・実在する列を指していること（図と実装のドリフト検出）
 *   2. マスタコード FK が `入力規則定義` に漏れなく宣言されていること（(A) に載っていること）
 *   3. (B) に属する関係を一覧化し、**DB では守られない**ことを明示すること
 *
 * 実データに孤児行が無いかは、このテストでは分からない（本番 DB を読む必要がある）。
 * その検査は docs/294 §3 の手順で別途行う。
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), ...p.split('/')), 'utf8');
const gasSrc = read('gas-src/Code.full.gs');

// ── スキーマを gas-src から取り出す ─────────────────────────────────────────
// `テーブル定義` はオブジェクトリテラルのあとに `テーブル定義['T_役員'] = [...]` と
// 追記され、さらに _archive 分がループで生成される。リテラルだけを読むと 18 件しか取れず、
// 役員・請求まわりがまるごと抜ける。宣言から `DEMO_TRANSFER_ACCOUNT` の手前までを通して評価する。
function loadSchema() {
  const from = gasSrc.indexOf('var マスタ定義 = {');
  const to = gasSrc.indexOf('var DEMO_TRANSFER_ACCOUNT');
  assert.ok(from !== -1 && to > from, 'スキーマ宣言の範囲が特定できない');
  return new Function(
    gasSrc.slice(from, to) + '; return { マスタ定義, テーブル定義, 入力規則定義 };',
  )() as {
    マスタ定義: Record<string, string[]>;
    テーブル定義: Record<string, string[]>;
    入力規則定義: [string, string, string][];
  };
}

const { マスタ定義, テーブル定義, 入力規則定義 } = loadSchema();
const ALL: Record<string, string[]> = { ...マスタ定義, ...テーブル定義 };

interface Relationship { left: string; right: string; cardinality: string; label: string }
const relationships: Relationship[] = JSON.parse(read('docs/er-metadata.json')).relationships;

/** ER 図のラベルには `会員ID(v360 2-FK)` のように注記が付く。列名はカッコの手前まで */
const columnOf = (label: string) => String(label || '').replace(/[(（].*$/, '').trim();

/** 参照先の主キー列。マスタは `コード` のこともあれば `役職コード` のこともある＝先頭列を正とする */
const primaryKeyOf = (table: string) => (ALL[table] || [])[0] || '';

test('ER 図の関係は実在するテーブルを指している', () => {
  const missing = relationships
    .filter(r => !ALL[r.left] || !ALL[r.right])
    .map(r => `${r.left} → ${r.right}（${!ALL[r.left] ? '左' : '右'}が定義に無い）`);
  assert.deepEqual(missing, [], '図にあるテーブルが実装に無い:\n  ' + missing.join('\n  '));
});

test('ER 図の関係は実在する列を指している', () => {
  const missing: string[] = [];
  for (const r of relationships) {
    const col = columnOf(r.label);
    if (!col) continue;
    if (!(ALL[r.left] || []).includes(col)) missing.push(`${r.left}.${col} が無い（→ ${r.right}）`);
    const pk = primaryKeyOf(r.right);
    if (!pk) missing.push(`${r.right} に列が無い`);
  }
  assert.deepEqual(missing, [], '図が実在しない列を参照している:\n  ' + missing.join('\n  '));
});

test('マスタコード FK は入力規則として宣言されている（DB 側で効く唯一の制約）', () => {
  const declared = new Set(入力規則定義.map(([t, c, m]) => `${t}.${c}→${m}`));
  // 入力規則は張れないが、コードで検証しているもの。
  // T_規程.対象会員種別 の選択肢は M_会員種別 + 'ALL' で、マスタそのままでは表せない。
  // REGULATION_TARGETS に無ければ throw するのを確認済み。
  const VALIDATED_IN_CODE = new Set(['T_規程.対象会員種別→M_会員種別']);
  const undeclared: string[] = [];
  for (const r of relationships) {
    if (!r.right.startsWith('M_')) continue;
    // archive は参照専用の退避先。入力規則は張らない（行は移動されるだけで入力されない）
    if (r.left.endsWith('_archive')) continue;
    const key = `${r.left}.${columnOf(r.label)}→${r.right}`;
    if (!declared.has(key) && !VALIDATED_IN_CODE.has(key)) undeclared.push(key);
  }
  // ★未達（2026-10-02 時点）。ここにある列はマスタを参照しているのに
  // 入力規則もコード検証も無く、任意の文字列を書ける。docs/294 §3 に記録。
  const KNOWN_UNCONSTRAINED = [
    'T_研修申込.出欠状態コード→M_出欠状態',
    'M_役職マスタ.組織コード→M_組織マスタ',
    'M_業務分類.組織コード→M_組織マスタ',
    'T_支払い明細.役職コード→M_役職マスタ',
    'T_請求.役職コード→M_役職マスタ',
  ];
  assert.deepEqual(undeclared.slice().sort(), KNOWN_UNCONSTRAINED.slice().sort(),
    'マスタ参照の未制約一覧が変わった。docs/294 §3 と突き合わせて更新すること');
});

test('入力規則の宣言は実在する列・実在するマスタを指している', () => {
  const broken: string[] = [];
  for (const [table, column, master] of 入力規則定義) {
    if (!ALL[table]) broken.push(`${table} が定義に無い`);
    else if (!ALL[table].includes(column)) broken.push(`${table}.${column} が無い`);
    if (!マスタ定義[master]) broken.push(`${master} がマスタ定義に無い`);
  }
  assert.deepEqual(broken, [], '入力規則が壊れている:\n  ' + broken.join('\n  '));
});

test('ID による参照は DB では守られない — 一覧を固定する', () => {
  // Spreadsheet は ID 列に外部キー制約を張れない。入力規則はマスタの選択肢にしか使えず、
  // 「会員ID が T_会員 に実在すること」は誰も保証しない。
  // どこが保証されていないのかを一覧として残し、増減に気づけるようにする。
  const idRefs = relationships
    .filter(r => !r.right.startsWith('M_') && !r.left.endsWith('_archive'))
    .map(r => `${r.left}.${columnOf(r.label)} → ${r.right}`);
  const unique = [...new Set(idRefs)].sort();
  console.log(`\n── DB では強制されない ID 参照 ${unique.length} 件 ──`);
  for (const line of unique) console.log('  ' + line);
  // 件数を固定する。増えたらこのテストが落ち、「守られない参照をまた増やした」と気づける。
  assert.equal(unique.length, 24,
    '守られない ID 参照の数が変わった。docs/294 §3 の一覧と突き合わせて更新すること');
});

test('archive は元テーブルと同じ列 + サロゲート 3 列', () => {
  const surrogate = ['アーカイブID', '削除バッチID', 'アーカイブ日時'];
  const wrong: string[] = [];
  for (const name of Object.keys(テーブル定義)) {
    if (!name.endsWith('_archive')) continue;
    const src = name.slice(0, -'_archive'.length);
    const expected = (テーブル定義[src] || []).concat(surrogate);
    if (JSON.stringify(テーブル定義[name]) !== JSON.stringify(expected)) {
      wrong.push(`${name} が ${src} + サロゲート と一致しない`);
    }
  }
  assert.deepEqual(wrong, [], wrong.join('\n  '));
});

test('主キー列は各テーブルの先頭にある', () => {
  // 「先頭列＝主キー」は ER 生成・参照解決の前提。崩れると参照先が特定できなくなる。
  const odd: string[] = [];
  for (const [name, cols] of Object.entries(テーブル定義)) {
    if (name.endsWith('_archive')) continue;
    const head = cols[0] || '';
    if (!/ID$|コード$|キー$|番号$/.test(head)) odd.push(`${name} の先頭列が「${head}」`);
  }
  assert.deepEqual(odd, [], '先頭列が主キーに見えないテーブル:\n  ' + odd.join('\n  '));
});
