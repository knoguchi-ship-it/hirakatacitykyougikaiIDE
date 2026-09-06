/**
 * v376.88 公開ポータルの本人確認（氏名＋番号 1 つ）の検査。
 *
 * 画面（TS）とサーバ（.gs）が別ファイルなので、食い違うと
 * 「画面には出るのにサーバが弾く」という分かりにくい壊れ方をする。
 * ここで両者の定義が一致していることを機械で押さえる。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PUBLIC_IDENTITY_CREDENTIALS,
  PUBLIC_IDENTITY_NAME_KIND,
  PUBLIC_IDENTITY_TYPE_CARDS,
  normalizeCredentialForKey,
  normalizePhoneForKey,
  type PublicIdentityMemberType,
} from '../src/shared/publicIdentity.ts';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const gas = fs.readFileSync(path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');

const TYPES: PublicIdentityMemberType[] = ['INDIVIDUAL', 'BUSINESS', 'SUPPORT'];

/** サーバ側 PUBLIC_IDENTITY_CREDENTIALS_ から 種別 → key[] を読む */
function serverCredentials(): Record<string, string[]> {
  const start = gas.indexOf('var PUBLIC_IDENTITY_CREDENTIALS_ = {');
  assert.notEqual(start, -1, 'サーバ側の定義が見つからない');
  const body = gas.slice(start, gas.indexOf('\n};', start));
  const out: Record<string, string[]> = {};
  for (const type of TYPES) {
    const block = body.slice(body.indexOf(`${type}: [`));
    const end = block.indexOf('],');
    assert.notEqual(end, -1, `${type} の定義が閉じていない`);
    out[type] = [...block.slice(0, end).matchAll(/key:\s*'([^']+)'/g)].map((m) => m[1]);
  }
  return out;
}

test('照合項目の顔ぶれが画面とサーバで一致する', () => {
  const server = serverCredentials();
  for (const type of TYPES) {
    assert.deepEqual(
      PUBLIC_IDENTITY_CREDENTIALS[type].map((c) => c.key),
      server[type],
      `${type} の照合項目が食い違っている`
    );
  }
});

test('3 種別すべてが本人確認に対応している', () => {
  // 賛助会員は RD §2 で「自己情報の更新・退会申請」を認められているのに、
  // v376.87 まで種別選択にすら出ていなかった。落とさないよう固定する。
  assert.deepEqual(PUBLIC_IDENTITY_TYPE_CARDS.map((c) => c.type), TYPES);
  for (const type of TYPES) {
    assert.ok(PUBLIC_IDENTITY_CREDENTIALS[type].length >= 1, `${type} に照合項目が無い`);
  }
});

test('賛助会員に介護支援専門員番号は出さない', () => {
  // 賛助会員は CM番号を持たない（入会フォームは個人会員のときだけ表示する）。
  const keys = PUBLIC_IDENTITY_CREDENTIALS.SUPPORT.map((c) => c.key);
  assert.ok(!keys.includes('cmNumber'), '賛助会員に CM番号が出ている');
  assert.ok(!keys.includes('officeNumber'), '賛助会員に事業所番号が出ている');
});

test('名義の照合方法が画面とサーバで一致する', () => {
  assert.equal(PUBLIC_IDENTITY_NAME_KIND.BUSINESS, 'office');
  assert.equal(PUBLIC_IDENTITY_NAME_KIND.INDIVIDUAL, 'person');
  assert.equal(PUBLIC_IDENTITY_NAME_KIND.SUPPORT, 'person');
  // サーバ側も事業所だけ勤務先名を見ていること
  const fn = gas.slice(gas.indexOf('function matchesPublicIdentityName_'));
  const body = fn.slice(0, fn.indexOf('\n}\n'));
  assert.ok(/memberType === 'BUSINESS'/.test(body), '事業所の分岐が無い');
  assert.ok(body.includes("member['勤務先名']"), '事業所名の照合が無い');
  assert.ok(body.includes("member['姓']") && body.includes("member['名']"), '姓名の照合が無い');
});

test('電話番号の正規化はハイフン・空白・全角を吸収する', () => {
  for (const input of ['072-859-9100', '072 859 9100', '０７２８５９９１００', '(072)859-9100']) {
    assert.equal(normalizePhoneForKey(input), '0728599100', `${input} が揃わない`);
  }
  assert.equal(normalizePhoneForKey(''), '');
  assert.equal(normalizePhoneForKey('---'), '', '数字が無ければ空になること');
});

test('番号系の正規化は空白除去と大文字化のみ', () => {
  assert.equal(normalizeCredentialForKey('cmNumber', ' 12345678 '), '12345678');
  assert.equal(normalizeCredentialForKey('officeNumber', 'ab 12cd3456'), 'AB12CD3456');
});

test('サーバは照合項目をちょうど 1 つだけ受け付ける', () => {
  const fn = gas.slice(gas.indexOf('function verifyMemberIdentityForPublic_'));
  const body = fn.slice(0, fn.indexOf('\n}\n'));
  assert.ok(/supplied\.length !== 1/.test(body), 'ちょうど 1 つの検査が無い');
  // 2 つ入れて片方が空でも通る、という抜け道を作らないこと
  assert.ok(!/\|\|\s*payload\.phone/.test(body), '照合項目を OR で拾っている');
});

test('DB 側が空の行を一致とみなさない', () => {
  // 電話番号が未登録の会員は多い（187 名中 30 名）。空同士で一致させると
  // 誰でも他人になりすませる。ここは必ず弾く。
  const fn = gas.slice(gas.indexOf('function verifyMemberIdentityForPublic_'));
  const body = fn.slice(0, fn.indexOf('\n}\n'));
  assert.ok(/if\s*\(!dbValue\s*\|\|\s*dbValue !== idKey\)/.test(body), '空の DB 値を除いていない');
});

test('賛助会員の変更 allowlist から CM番号が外れている', () => {
  const start = gas.indexOf('var PUBLIC_SUPPORT_UPDATE_ALLOWLIST_');
  assert.notEqual(start, -1, '賛助会員の allowlist が無い');
  const body = gas.slice(start, start + 400);
  assert.ok(/!==\s*'careManagerNumber'/.test(body), 'CM番号を除いていない');
});

test('allowlist の種別分岐が三項演算子で書かれていない', () => {
  // 「INDIVIDUAL 以外＝事業所」と書くと賛助会員が事業所の allowlist を使う。
  // 実際にその状態だったので、表引きに寄せたことを固定する。
  assert.ok(!/memberType === 'INDIVIDUAL'\s*\?\s*PUBLIC_INDIVIDUAL_UPDATE_ALLOWLIST_/.test(gas),
    '三項演算子での分岐が残っている');
  assert.equal((gas.match(/publicUpdateAllowlistFor_\(/g) || []).length >= 3, true,
    '表引き関数が使われていない');
});
