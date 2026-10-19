// 2026-10-19: M_ マスタの値（コード・名称）がソースに直書きされている箇所の検査（読むだけ）。
//
// 使い方: npm run audit:master-hardcode            … マスタごとの件数
//         npm run audit:master-hardcode -- --list  … 直すべき種類（OPTION/LABEL/ALLOW）の全件
//         npm run audit:master-hardcode -- --check … 許可リスト外が 1 件でもあれば終了コード 1（prerelease）
//
// マスタとその値は gas-src の マスタ定義 / マスタ初期値 を実際に評価して得る（一覧をこのファイルに書かない）。
// マスタ定義 に表を足せば、コードを変えずにこの検査の対象に入る。
// 分類:
//   OPTION … <option> の並び（選択肢）。連続する行をひとまとまりで数える
//   LABEL  … コード → 名称 の対応（名称表・三項演算子・case・{ value, label }）
//   ALLOW  … 値の一覧（['A', 'B'] / { A: 0, B: 0 } / 1 行 1 値の配列）
//   TYPE   … TypeScript の型の列挙（'A' | 'B'）。コードが分岐できる値の型なので残す
//   BRANCH … コードでの振る舞い分岐。仕様なので残す（件数のみ）
// 選択肢・名称はマスタから引く（GAS: readMasterOptions_ / masterLabel_、画面: src/shared/masterOptions.ts）。
// 許可するのは ALLOWED の理由に当たるものだけ。docs/309。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const gasPath = path.join(ROOT, 'gas-src', 'Code.full.gs');
const gas = fs.readFileSync(gasPath, 'utf8');
const LIST = process.argv.includes('--list');
const CHECK = process.argv.includes('--check');

function evalVar(name) {
  const s = gas.indexOf(`var ${name} = {`);
  const e = gas.indexOf('\n};', s) + 3;
  return { value: new Function(gas.slice(s, e) + `\nreturn ${name};`)(), start: gas.slice(0, s).split('\n').length, end: gas.slice(0, e).split('\n').length };
}
const definition = evalVar('マスタ定義').value;
const seed = evalVar('マスタ初期値');
const permissions = evalVar('ADMIN_ACTION_PERMISSIONS');
const SKIP_MASTERS = new Set(['M_申込者区分']); // v360 で廃止（全行 有効=false）
const masters = Object.keys(definition).filter((n) => !SKIP_MASTERS.has(n)).map((name) => ({
  name, codes: (seed.value[name] || []).map((r) => String(r[0])), labels: (seed.value[name] || []).map((r) => String(r[1])),
}));
const unseeded = masters.filter((m) => !m.codes.length).map((m) => m.name);

