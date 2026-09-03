// v376.67: 「同じ値・同じ判定を複数箇所で決めていないか」を機械検査するゲート。
//
// 背景（2026-09-03 operator 指示）:
// 開発初期に DRY 原則を敷かずに進めたため、同種の処理が別ルートを通る箇所が残っていた。
// 実際に次の 2 件が本番障害になった:
//   - v376.66: 事業所メールだけ差し込み変数が渡っておらず {{会員種別}} が生のまま届いた
//   - v376.46: 「在籍中」の判定が会員リストと宛先リストで別実装＝人数がぶれた
// 本ゲートは「単一情報源に寄せたものが、後から再び分岐していないか」を落とす。
//
// 検査対象（いずれも単一情報源へ集約済み）:
//   1. 入力検証パターン（src/shared/validators.ts）
//   2. 会員種別ラベル・年会費既定値（src/shared/memberTypes.mjs）
//   3. メール差し込みタグのカタログ（src/shared/mailTemplates.ts）
//   4. メール送信の出口（gas-src の deliverMail_ 一本）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      walk(full, out);
    } else if (/\.(ts|tsx|mjs)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const SRC_FILES = walk(path.join(ROOT, 'src'));
const rel = (f) => path.relative(ROOT, f).replace(/\\/g, '/');
const read = (f) => fs.readFileSync(f, 'utf8');
const GAS = read(path.join(ROOT, 'gas-src', 'Code.full.gs'));

// ── 1) 入力検証パターンの再定義禁止 ─────────────────────────
test('★検証パターンを shared/validators.ts の外で定義していない', () => {
  const offenders = [];
  for (const file of SRC_FILES) {
    if (rel(file) === 'src/shared/validators.ts') continue;
    const src = read(file);
    // 「= /.../」形式で メール / 郵便番号 / 電話 / 介護支援専門員番号 を定義していないか
    const patterns = [
      [/=\s*\/\^\[\^\\s@\]\+@/, 'メールアドレス'],
      [/=\s*\/\^\\d\{3\}-\??\\d\{4\}\$\//, '郵便番号'],
      [/=\s*\/\^\[0-9+?\\?-/, '電話番号'],
      [/=\s*\/\^\\d\{8\}\$\//, '介護支援専門員番号'],
    ];
    for (const [re, label] of patterns) {
      if (re.test(src)) offenders.push(`${rel(file)} (${label})`);
    }
  }
  assert.deepEqual(offenders, [],
    `検証パターンの重複定義: ${offenders.join(', ')} — src/shared/validators.ts から import すること`);
});

// ── 2) 会員種別ラベルの直書き禁止 ───────────────────────────
test('★会員種別ラベルを shared/memberTypes.mjs の外でマップ定義していない', () => {
  const offenders = [];
  for (const file of SRC_FILES) {
    if (rel(file) === 'src/shared/memberTypes.mjs') continue;
    const src = read(file);
    // `INDIVIDUAL: '個人会員'` のようなコード→ラベルの対応を再定義していないか
    if (/(INDIVIDUAL|BUSINESS|SUPPORT)\s*:\s*['"](個人会員|事業所会員|賛助会員)['"]/.test(src)) {
      offenders.push(rel(file));
    }
    // 三項演算子による分岐（=== 'INDIVIDUAL' ? '個人会員'）
    if (/===\s*['"]?(MemberType\.)?INDIVIDUAL['"]?\s*\)?\s*\?\s*['"]個人会員['"]/.test(src)) {
      offenders.push(rel(file) + ' (三項)');
    }
  }
  assert.deepEqual(offenders, [],
    `会員種別ラベルの重複定義: ${offenders.join(', ')} — MEMBER_TYPE_LABELS / memberTypeLabel() を使うこと`);
});

test('★年会費の既定値を shared/memberTypes.mjs の外に書いていない', () => {
  const offenders = [];
  for (const file of SRC_FILES) {
    if (rel(file) === 'src/shared/memberTypes.mjs') continue;
    const src = read(file);
    if (/INDIVIDUAL\s*:\s*3000\s*,\s*BUSINESS\s*:\s*8000/.test(src.replace(/\s+/g, ' '))) {
      offenders.push(rel(file));
    }
  }
  assert.deepEqual(offenders, [],
    `年会費既定値の重複定義: ${offenders.join(', ')} — MEMBER_TYPE_ANNUAL_FEE_DEFAULTS を使うこと`);
});

// ── 3) メール差し込みタグをカタログ外で列挙していない ────────
test('★UI がマージタグを直書きしていない（カタログ参照のみ）', () => {
  const app = read(path.join(ROOT, 'src', 'App.tsx'));
  const inline = app.match(/<MergeTags items=\{\[/g) || [];
  assert.equal(inline.length, 0,
    `App.tsx にマージタグの直書きが ${inline.length} 箇所ある — MAIL_TEMPLATE_MERGE_TAGS を参照すること`);
});

test('★カタログのカテゴリが GAS 側のカテゴリ一覧と一致する', () => {
  const shared = read(path.join(ROOT, 'src', 'shared', 'mailTemplates.ts'));
  const tsCats = (shared.match(/^\s{2}([A-Z_]+):\s*\[\[/gm) || [])
    .map((l) => l.trim().split(':')[0]).sort();
  const gasBlock = GAS.slice(GAS.indexOf('var MAIL_TEMPLATE_CATEGORIES_'), GAS.indexOf('var MAIL_TEMPLATE_CATEGORIES_') + 600);
  const gasCats = (gasBlock.match(/'([A-Z_]+)'/g) || []).map((x) => x.replace(/'/g, '')).sort();
  assert.ok(tsCats.length >= 14, `カタログのカテゴリ数が少ない: ${tsCats.length}`);
  assert.deepEqual(tsCats, gasCats,
    'src/shared/mailTemplates.ts と gas-src の MAIL_TEMPLATE_CATEGORIES_ が食い違っている');
});

// ── 4) メール送信の出口が 1 本であること ────────────────────
test('★メール送信は deliverMail_ → sendEmailWithValidatedFrom_ の一本道', () => {
  const rawSenders = (GAS.match(/\b(MailApp|GmailApp)\.sendEmail\(/g) || []).length;
  assert.equal(rawSenders, 2, `MailApp/GmailApp の直接呼び出しが増えている（${rawSenders} 箇所）`);
  const callers = (GAS.match(/sendEmailWithValidatedFrom_\(/g) || []).length;
  // 定義 1 + 呼び出し 1（deliverMail_ からのみ）
  assert.equal(callers, 2,
    'sendEmailWithValidatedFrom_ が deliverMail_ 以外から呼ばれている（キルスイッチと未解決タグ除去を迂回する）');
});

// ── 5) 会員種別ラベル/年会費が GAS でも単一情報源を通ること ──
test('★GAS 側も注入された memberTypeLabel_ / formatAnnualFee_ を使っている', () => {
  assert.match(GAS, /__MEMBER_TYPES_BUILD_INJECT_START__/, '注入マーカーが無い');
  const ternary = GAS.match(/===\s*'INDIVIDUAL'\s*\?\s*'個人会員'/g) || [];
  assert.deepEqual(ternary, [],
    `gas-src に会員種別ラベルの三項演算子が残っている（${ternary.length} 箇所）— memberTypeLabel_() を使うこと`);
  assert.doesNotMatch(GAS, /function formatAnnualFeeForMail_/,
    '旧 formatAnnualFeeForMail_ が残っている — 注入版 formatAnnualFee_ に一本化すること');
});

// ── 6) テンプレートのカテゴリと送信カテゴリの一致 ────────────
// v376.67: 研修リマインダーが TRAINING_REMINDER のテンプレートを描画しながら
// 'BULK_MAIL' カテゴリで送信していたため、設定「研修リマインダーメール」の
// 有効/無効トグルが効かず（＝死んだ設定）、「一括メール送信」を切ると
// 研修リマインダーまで止まっていた。送信ログのカテゴリも誤っていた。
test('★<CAT>_SUBJECT/BODY を描画したメールは同じ <CAT> で送信している', () => {
  const lines = GAS.split('\n');
  const mismatches = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /renderConfiguredMail_\([^,]+,\s*'([A-Z_]+)_SUBJECT'/.exec(lines[i]);
    if (!m) continue;
    const category = m[1];
    const window = lines.slice(i, i + 60).join('\n');
    const sent = /deliverMail_\('([A-Z_]+)'/.exec(window);
    // dryRun（描画のみで送信しない）は対象外
    if (!sent) continue;
    if (sent[1] !== category) mismatches.push(`line ${i + 1}: template=${category} sent=${sent[1]}`);
  }
  assert.deepEqual(mismatches, [],
    `テンプレートと送信カテゴリの不一致: ${mismatches.join(' / ')} — カテゴリ別 ON/OFF と送信ログが噛み合わない`);
});
