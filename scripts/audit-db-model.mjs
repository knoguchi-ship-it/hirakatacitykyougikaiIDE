// 2026-10-25: DB モデルの整合性監査（スキーマを変える前に流す）。
//
// モデルの情報は 7 か所に分かれている。どれか 1 つだけ直すと、削除の連動から漏れる・ER に関係が出ない・
// テストデータが残る、が気づかれずに起きる。ここで互いを突き合わせ、食い違いを一覧にする。
//   テーブル定義（列の正本）／docs/er-metadata.json（型・キー・関係）／DB_STATE_ID_REFERENCES_（守られない ID 参照）／
//   ARCHIVE_SOURCE_TABLES（削除でアーカイブへ移す表）／getCascadeMatchers_（削除の連動で見る列）／
//   TEST_DATA_PURGE_TABLE_POLICY（テストデータ削除の分類）／入力規則定義（マスタの選択肢）
// 既存の test:er-sync / test:db-relations / test:db-state / test:test-data-purge が見ていない観点を見る。
// 使い方: npm run audit:db-model（問題があれば終了コード 1）
import fs from 'node:fs';
import { extractTableDefs, loadMetadata } from './lib/er-model.mjs';

const SRC = fs.readFileSync('gas-src/Code.full.gs', 'utf8');
const defs = extractTableDefs('gas-src/Code.full.gs');
const meta = loadMetadata('docs/er-metadata.json');

