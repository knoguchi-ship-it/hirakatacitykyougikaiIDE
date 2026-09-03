/**
 * v376.66 回帰テスト: メール差し込みタグの解決。
 *
 * 実害（2026-09-03 operator 報告）:
 * 事業所会員の入会承認メールで `{{会員種別}}` `{{年会費}}` が**タグのまま会員へ届いた**。
 * 個人会員は正常だった。原因は送信経路が 2 本に分かれていたこと:
 *   - 個人 / 賛助 → sendCredentialEmail_（{{会員種別}} {{年会費}} を置換する）
 *   - 事業所     → renderBizEmailTemplate_(template, bizVars)（bizVars に両タグが無い＝素通り）
 * renderBizEmailTemplate_ は「渡された key だけ」を置換するため、未知のタグは原文のまま残る。
 *
 * 本テストは gas-src の実ソースから関数を抽出して評価し、次の 3 点を固定する:
 *   1. 事業所メールの差し込み変数に 会員種別 / 年会費 が含まれること（ソース契約）
 *   2. 年会費の整形が両経路で共通関数を通ること（3000 → 「3,000円」）
 *   3. 未解決タグは送信直前に必ず除去されること（最後の砦）
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GAS_SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'gas-src', 'Code.full.gs');
const source = fs.readFileSync(GAS_SRC, 'utf8');

// 波括弧の深さ数えは本ファイル対象の関数（正規表現に {{ }} を含む）で誤作動するため、
// この案件の gas-src が守っている「トップレベル関数の閉じ括弧は行頭の }」で切り出す。
function extractFunction(name: string): string {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が gas-src に見つからない`);
  const end = source.indexOf('\n}\n', start);
  assert.notEqual(end, -1, `${name} の終端が見つからない`);
  return source.slice(start, end + 3);
}

const formatAnnualFeeForMail_ = new Function(
  `${extractFunction('formatAnnualFeeForMail_')}; return formatAnnualFeeForMail_;`,
)() as (v: unknown) => string;

const renderBizEmailTemplate_ = new Function(
  `${extractFunction('renderBizEmailTemplate_')}; return renderBizEmailTemplate_;`,
)() as (tpl: string, vars: Record<string, unknown>) => string;

const logs: string[] = [];
const stripUnresolvedMergeTags_ = new Function(
  'Logger',
  `${extractFunction('stripUnresolvedMergeTags_')}; return stripUnresolvedMergeTags_;`,
)({ log: (m: string) => logs.push(m) }) as (t: string, c: string, p: string) => string;

// ── 年会費の整形 ──────────────────────────────────────────
test('年会費は 3 桁区切り＋「円」に整形される', () => {
  assert.equal(formatAnnualFeeForMail_(3000), '3,000円');
  assert.equal(formatAnnualFeeForMail_(8000), '8,000円');
  assert.equal(formatAnnualFeeForMail_('5000'), '5,000円');
  assert.equal(formatAnnualFeeForMail_(1000000), '1,000,000円');
});

test('未設定・0・不正値は空文字（「0円」と誤送しない）', () => {
  for (const v of [0, '', null, undefined, 'なし', -1]) {
    assert.equal(formatAnnualFeeForMail_(v), '');
  }
});

// ── 事業所メールの差し込み ────────────────────────────────
test('★回帰固定: 事業所メールの差し込み変数に 会員種別 / 年会費 がある', () => {
  const bizVarsBlock = source.slice(source.indexOf('var bizVars = {'), source.indexOf('var bizVars = {') + 600);
  assert.match(bizVarsBlock, /会員種別:/, '事業所メールに 会員種別 が渡っていない');
  assert.match(bizVarsBlock, /年会費:\s*formatAnnualFeeForMail_/, '事業所メールに整形済みの 年会費 が渡っていない');
});

test('★実害再現: 変数を渡せば事業所テンプレートでもタグが解決する', () => {
  const tpl = '{{氏名}} 様の会員種別は{{会員種別}}となります。\nその為、年会費は{{年会費}}となります。';
  const rendered = renderBizEmailTemplate_(tpl, {
    氏名: '平井 尚子',
    会員種別: '事業所会員',
    年会費: formatAnnualFeeForMail_(8000),
  });
  assert.equal(rendered, '平井 尚子 様の会員種別は事業所会員となります。\nその為、年会費は8,000円となります。');
  assert.doesNotMatch(rendered, /\{\{/, 'タグが残っている');
});

test('renderBizEmailTemplate_ は渡されなかったタグを素通しする（＝最後の砦が必要な理由）', () => {
  const rendered = renderBizEmailTemplate_('{{氏名}}／{{会員種別}}', { 氏名: '山田' });
  assert.equal(rendered, '山田／{{会員種別}}');
});

// ── 未解決タグの除去（最後の砦）────────────────────────────
test('★未解決タグは送信直前に除去される', () => {
  logs.length = 0;
  const out = stripUnresolvedMergeTags_('会員種別は{{会員種別}}、年会費は{{年会費}}です。', 'BIZ_REP_EMAIL', 'body');
  assert.equal(out, '会員種別は、年会費はです。');
  assert.equal(logs.length, 1);
  assert.match(logs[0], /unresolved-merge-tag/);
  assert.match(logs[0], /category=BIZ_REP_EMAIL/);
  assert.match(logs[0], /会員種別/);
});

test('タグが無い本文は変更されない（余計な加工をしない）', () => {
  const body = '入会申し込み、誠にありがとうございます。\n{ 波括弧単体 } は残す。';
  assert.equal(stripUnresolvedMergeTags_(body, 'CREDENTIAL_EMAIL', 'body'), body);
});

test('★送信の中枢（deliverMail_）で必ず通る', () => {
  const deliver = extractFunction('deliverMail_');
  assert.match(deliver, /subject = stripUnresolvedMergeTags_\(subject/, 'subject が素通りしている');
  assert.match(deliver, /body = stripUnresolvedMergeTags_\(body/, 'body が素通りしている');
});

// ── 正本の一致（UI が案内するタグ = 送信側が解決できるタグ）──
test('★管理画面が事業所メールで案内するタグを送信側が解決できる', () => {
  const appTsx = fs.readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'App.tsx'), 'utf8',
  );
  const line = appTsx.split(/\r?\n/).find((l) => l.includes("{/* 事業所 代表者 */}"));
  assert.ok(line !== undefined, '事業所代表者カードが見つからない');
  const idx = appTsx.indexOf('{/* 事業所 代表者 */}');
  const tagsBlock = appTsx.slice(idx, idx + 600);
  for (const tag of ['会員種別', '年会費']) {
    assert.ok(tagsBlock.includes(`{{${tag}}}`), `UI が ${tag} を案内していない`);
  }
});
