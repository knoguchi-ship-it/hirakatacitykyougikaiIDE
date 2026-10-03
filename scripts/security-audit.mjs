// 依存の脆弱性ゲート（2026-10-03 新設 / docs/296）。
//
// `npm audit --audit-level=high` を直接ゲートにしていたが、2 つの不足があった。
//
//   1. **評価済みの勧告を記録できない。** npm audit に ID 単位の抑制オプションは無く、
//      `--audit-level` を下げるか `--omit=dev` で丸ごと外すかしかない。どちらも
//      「見なかったことにする」側に倒れ、新しい危険まで見えなくなる。
//   2. **結果が自分たちの変更と無関係に変わる。** 外部 DB を引くため、コードを一行も
//      変えていないのに通ったり落ちたりする（2026-10-03 に実際に起きた）。
//
// そこで npm audit は**素のまま全件**実行し、何をもって失敗とするかだけをここで決める。
// 引数で絞らないので情報は失われない。隠すのではなく、見たうえで通す。
//
// 判定:
//   - **本番依存の high 以上は常に落とす。** 受容リストに書いてあっても落とす
//   - 開発依存の high 以上は、受容リストにあり reviewBy 以内なら通す
//   - 受容リストに無ければ落とす
//   - reviewBy を過ぎていたら落とす（受容を永久放置にしない）
//   - 受容リストにあるのに検出されなくなっていたら、一覧から外すよう促す（落とさない）
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const BLOCKING = new Set(['high', 'critical']);
const LIST_PATH = path.join(root, 'security-advisories.json');

// シェル経由で起動する。Windows の npm は npm.cmd で、Node 20 以降は
// execFileSync からの .cmd 直接起動が EINVAL で拒否されるため。
// 組み立てる文字列は固定のリテラルだけで、外部入力は一切混ざらない。
/** npm audit は脆弱性があると非ゼロで終わる。stdout は捨てずに拾う */
function runAudit(extraArgs) {
  const args = ['audit', '--json', ...extraArgs];
  const command = `npm ${args.join(' ')}`;
  try {
    return JSON.parse(execSync(command, {
      cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    }));
  } catch (err) {
    if (err.stdout) {
      try { return JSON.parse(err.stdout); } catch { /* fallthrough */ }
    }
    // ここに来るのは「npm が見つからない」「ネットワークが切れている」「JSON が壊れている」のいずれか。
    // 原因を推測で書くと調査が遠回りになるので、生のエラーをそのまま出す。
    console.error(`[security-audit] \`${command}\` を完了できませんでした。`);
    console.error(`  ${String(err.message || err).split('\n')[0]}`);
    process.exit(1);
  }
}

/**
 * 勧告 ID（GHSA）を取り出す。
 *
 * npm audit の `via` は 2 種類が混ざる。
 *   - 勧告そのもの（オブジェクト。`url` に GHSA が入る）… 根本の脆弱パッケージ
 *   - 親パッケージ名（文字列）… そこを経由して影響を受けているだけ
 *
 * 後者は ID を持たないため、**文字列を辿って根本の勧告まで降りる**。
 * これをしないと micromatch / @google/clasp / vite-plugin-singlefile が
 * 「未評価」に見えてしまう（実体は braces の 1 件）。
 */
function advisoryIds(report, name, seen = new Set()) {
  if (seen.has(name)) return [];
  seen.add(name);
  const entry = (report.vulnerabilities || {})[name];
  if (!entry) return [];
  const ids = new Set();
  for (const via of entry.via || []) {
    if (typeof via === 'object') {
      const m = String(via.url || '').match(/(GHSA-[0-9a-z-]+)/i);
      if (m) ids.add(m[1]);
      else if (via.source != null) ids.add(`npm-${via.source}`);
    } else {
      for (const id of advisoryIds(report, String(via), seen)) ids.add(id);
    }
  }
  return [...ids];
}

function collect(report) {
  const out = [];
  for (const [name, entry] of Object.entries(report.vulnerabilities || {})) {
    if (!BLOCKING.has(entry.severity)) continue;
    out.push({ name, severity: entry.severity, ids: advisoryIds(report, name) });
  }
  return out;
}

// ── 読み込み ────────────────────────────────────────────────────────────────
let accepted = [];
if (fs.existsSync(LIST_PATH)) {
  accepted = JSON.parse(fs.readFileSync(LIST_PATH, 'utf8')).accepted || [];
}

const all = collect(runAudit([]));
const prodOnly = collect(runAudit(['--omit=dev']));
const prodNames = new Set(prodOnly.map((v) => v.name));

const today = new Date().toISOString().slice(0, 10);
const byId = new Map();
for (const a of accepted) byId.set(a.id, a);

const failures = [];
const passed = [];
const usedIds = new Set();

for (const v of all) {
  const scope = prodNames.has(v.name) ? 'prod' : 'dev';
  const hit = v.ids.map((id) => byId.get(id)).find(Boolean);

  if (scope === 'prod') {
    failures.push(`${v.name}（${v.severity}・**本番依存**）: 受容リストの対象外。出荷物に含まれる依存は常に止める`);
    continue;
  }
  if (!hit) {
    failures.push(`${v.name}（${v.severity}・開発依存）: 未評価。security-advisories.json に理由と reviewBy を書くか、修正する`);
    continue;
  }
  usedIds.add(hit.id);
  if (!hit.reviewBy || hit.reviewBy < today) {
    failures.push(`${v.name}（${v.severity}）: 受容期限 ${hit.reviewBy || '未設定'} を過ぎている。再審査して reviewBy を更新するか、修正する`);
    continue;
  }
  passed.push(`${v.name}（${v.severity}・開発依存）— 評価済み / 再審査 ${hit.reviewBy}`);
}

// 検出されなくなった受容（掃除を促す。落とさない）
const stale = accepted.filter((a) => !usedIds.has(a.id));

// ── 出力 ────────────────────────────────────────────────────────────────────
console.log('[security-audit]');
console.log(`  検出（high 以上）: ${all.length} 件 / うち本番依存 ${prodOnly.length} 件`);
for (const line of passed) console.log(`  受容  ${line}`);
for (const a of stale) console.log(`  ★不要 ${a.id}（${a.packages?.join(', ')}）はもう検出されません。security-advisories.json から外してください`);

if (failures.length) {
  console.error('');
  console.error('[security-audit] FAIL');
  for (const f of failures) console.error(`  - ${f}`);
  console.error('');
  console.error('  本番依存に出た勧告は受容できません。開発依存は security-advisories.json へ');
  console.error('  「到達経路・なぜ直せないか・再審査期限」を書いたうえで受容してください。');
  process.exit(1);
}

console.log('  PASS');