function block(head) {
  const start = SRC.indexOf(head);
  if (start < 0) throw new Error(`${head} が見つからない`);
  const from = start + head.length;
  const open = SRC.slice(from).search(/[{[]/) + from;
  const close = SRC[open] === '{' ? '}' : ']';
  let depth = 0;
  for (let i = open; i < SRC.length; i += 1) {
    if (SRC[i] === SRC[open]) depth += 1;
    else if (SRC[i] === close && --depth === 0) return SRC.slice(open, i + 1);
  }
  throw new Error(`${head} の終端が見つからない`);
}
const literal = (head) => new Function(`return ${block(head)};`)();

const archiveSources = literal('var ARCHIVE_SOURCE_TABLES = ');
const purgePolicy = literal('var TEST_DATA_PURGE_TABLE_POLICY = ');
const stateRefs = literal('var DB_STATE_ID_REFERENCES_ = ');
const inputRules = literal('var 入力規則定義 = ');
// 削除の連動: getCascadeMatchers_ の戻り値の [表, 照合] から、照合で見ている列名を拾う。
// 表の名前の出現位置で区切り、次の表までの間にある '〜ID' を、その表の照合の列とみなす。
const cascadeBody = block('function getCascadeMatchers_(');
const cascadeList = cascadeBody.slice(cascadeBody.indexOf('return ['));
const cascade = {};
const heads = [...cascadeList.matchAll(/\['(T_[^']+)',/g)];
heads.forEach((m, i) => {
  const segment = cascadeList.slice(m.index + m[0].length, i + 1 < heads.length ? heads[i + 1].index : undefined);
  cascade[m[1]] = [...segment.matchAll(/'([^']+ID)'/g)].map((x) => x[1]);
});

const tables = Object.keys(defs).filter((t) => !t.endsWith('_archive'));
// 関係の名前には注記が付く（例: 会員ID(v360 2-FK)）。列名は括弧の前
const columnOf = (label) => String(label || '').replace(/[(（].*$/, '').trim();
const rels = (meta.relationships || []).map((r) => ({ ...r, label: columnOf(r.label) }));
const relKey = (t, c) => rels.filter((r) => r.left === t && r.label === c);
const pk = (t) => defs[t][0];
const findings = [];
const add = (kind, msg) => findings.push({ kind, msg });

// ── 1. 「〜ID」の列に関係があるか（主キー・意図して関係を持たない列を除く） ──
// 意図して関係を持たない列（理由つき）。足すときは理由を書く。
const NOT_A_REFERENCE = {
  'T_認証アカウント.GoogleユーザーID': 'Google 側の ID（v118 で照合に使わなくなった）',
  'T_認証アカウント.ログインID': '自然キー（ログインに使う文字列）。他の表を指さない',
  'T_ログイン履歴.ログインID': '入力されたログインID の記録（存在しない ID も残す）。参照は 認証ID',
  'T_LINE投稿依頼.対象ID': '対象種別で参照先が変わる（研修 or なし）。多態参照',
  'T_研修申込.申込者ID': '旧モデル（申込者区分で会員か外部申込者かが変わる多態参照）。v360 以降は 会員ID / 職員ID / 外部申込者ID',
  'T_メール送信明細.受信者ID': '受信者の種別で会員・職員・外部申込者が変わる多態参照',
  'T_監査ログ.対象レコードID': 'どの表の行でも指す多態参照（操作の記録）',
  'T_人物統合ログ.旧会員ID': '統合前の ID の記録（統合後は存在しないことがある）',
  'T_人物統合ログ.旧職員ID': '統合前の ID の記録',
  'T_人物統合ログ.新会員ID': '統合後の ID の記録（ログは後から消さない）',
  'T_人物統合ログ.新職員ID': '統合後の ID の記録',
  'T_年会費更新履歴.更新ID': '主キー',
  'T_削除ログ.ログID': '主キー',
};
// 会員・職員を参照するが、削除の連動で見ない列（理由つき）
const NOT_CASCADED = {
  'T_研修申込.照合会員ID': 'BR-21 の照合結果。申込は外部申込者のもので、照合した時点の記録として残す（名簿の表示ラベルにだけ使う）',
  'T_研修申込.照合職員ID': '同上',
};
for (const t of tables) {
  for (const c of defs[t]) {
    if (!/ID$/.test(c) || c === pk(t) || NOT_A_REFERENCE[`${t}.${c}`]) continue;
    if (relKey(t, c).length === 0) add('関係なし', `${t}.${c} は ID の列だが ER に関係が無い`);
  }
}

// ── 2. 関係の端点と列 ──────────────────────────────────────────────────────
for (const r of rels) {
  if (!defs[r.left] || !defs[r.right]) continue; // test:er-sync が落とす
  if (!defs[r.left].includes(r.label)) add('関係の列', `${r.left} → ${r.right} の列「${r.label}」が ${r.left} に無い`);
}

// ── 3. ER の FK 表示と関係が一致するか ─────────────────────────────────────
for (const t of Object.keys(meta.columns || {})) {
  for (const [c, info] of Object.entries(meta.columns[t])) {
    const hasRel = relKey(t, c).length > 0;
    if (info.key === 'FK' && !hasRel) add('FK 表示', `${t}.${c} は FK と表示されているが関係が無い`);
    if (info.key !== 'FK' && info.key !== 'PK' && hasRel && !t.endsWith('_archive')) add('FK 表示', `${t}.${c} は関係があるが FK と表示されていない`);
  }
}

// ── 4. 会員・職員を参照する表は、アーカイブ・削除の連動・テストデータ削除の 3 つにそろって入っているか ──
const PERSON = ['T_会員', 'T_事業所職員'];
// ログ用スプレッドシートの表や、記録として残す表（KEEP / PURGE）はアーカイブの対象外
for (const r of rels.filter((x) => PERSON.includes(x.right) && !x.left.endsWith('_archive'))) {
  const t = r.left;
  const policy = purgePolicy[t];
  if (policy === 'KEEP' || policy === 'PURGE') continue;
  if (!archiveSources.includes(t)) add('削除の連動', `${t}.${r.label} → ${r.right} があるが ARCHIVE_SOURCE_TABLES に無い（会員を削除しても残る）`);
  if (!cascade[t]) add('削除の連動', `${t} が getCascadeMatchers_ に無い`);
  else if (!cascade[t].includes(r.label) && !NOT_CASCADED[`${t}.${r.label}`]) add('削除の連動', `${t}.${r.label} → ${r.right} を getCascadeMatchers_ が見ていない（会員・職員の削除で連動しない）`);
  if (policy !== 'CASCADE') add('テストデータ削除', `${t} の分類が CASCADE でない（${policy || '未分類'}）`);
}

// ── 5. 「会員ID か 職員ID のどちらか」の表は、両方とも任意の関係 ─────────────
// どちらか一方の表は OFFICER_PERSON_TABLES_（役員まわり 4 表）。T_認証アカウント は職員でも
// 事業所の会員ID を必ず持つので、どちらか一方ではない（会員ID 必須・職員ID 任意が正しい）。
const xorTables = literal('var OFFICER_PERSON_TABLES_ = ');
for (const t of xorTables) {
  const m = relKey(t, '会員ID').find((r) => r.right === 'T_会員');
  const s = relKey(t, '職員ID').find((r) => r.right === 'T_事業所職員');
  if (!m || !s) continue;
  for (const r of [m, s]) {
    if (!/o\|$/.test(r.cardinality)) add('XOR', `${t}.${r.label} は会員ID / 職員ID のどちらか一方なのに必須（${r.cardinality}）になっている`);
  }
}

// ── 6. 守られない ID 参照の一覧と ER の関係 ───────────────────────────────
const erIdRefs = new Set(rels.filter((r) => !r.right.startsWith('M_') && !r.left.endsWith('_archive')).map((r) => `${r.left}.${r.label}>${r.right}`));
const codeIdRefs = new Set(stateRefs.map(([t, c, p]) => `${t}.${c}>${p}`));
for (const k of erIdRefs) if (!codeIdRefs.has(k)) add('ID 参照の一覧', `ER にある ${k} が DB_STATE_ID_REFERENCES_ に無い`);
for (const k of codeIdRefs) if (!erIdRefs.has(k)) add('ID 参照の一覧', `DB_STATE_ID_REFERENCES_ の ${k} が ER に無い`);

// ── 7. 入力規則（マスタの選択肢）と ER の関係 ──────────────────────────────
for (const [t, c, m] of inputRules) {
  if (!rels.some((r) => r.left === t && r.label === c && r.right === m)) add('入力規則', `入力規則 ${t}.${c} → ${m} が ER の関係に無い`);
}

// ── 8. 数字だけの文字列を入れる列は、書式なしテキストの対象か（先頭の 0 が消える） ──
// 2026-10-25: 振込口座の金融機関コード '0000' が数値の 0 になった。電話・郵便番号・〜番号・ログインID も同じ。
const textColumns = literal('var TEXT_FORMAT_COLUMNS_ = ');
const NOT_TEXT_FORMATTED = {
  'T_ログイン履歴.ログインID': 'ログ用スプレッドシートの記録（整備の対象外）。照合は 認証ID で行う',
};
for (const t of tables) {
  for (const c of defs[t]) {
    if (!/電話|FAX|郵便番号|番号$|ログインID$|金融機関コード|支店コード/.test(c) || NOT_TEXT_FORMATTED[`${t}.${c}`]) continue;
    if (!(textColumns[t] || []).includes(c)) add('書式なしテキスト', `${t}.${c} は数字だけの文字列を入れる列だが TEXT_FORMAT_COLUMNS_ に無い（先頭の 0 が消える）`);
  }
}

// ── 出力 ───────────────────────────────────────────────────────────────
const byKind = {};
for (const f of findings) (byKind[f.kind] ||= []).push(f.msg);
console.log(`[audit-db-model] 表 ${tables.length}（アーカイブ除く）/ 関係 ${rels.length} / ID 参照 ${codeIdRefs.size} / アーカイブ対象 ${archiveSources.length}`);
if (!findings.length) {
  console.log('[audit-db-model] 食い違い 0');
} else {
  for (const [kind, msgs] of Object.entries(byKind)) {
    console.log(`\n■ ${kind}（${msgs.length}）`);
    msgs.forEach((m) => console.log('  - ' + m));
  }
  process.exitCode = 1;
}
