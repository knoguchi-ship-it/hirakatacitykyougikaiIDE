// 常設指示の条文を機械抽出して棚卸し表を作る（docs/296 §7）。
//
// なぜ機械抽出なのか: 条文 242 件のうち根拠が辿れるのは 21% だけで、
// 残りは読んでも「過去の事故の瘢痕」か「思いつき」か区別がつかない。
// AI の判断で落とすと半年後に同じ事故が起きる。
// **落とす判断は operator が行う。** そのための材料を漏れなく並べるのがこのスクリプト。
//
// 出力: docs/297_RULES_INVENTORY_2026-10-02.md
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const SOURCES = [
  'AGENTS.md',
  'CLAUDE.md',
  'GLOBAL_GROUND_RULES/docs/AI_RULES/00_OPERATING_MODEL.md',
  'GLOBAL_GROUND_RULES/docs/AI_RULES/05_PROJECT_RULES_HIRAKATA.md',
  'GLOBAL_GROUND_RULES/docs/AI_RULES/10_WORKFLOW_AND_QUALITY.md',
  'GLOBAL_GROUND_RULES/docs/AI_RULES/20_SECURITY_APPROVALS.md',
  'GLOBAL_GROUND_RULES/docs/AI_RULES/30_ERROR_MEMORY.md',
  'GLOBAL_GROUND_RULES/docs/AI_RULES/40_DOCS_AND_TEACHING.md',
];

// 条文が「どの層へ行くべきか」の推定。確定ではなく operator の判断材料。
const LAYER_RULES = [
  { layer: 'L0 絶対', re: /秘密|シークレット|pepper|資格情報|credential|\.env|ハードコーディング|認証境界|whitelist|不可逆|破壊|seedDemoData|禁止|してはならない|拒否する/ },
  { layer: 'L1 固定値', re: /deployment|clasp|scope|スコープ|Script Propert|URL|プロジェクト|split/i },
  { layer: 'L2 機械', re: /npm run|test:|prerelease|audit|検査|落ちる|FAIL|ゲート/ },
  { layer: 'L4 手順', re: /手順|順序|読む|実行する|更新する|同ターン|完了条件|報告/ },
];

// 根拠の種類
const EVIDENCE = [
  { kind: '版番号', re: /\bv\d{2,3}(\.\d+)*\b/ },
  { kind: 'docs 参照', re: /docs\/\d{2,3}|docs\/spec|HANDOVER/ },
  { kind: 'MEMORY', re: /feedback_|MEMORY/ },
  { kind: '日付', re: /20\d\d-\d\d-\d\d/ },
  { kind: '節参照', re: /§/ },
];

// 機械検査で守られているか（テスト名・ゲート名への言及）
const ENFORCED = /npm run (test:|security:|prerelease)|test:[a-z-]+|hook|PreToolUse/i;

function classify(text) {
  const layer = LAYER_RULES.find((r) => r.re.test(text))?.layer || 'L3 人';
  const evidence = EVIDENCE.filter((e) => e.re.test(text)).map((e) => e.kind);
  return { layer, evidence, enforced: ENFORCED.test(text) };
}

const rows = [];
for (const rel of SOURCES) {
  const abs = path.join(root, ...rel.split('/'));
  if (!fs.existsSync(abs)) continue;
  const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
  let section = '（冒頭）';
  lines.forEach((line, i) => {
    const h = line.match(/^#{2,4}\s+(.+?)\s*$/);
    if (h) { section = h[1]; return; }
    const t = line.trim();
    if (!/^[-*]\s+/.test(t)) return;        // 箇条書きだけ
    if (t.replace(/^[-*]\s+/, '').length < 30) return; // 短い列挙は条文とみなさない
    const body = t.replace(/^[-*]\s+/, '');
    rows.push({ file: rel, line: i + 1, section, body, ...classify(body) });
  });
}

const byLayer = {};
for (const r of rows) (byLayer[r.layer] ||= []).push(r);
const withEvidence = rows.filter((r) => r.evidence.length).length;
const enforced = rows.filter((r) => r.enforced).length;

const esc = (s) => s.replace(/\|/g, '\\|');
const out = [];
out.push('# 常設指示 条文棚卸し（2026-10-02）');
out.push('');
out.push('`node scripts/inventory-rules.mjs` が生成する。**手で編集しない。**');
out.push('');
out.push('## これは何か');
out.push('');
out.push('グランドルール再構築（`docs/296`）のための材料。');
out.push('**落とす判断は operator が行う。** AI は並べるだけで、削除候補を決めない。');
out.push('');
out.push('理由: 条文の多くは過去の本番事故の瘢痕だが、根拠が書かれていないものが大半を占める。');
out.push('読んでも「瘢痕」か「思いつき」か区別できず、判断で落とすと同じ事故が再発する。');
out.push('');
out.push('## 全体');
out.push('');
out.push('| | 件数 |');
out.push('|---|---|');
out.push(`| 条文（30 字以上の箇条書き） | **${rows.length}** |`);
out.push(`| 根拠が辿れる（版番号 / docs / MEMORY / 日付 / 節参照） | ${withEvidence}（${Math.round(withEvidence / rows.length * 100)}%） |`);
out.push(`| 機械検査に言及している | ${enforced}（${Math.round(enforced / rows.length * 100)}%） |`);
out.push('');
out.push('### 層の内訳（推定。確定ではない）');
out.push('');
out.push('| 層 | 件数 |');
out.push('|---|---|');
for (const [layer, list] of Object.entries(byLayer).sort()) out.push(`| ${layer} | ${list.length} |`);
out.push('');
out.push('### ファイル別');
out.push('');
out.push('| ファイル | 条文 | 根拠あり |');
out.push('|---|---|---|');
for (const rel of SOURCES) {
  const list = rows.filter((r) => r.file === rel);
  if (!list.length) continue;
  out.push(`| \`${rel}\` | ${list.length} | ${list.filter((r) => r.evidence.length).length} |`);
}
out.push('');
out.push('## 一覧');
out.push('');
out.push('`根拠` が空の条文は、**なぜその規約があるのかが文書から辿れない**ことを意味する。');
out.push('落とす判断の前に、operator が背景を知っていれば書き足す。');
out.push('');

for (const [layer, list] of Object.entries(byLayer).sort()) {
  out.push(`### ${layer}（${list.length} 件）`);
  out.push('');
  out.push('| # | 出所 | 節 | 条文 | 根拠 | 検査 |');
  out.push('|---|---|---|---|---|---|');
  list.forEach((r, i) => {
    const where = `${r.file.split('/').pop()}:${r.line}`;
    const body = esc(r.body).slice(0, 160) + (r.body.length > 160 ? '…' : '');
    out.push(`| ${i + 1} | ${where} | ${esc(r.section).slice(0, 28)} | ${body} | ${r.evidence.join('/') || '**不明**'} | ${r.enforced ? '有' : ''} |`);
  });
  out.push('');
}

const target = path.join(root, 'docs', '297_RULES_INVENTORY_2026-10-02.md');
fs.writeFileSync(target, out.join('\n') + '\n', 'utf8');
console.log(`条文 ${rows.length} 件 / 根拠あり ${withEvidence} 件 / 検査言及 ${enforced} 件`);
for (const [layer, list] of Object.entries(byLayer).sort()) console.log(`  ${layer}: ${list.length}`);
console.log(`→ docs/297_RULES_INVENTORY_2026-10-02.md`);
