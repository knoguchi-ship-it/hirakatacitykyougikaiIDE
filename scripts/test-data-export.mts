/**
 * v376.68 回帰テスト: 汎用データエクスポート（CSV）。
 *
 * 背景（docs/261 T-07）: GCP 移行後はスプレッドシートを直接開けなくなるため、
 * 任意のテーブルを CSV で出力する手段を GAS 側に先行実装した。
 *
 * この機能は**会員の個人情報を丸ごと持ち出せる**ため、壊れると実害が大きい。
 * 次の 4 点を実ソースから抽出して機械検証する（ミラー実装にしない＝ドリフト防止）:
 *   1. 認証テーブルは常に出力できない（パスワードハッシュ・ソルトの流出防止）
 *   2. ログ系・設定は MASTER 限定
 *   3. CSV エスケープが RFC 4180 に従い、かつ数式インジェクションを無効化する
 *   4. 既定の権限が MASTER のみである（deny-by-default）
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');

function extractFunction(name: string): string {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が gas-src に見つからない`);
  const end = source.indexOf('\n}\n', start);
  assert.notEqual(end, -1, `${name} の終端が見つからない`);
  return source.slice(start, end + 3);
}

const csvEscapeCell_ = new Function(
  `${extractFunction('csvEscapeCell_')}; return csvEscapeCell_;`,
)() as (v: unknown) => string;

// ── CSV エスケープ ────────────────────────────────────────
test('通常の値はそのまま出る', () => {
  assert.equal(csvEscapeCell_('山田 太郎'), '山田 太郎');
  assert.equal(csvEscapeCell_(12345678), '12345678');
  assert.equal(csvEscapeCell_(null), '');
  assert.equal(csvEscapeCell_(undefined), '');
});

test('カンマ・引用符・改行を含む値は RFC 4180 でエスケープする', () => {
  assert.equal(csvEscapeCell_('枚方市, 大阪府'), '"枚方市, 大阪府"');
  assert.equal(csvEscapeCell_('彼は "ケアマネ" です'), '"彼は ""ケアマネ"" です"');
  assert.equal(csvEscapeCell_('1行目\n2行目'), '"1行目\n2行目"');
});

test('★CSV インジェクションを無効化する（数式として解釈させない）', () => {
  // Excel で開いたときに数式として実行されると、外部への情報送信に悪用されうる
  assert.equal(csvEscapeCell_('=1+1'), "'=1+1");
  assert.equal(csvEscapeCell_('+SUM(A1)'), "'+SUM(A1)");
  assert.equal(csvEscapeCell_('-2+3'), "'-2+3");
  assert.equal(csvEscapeCell_('@SUM(A1)'), "'@SUM(A1)");
  // 危険な先頭文字＋区切り文字の複合
  assert.equal(csvEscapeCell_('=HYPERLINK("http://x","a,b")'), `"'=HYPERLINK(""http://x"",""a,b"")"`);
});

// ── 出力禁止・MASTER 限定の契約 ────────────────────────────
test('★認証テーブルは常に出力できない（ハッシュ・ソルトの流出防止）', () => {
  const forbidden = source.slice(
    source.indexOf('var EXPORT_FORBIDDEN_TABLES_'),
    source.indexOf('var EXPORT_FORBIDDEN_TABLES_') + 200,
  );
  assert.match(forbidden, /T_認証アカウント/, '認証テーブルが禁止リストに無い');

  // v376.68 修正後は共通判定 isExportForbiddenTable_ を通す（アーカイブも同じ制限にするため）
  const fn = extractFunction('exportTableCsv_');
  assert.match(fn, /isExportForbiddenTable_\(name\)/, '禁止判定が無い');
  // 一覧側でも除外していること（画面に出さない）
  assert.match(extractFunction('listExportableTables_'), /isExportForbiddenTable_\(name\)/);
});

test('★ログ系と設定は MASTER 限定', () => {
  const block = source.slice(
    source.indexOf('var EXPORT_MASTER_ONLY_TABLES_'),
    source.indexOf('var EXPORT_MASTER_ONLY_TABLES_') + 400,
  );
  for (const t of ['T_監査ログ', 'T_ログイン履歴', 'T_メール送信ログ', 'T_メール送信明細', 'T_削除ログ', 'T_人物統合ログ', 'T_システム設定']) {
    assert.ok(block.includes(t), `${t} が MASTER 限定リストに無い`);
  }
  const fn = extractFunction('exportTableCsv_');
  assert.match(fn, /isExportMasterOnlyTable_\(name\) && !isMaster/, 'MASTER 判定が無い');
});

test('★未知のテーブル名を受け付けない（deny-by-default）', () => {
  const fn = extractFunction('exportTableCsv_');
  assert.match(fn, /hasOwnProperty\.call\(テーブル定義, name\)/);
  assert.match(fn, /hasOwnProperty\.call\(マスタ定義, name\)/);
  assert.match(fn, /未知のテーブルです/);
});

test('★既定の権限は MASTER のみ（事務局へは権限管理から明示的に付与する）', () => {
  assert.match(source, /'listExportableTables': \['MASTER'\]/, '既定が MASTER のみになっていない');
  assert.match(source, /'exportTableCsv': \['MASTER'\]/, '既定が MASTER のみになっていない');
});

test('★出力の事実を監査ログへ残す（持ち出し記録）', () => {
  const fn = extractFunction('exportTableCsv_');
  assert.match(fn, /appendExportAuditLog_\(/, '監査ログの記録が無い');
  const audit = extractFunction('appendExportAuditLog_');
  assert.match(audit, /EXPORT_TABLE_CSV/);
  // 中身（本文・個人情報）は残さない
  assert.doesNotMatch(audit, /csv|values|row\[/, '監査ログに出力内容を残してはならない');
});

test('実行時間の安全弁がある（行数上限）', () => {
  assert.match(source, /var EXPORT_MAX_ROWS_ = \d+/);
  const fn = extractFunction('exportTableCsv_');
  assert.match(fn, /exported >= EXPORT_MAX_ROWS_/);
  assert.match(fn, /truncated/);
});

// ── アーカイブテーブルの扱い（v376.68 修正） ────────────────
// live 確認で `T_認証アカウント_archive` が出力対象に混入していた。
// 削除アーカイブは元テーブルと同じ列（＝同じパスワードハッシュ）を持つため、同じ制限が要る。
test('★アーカイブ名から元テーブル名を導ける', () => {
  const fn = new Function(`${extractFunction('exportBaseTableName_')}; return exportBaseTableName_;`)() as (n: string) => string;
  assert.equal(fn('T_認証アカウント_archive'), 'T_認証アカウント');
  assert.equal(fn('T_会員_archive'), 'T_会員');
  assert.equal(fn('T_会員'), 'T_会員');
  assert.equal(fn('_archive'), '_archive', '接尾辞だけの名前は変換しない');
});

test('★禁止・MASTER 限定の判定がアーカイブにも及ぶ', () => {
  const forbidden = new Function(
    `var EXPORT_FORBIDDEN_TABLES_ = ['T_認証アカウント'];
     ${extractFunction('exportBaseTableName_')}
     ${extractFunction('isExportForbiddenTable_')}; return isExportForbiddenTable_;`,
  )() as (n: string) => boolean;
  assert.equal(forbidden('T_認証アカウント'), true);
  assert.equal(forbidden('T_認証アカウント_archive'), true, 'アーカイブが素通りしている');
  assert.equal(forbidden('T_会員'), false);

  const masterOnly = new Function(
    `var EXPORT_MASTER_ONLY_TABLES_ = ['T_監査ログ','T_ログイン履歴'];
     ${extractFunction('exportBaseTableName_')}
     ${extractFunction('isExportMasterOnlyTable_')}; return isExportMasterOnlyTable_;`,
  )() as (n: string) => boolean;
  assert.equal(masterOnly('T_ログイン履歴'), true);
  assert.equal(masterOnly('T_ログイン履歴_archive'), true);
  assert.equal(masterOnly('M_会員種別'), false);
});

test('★一覧・出力の両方が共通判定を通る（片方だけの修正を許さない）', () => {
  const list = extractFunction('listExportableTables_');
  const exp = extractFunction('exportTableCsv_');
  for (const fn of [list, exp]) {
    assert.match(fn, /isExportForbiddenTable_\(/, '禁止判定が共通関数を通っていない');
    assert.match(fn, /isExportMasterOnlyTable_\(/, 'MASTER 判定が共通関数を通っていない');
  }
});
