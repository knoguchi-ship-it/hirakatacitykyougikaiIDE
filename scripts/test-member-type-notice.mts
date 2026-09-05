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

// ── 4. 初期投入データ ─────────────────────────────────────────
function seedEntries(): Array<{ target: string; order: number; title: string; body: string }> {
  const start = gas.indexOf('var MEMBER_TYPE_NOTICE_SEED = [');
  assert.notEqual(start, -1, 'MEMBER_TYPE_NOTICE_SEED が見つからない');
  const end = gas.indexOf('\n];', start);
  const body = gas.slice(gas.indexOf('[', start), end + 2);
  return new Function(`return ${body};`)();
}

test('初期投入データは 3 種別分そろっている', () => {
  const entries = seedEntries();
  for (const target of ['INDIVIDUAL', 'BUSINESS', 'SUPPORT']) {
    const items = entries.filter(e => e.target === target);
    assert.ok(items.length >= 4, `${target} の項目が少ない（${items.length} 件）`);
    assert.ok(items.some(e => e.title.includes('入会について')), `${target} に入会の案内が無い`);
    assert.ok(items.some(e => e.title.includes('会費について')), `${target} に会費の案内が無い`);
    assert.ok(items.some(e => e.title.includes('退会')), `${target} に退会の案内が無い`);
  }
});

test('本文に金額をベタ書きしていない（正本は M_会員種別.年会費金額）', () => {
  for (const e of seedEntries()) {
    assert.ok(
      !/[0-9０-９][,，]?[0-9０-９]{3}\s*円/.test(e.body),
      `${e.target} 「${e.title}」の本文に金額が直接書かれている`
    );
    if (e.title.includes('会費について')) {
      assert.ok(e.body.includes('{{年会費}}'), `${e.target} の会費の案内に {{年会費}} が無い`);
    }
  }
});

test('紙の「入会申込書」を前提にした表現が残っていない', () => {
  for (const e of seedEntries()) {
    assert.ok(!e.body.includes('入会申込書'), `${e.target} 「${e.title}」に入会申込書の記述が残っている`);
    assert.ok(!e.body.includes('変更届'), `${e.target} 「${e.title}」に変更届の記述が残っている`);
    assert.ok(!e.body.includes('退会届'), `${e.target} 「${e.title}」に退会届の記述が残っている`);
  }
});

test('事業所には所属メンバー変更の申し出が明記されている', () => {
  const biz = seedEntries().filter(e => e.target === 'BUSINESS');
  assert.ok(
    biz.some(e => e.body.includes('事業所メンバー') && e.body.includes('速やかに')),
    '事業所メンバーの変更を速やかに申し出る旨が無い'
  );
});

test('投入は追記のみで、既存行を上書きしない', () => {
  const fn = gas.slice(gas.indexOf('function seedMemberTypeNoticesV376_74_APPLY('));
  const end = fn.indexOf('\nfunction ', 1);
  const body = end > 0 ? fn.slice(0, end) : fn;
  assert.ok(/appendRowsByHeaders_/.test(body), '追記していない');
  assert.ok(!/setValues|updateRowByKey_/.test(body), '既存行を書き換えている');
  assert.ok(/collectMissingMemberTypeNotices_/.test(body), '不足分の判定を通していない');
  assert.ok(/getScriptLock/.test(body), 'ロックを取得していない');
});
