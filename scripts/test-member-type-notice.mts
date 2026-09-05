/**
 * v376.74 回帰テスト: 入会申込の「注意事項」ステップ。
 *
 * 固定するのは次の 4 点。
 *   1. ステップ構成（会員種別 → 注意事項 → …）が 3 種別とも崩れていないこと
 *   2. 注意事項に出すのは「全種別共通（ALL）＋ 選んだ種別」だけで、他種別の内容が混ざらないこと
 *   3. 本文の差し込みタグが会費に置き換わり、未対応タグが {{...}} のまま残らないこと
 *   4. 初期投入データが仕様どおり（3 種別分そろい、金額をベタ書きしていない）こと
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderRegulationBody } from '../src/shared/regulationText.ts';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const form = fs.readFileSync(path.join(ROOT, 'src', 'components', 'application', 'MemberApplicationForm.tsx'), 'utf8');
const gas = fs.readFileSync(path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');

const FEES = { INDIVIDUAL: 3000, BUSINESS: 8000, SUPPORT: 5000 };

// ── 1. ステップ構成 ────────────────────────────────────────────
test('注意事項は会員種別の次に置かれる（3 種別とも）', () => {
  for (const name of ['STEPS_INDIVIDUAL', 'STEPS_BUSINESS', 'STEPS_SUPPORT']) {
    const m = form.match(new RegExp(`const ${name} = \\[([^\\]]*)\\]`));
    assert.ok(m, `${name} が見つからない`);
    const labels = m[1].split(',').map(s => s.trim().replace(/^'|'$/g, ''));
    assert.equal(labels[0], '会員種別', `${name} の 1 番目`);
    assert.equal(labels[1], '注意事項', `${name} の 2 番目`);
    assert.equal(labels[labels.length - 1], '入力確認', `${name} の最後`);
    assert.equal(labels.length, 5, `${name} は 5 ステップ`);
  }
});

test('種別選択のゲート（旧ダイアログ）が残っていない', () => {
  assert.ok(!/noticeDialogOpen/.test(form), '重要事項ダイアログの状態が残っている');
  assert.ok(!/disabled=\{!noticeAccepted\}/.test(form), '種別カードが noticeAccepted で無効化されたままになっている');
  assert.ok(/step === 1 && !noticeAccepted/.test(form), '注意事項ステップのチェック必須が無い');
});

// ── 2. 種別ごとの出し分け ─────────────────────────────────────
test('注意事項の絞り込みが「ALL ＋ 選んだ種別」になっている', () => {
  assert.ok(
    /commonNoticeItems = noticeItems\.filter\(\(r\) => r\.target === 'ALL'\)/.test(form),
    '共通（ALL）の抽出が無い'
  );
  assert.ok(
    /memberTypeNoticeItems = regulationList[\s\S]{0,120}r\.target !== 'ALL' && r\.target === form\.memberType/.test(form),
    '種別ごとの抽出が無い、または他種別が混ざる条件になっている'
  );
});

// ── 3. 差し込みタグ ───────────────────────────────────────────
test('{{年会費}} は選択中の種別の会費に置き換わる', () => {
  assert.equal(
    renderRegulationBody('年会費として、{{年会費}}の納入をお願いします。', 'INDIVIDUAL', FEES),
    '年会費として、3,000円の納入をお願いします。'
  );
  assert.equal(
    renderRegulationBody('1事業所につき{{年会費}}', 'BUSINESS', FEES),
    '1事業所につき8,000円'
  );
  assert.equal(
    renderRegulationBody('1口につき{{年会費}}', 'SUPPORT', FEES),
    '1口につき5,000円'
  );
});

test('種別を指定したタグも使える（他種別に言及する文面のため）', () => {
  assert.equal(
    renderRegulationBody('個人{{個人会費}} / 事業所{{事業所会費}} / 賛助{{賛助会費}}', 'INDIVIDUAL', FEES),
    '個人3,000円 / 事業所8,000円 / 賛助5,000円'
  );
});

test('{{会員種別}} は種別名に置き換わる', () => {
  assert.equal(renderRegulationBody('{{会員種別}}について', 'BUSINESS', FEES), '事業所会員について');
});

test('未対応のタグは取り除く（{{...}} のまま利用者に見せない）', () => {
  assert.equal(renderRegulationBody('あ{{未知のタグ}}い', 'INDIVIDUAL', FEES), 'あい');
  assert.ok(!renderRegulationBody('{{未知}}', 'INDIVIDUAL', FEES).includes('{{'));
});

// ── 4. 文面と投入について ─────────────────────────────────────
//
// 文面の正本は **DB（T_規程）** で、管理画面から追加・編集・削除する。
// 初期投入と再編に使った operator ツール（seedMemberTypeNotices / applyNoticeRestructure /
// fixNoticeDisplayOrder）と、そこに埋め込んでいた文面の定数は、投入が完了したため
// v376.80 で gas-src から削除した（AGENTS.md §4.6 の棚卸し）。
// したがって「文面の中身」をコードに対して検査することはもうできない。
// 実行記録は docs/271 §6・docs/272 に残っている。
//
// ここに残すのは、DB の内容に依存しない**画面側のふるまい**だけとする。
test('種別ごとの案内は折りたためる（初期は閉じた状態）', () => {
  assert.ok(
    /const \[memberTypeNoticeOpen, setMemberTypeNoticeOpen\] = useState\(false\)/.test(form),
    '折りたたみの初期状態が閉じていない（operator 決定・v376.77）'
  );
  assert.ok(/memberTypeNoticeOpen && memberTypeNoticeItems\.map/.test(form), '折りたたみが効いていない');
  assert.ok(/aria-expanded=\{memberTypeNoticeOpen\}/.test(form), '開閉状態が支援技術へ伝わらない');
});

// ── 6. v376.76 の表示順是正・チェック文言 ─────────────────────
test('確認チェックの文言に、無くなった項目名を列挙していない', () => {
  // 画面に出る文字列だけを見る。変更理由を書いた JSX コメントには旧項目名が出てくるため
  // （ファイル全体を grep すると、そのコメントを拾ってしまう）。
  const jsx = form.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  const at = jsx.indexOf('上記の注意事項');
  assert.notEqual(at, -1, '新しい文言になっていない');
  const label = jsx.slice(at, at + 120);
  assert.ok(label.includes('全体および会員種別ごと'), '新しい文言になっていない');
  assert.ok(!/変更・退会手続き|退会期限|定款確認導線/.test(jsx), '再編で無くなった項目名が画面に残っている');
});