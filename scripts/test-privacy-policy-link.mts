/**
 * プライバシーポリシーのリンクを固定する。
 *
 * 背景（2026-10-02 operator 指摘）:
 * フッターと研修申込画面に「プライバシーポリシーは本サイトに掲載しています」とだけ書かれ、
 * **リンクが無かった**。同じころ、定款の掲載先が変わって `T_規程` の URL が古くなっていた
 * （`?authuser=0` 付きの旧 URL）。URL をコードに持つと、移動したときに
 * リリースしないと直せない。
 *
 * 方針:
 *   - URL は `T_システム設定` の `PUBLIC_PORTAL_PRIVACY_POLICY_URL` に置く（管理画面で編集）
 *   - 既定は**空**。コードに URL を書かない
 *   - 空のときは**リンクを出さない**（押せるのにどこへも飛ばない状態を作らない）
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), ...p.split('/')), 'utf8');
const gasSrc = read('gas-src/Code.full.gs');
const portalApp = read('src/public-portal/App.tsx');
const applyForm = read('src/public-portal/components/ExternalApplyForm.tsx');
const adminApp = read('src/App.tsx');

const KEY = 'PUBLIC_PORTAL_PRIVACY_POLICY_URL';

test('設定キーが端から端まで通っている', () => {
  // 読み出し（管理画面用）／戻り値／保存／初期行／公開ポータル用の読み出しと戻り値
  const occurrences = gasSrc.split(KEY).length - 1;
  assert.ok(occurrences >= 4, `${KEY} の配線が足りない（${occurrences} 箇所）`);
  assert.ok(gasSrc.includes('publicPortalPrivacyPolicyUrl: publicPortalPrivacyPolicyUrl'),
    '管理画面向けの戻り値に無い');
  assert.ok(gasSrc.includes('privacyPolicyUrl: publicPortalPrivacyPolicyUrl'),
    '公開ポータル向けの戻り値に無い');
});

test('★URL をコードに書かない（既定は空）', () => {
  // 定款は掲載先が変わって古い URL が残った。同じことを繰り返さない。
  for (const [label, source] of [
    ['gas-src', gasSrc], ['公開ポータル', portalApp], ['管理画面', adminApp],
  ] as const) {
    const m = source.match(/privacyPolicyUrl:\s*'([^']*)'/);
    if (m) assert.equal(m[1], '', `${label} の既定値に URL が直書きされている: ${m[1]}`);
  }
  assert.ok(!portalApp.includes('privacy-policy'), '公開ポータルに URL が直書きされている');
  assert.ok(!applyForm.includes('privacy-policy'), '研修申込画面に URL が直書きされている');
});

test('★保存時に空へ戻せる（既定で上書きしない）', () => {
  // 他の文言設定は `|| 既定値` で空を既定へ戻すが、URL は空＝リンクを出さない、という意思。
  const i = gasSrc.indexOf(`key: '${KEY}'`);
  assert.notEqual(i, -1);
  const line = gasSrc.slice(gasSrc.lastIndexOf('\n', i), gasSrc.indexOf('\n', i));
  assert.ok(!line.includes('|| PUBLIC_PORTAL_DEFAULTS'), '空にしても既定へ戻ってしまう');
});

test('★URL が空ならリンクを出さない', () => {
  // フッター
  const i = portalApp.indexOf('プライバシーポリシーについて');
  assert.notEqual(i, -1, 'フッターの文言が無い');
  const block = portalApp.slice(Math.max(0, i - 600), i);
  assert.ok(block.includes('privacyPolicyUrl') && block.includes('&&'),
    'URL の有無で出し分けていない');
  // 研修申込。冒頭の型コメントにも語が出るので、描画側の分岐を直接見る。
  const j = applyForm.indexOf('{privacyPolicyUrl && (');
  assert.notEqual(j, -1, '研修申込で出し分けていない');
  const block2 = applyForm.slice(j, j + 400);
  assert.ok(block2.includes('プライバシーポリシー'), '分岐の中にリンクが無い');
});

test('★「本サイトに掲載しています」という言い回しを残さない', () => {
  // リンクにした以上、どこに掲載されているかを文章で説明する必要はない。
  for (const [label, source] of [['公開ポータル', portalApp], ['研修申込', applyForm]] as const) {
    assert.ok(!source.includes('本サイトに掲載'), `${label} に古い言い回しが残っている`);
  }
});

test('リンクは新しいタブで安全に開く', () => {
  for (const [label, source] of [['公開ポータル', portalApp], ['研修申込', applyForm]] as const) {
    const i = source.indexOf('href={privacyPolicyUrl') >= 0
      ? source.indexOf('href={privacyPolicyUrl')
      : source.indexOf('href={portalContentSettings?.privacyPolicyUrl');
    assert.notEqual(i, -1, `${label} にリンクが無い`);
    const block = source.slice(i, i + 260);
    assert.ok(block.includes('target="_blank"'), `${label}: 新しいタブで開かない`);
    assert.ok(block.includes('rel="noopener noreferrer"'), `${label}: rel が無い（tabnabbing 対策）`);
  }
});

test('管理画面から編集できる', () => {
  assert.ok(adminApp.includes('publicPortalPrivacyPolicyUrlInput'), '入力欄の state が無い');
  assert.ok(adminApp.includes('publicPortalPrivacyPolicyUrl: publicPortalPrivacyPolicyUrlInput'),
    '保存ペイロードに入っていない');
  assert.ok(adminApp.includes('サイト情報'), '置き場（サイト情報）の見出しが無い');
});