// 残してよいもの（ファイル + 行の中身）。行番号ではなく中身で当てる。理由は docs/309 §5.5
const ALLOWED = [
  { file: /^src\/shared\/memberTypes\.mjs$/, reason: 'マスタが届く前だけ使う会員種別の既定値（build で GAS へも注入）' },
  { file: /^src\/shared\/masterOptions\.ts$|^src\/shared\/memberTypeMaster\.ts$/, reason: 'マスタを配る口' },
  { file: /^src\/components\/LinePostConsole\.tsx$/, reason: 'LINE 投稿の状態・対象（DRAFT/TRAINING/GENERAL）。M_ マスタではない' },
  { file: /^src\/shared\/mailCategories\.ts$/, reason: 'メール種別のキー（STAFF/TRAINING）。M_ マスタではない' },
  { file: /^src\/App\.tsx$/, text: /\['MASTER', 'ADMIN'(, 'TRAINING_MANAGER', 'TRAINING_REGISTRAR')?\]\.includes\(/, reason: '権限の方針（どの権限が操作できるか）' },
  { file: /^src\/App\.tsx$/, text: /<option value="MASTER">/, reason: '設定値（ログ閲覧権限の組み合わせ MASTER / MASTER,ADMIN）' },
  { file: /./, text: /<option value="[A-Z_]+">\{masterLabel\(/, reason: '絞り込みの値は GAS 側の仕様、名称はマスタ' },
  { file: /^src\/components\/OfficerManagement\.tsx$/, text: /value="ACTIVE">現職/, reason: '役員の任期の状態。M_会員状態 ではない' },
  { file: /^src\/components\/(TrainingManagement|TrainingList)\.tsx$|^src\/App\.tsx$/, text: /OPEN|CLOSED/, reason: '締切日から計算した受付状態（M_研修状態 の OPEN/CLOSED は旧行・無効）' },
  { file: /./, text: /acc\.unit === 'STAFF'|applicantType === 'STAFF'|STAFF: '事業所職員'|v: 'STAFF'|cat === 'STAFF'|key: 'outputCategory'/, reason: '申込者区分・出力単位の STAFF。M_職員権限 ではない' },
  { file: /^src\/components\/Sidebar\.tsx$/, text: /role === 'ADMIN'/, reason: 'ログインの種別。M_職員権限 ではない' },
  { file: /./, text: /&& <span className="[^"]*">\{masterLabel\(/, reason: 'バッジの色だけをコードで決め、文字はマスタ' },
  { file: /^src\/components\/application\/MemberApplicationForm\.tsx$/, text: /form\.memberType === 'BUSINESS' \?/, reason: '事業所会員の画面の見出し（種別ごとの振る舞い）' },
  { file: /^src\/components\/MemberForm\.tsx$/, text: /賛助会員は任意|退会申請を受け付けました/, reason: '種別・状態ごとの振る舞いの文言' },
  { file: /^src\/components\/StaffDetailAdmin\.tsx$/, text: /除籍する' : '復帰する/, reason: '操作の文言（状態ごとの振る舞い）' },
  { file: /^gas-src\//, text: /createPasswordAuthRow_|'INDIVIDUAL_MEMBER',$/, reason: '負荷試験用データの生成' },
];
const isAllowed = (file, text) => ALLOWED.some((a) => a.file.test(file) && (!a.text || a.text.test(text)));

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
  return m.codes.filter((c) => new RegExp(`['"\`]${esc(c)}['"\`]|MemberType\\.${esc(c)}\\b|value=["']${esc(c)}["']|(?:^|[\\s{,])${esc(c)}\\s*:(?!:)`).test(line));
}

function classify(line, hits, prevLine) {
  if (/<option\b/.test(line)) return 'OPTION';
  const c = hits.map(esc).join('|');
  if (new RegExp(`(?:${c})['"\`]?\\s*\\]?\\s*:\\s*['"\`]${JP}`).test(line)) return 'LABEL';
  if (new RegExp(`['"\`](?:${c})['"\`]\\s*\\?\\s*['"\`]${JP}|[=!]==\\s*(?:MemberType\\.)?['"\`]?(?:${c})['"\`]?\\s*\\)?\\s*\\?\\s*['"\`]?${JP}`).test(line)) return 'LABEL';
  if (new RegExp(`case\\s+['"\`](?:${c})['"\`]\\s*:\\s*return\\s+['"\`]${JP}`).test(line)) return 'LABEL';
  if (new RegExp(`\\b(?:v|value|code|key)\\s*:\\s*['"\`](?:${c})['"\`].*\\blabel\\s*:`).test(line)) return 'LABEL';
  if (/&&\s*<span/.test(line) && new RegExp(`===\\s*['"\`](?:${c})`).test(line)) return 'LABEL';
  if (hits.length >= 2 && /\|/.test(line) && /(type\s+\w+\s*=|:\s*['"`]|<['"`]|useState<)/.test(line) && !/\|\|/.test(line)) return 'TYPE';
  // ['A', 'B'] — 配列の要素としてコードが並ぶ（row['列名'] のような添字は数えない）
  if (hits.length >= 2 && new RegExp(`\\[\\s*['"\`](?:${c})['"\`]`).test(line)) return 'ALLOW';
  // { A: 0, B: 0 } のようにコードを鍵に並べた一覧
  if (hits.length >= 2 && new RegExp(`(?:^|[\\s{,])(?:${c})\\s*:(?!:)[^,]*,\\s*(?:${c})\\s*:`).test(line)) return 'ALLOW';
  // 1 行 1 値の配列（[ の次の行から 'A', 'B', と並ぶ形）
  if (new RegExp(`^['"\`](?:${c})['"\`],?$`).test(line.trim()) && /(\[|['"`],?)$/.test(prevLine.trim())) return 'ALLOW';
  return 'BRANCH';
}

const rows = [];
for (const file of files) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((raw, i) => {
    const ln = i + 1;
    if (file === gasPath && ln >= seed.start && ln <= seed.end) return;
    // 権限の方針（どの権限がどの操作をできるか）はマスタの値の一覧ではない
    if (file === gasPath && ln >= permissions.start && ln <= permissions.end) return;
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
    if (best) {
      rows.push({ master: best.m.name, kind: classify(raw, best.hits, lines[i - 1] || ''), file: rel, line: ln, codes: best.hits, text: t.slice(0, 110), allowed: isAllowed(rel, t) });
    }
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
  g.allowed = g.items.every((x) => x.allowed);
}

const violations = [
  ...groups.filter((g) => !g.allowed).map((g) => `OPTION ${g.file}:${g.start}-${g.end}  ${g.master} ${g.codes.join(',')}`),
  ...rows.filter((x) => (x.kind === 'LABEL' || x.kind === 'ALLOW') && !x.allowed).map((x) => `${x.kind.padEnd(6)} ${x.file}:${x.line}  ${x.master}  ${x.text}`),
];

if (CHECK) {
  if (unseeded.length) console.log(`[audit-master-hardcode] 初期値の無いマスタ（値をソースと照合できない）: ${unseeded.join(', ')}`);
  if (violations.length) {
    console.error(`[audit-master-hardcode] FAIL ${violations.length} 件: マスタの値を直書きしている（マスタから引くこと・docs/309）`);
    violations.forEach((v) => console.error('  ✗ ' + v));
    process.exit(1);
  }
  console.log(`[audit-master-hardcode] PASS （マスタ ${masters.length} 表 / 許可した行 ${rows.filter((x) => x.allowed && x.kind !== 'BRANCH').length}）`);
} else {
  console.log('master'.padEnd(14), ['OPTION群', 'LABEL', 'ALLOW', 'TYPE', 'BRANCH', '要修正'].map((k) => k.padStart(8)).join(''));
  for (const m of masters) {
    const r = rows.filter((x) => x.master === m.name);
    const n = (k) => r.filter((x) => x.kind === k).length;
    const bad = groups.filter((g) => g.master === m.name && !g.allowed).length + r.filter((x) => (x.kind === 'LABEL' || x.kind === 'ALLOW') && !x.allowed).length;
    console.log(m.name.padEnd(14), [groups.filter((g) => g.master === m.name).length, n('LABEL'), n('ALLOW'), n('TYPE'), n('BRANCH'), bad]
      .map((v) => String(v).padStart(8)).join(''));
  }
  if (unseeded.length) console.log(`初期値の無いマスタ（値をソースと照合できない）: ${unseeded.join(', ')}`);
  if (LIST) violations.forEach((v) => console.log('  ' + v));
}
