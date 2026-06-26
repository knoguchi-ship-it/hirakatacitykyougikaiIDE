/**
 * 宛名リスト出力の発送区分回帰テスト。
 * 「広報誌のみ発送」は「お知らせ発送」対象を除いた広報誌発送候補として扱う。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveMailingDeliveryScope } from '../src/shared/mailingList.mjs';

test('事業所会員は発送方法に関わらずお知らせ発送対象', () => {
  assert.equal(
    resolveMailingDeliveryScope({ memberType: 'BUSINESS', mailingPreference: 'EMAIL' }),
    'OSHIRASE',
  );
});

test('個人・賛助で発送方法が郵送ならお知らせ発送対象', () => {
  assert.equal(
    resolveMailingDeliveryScope({ memberType: 'INDIVIDUAL', mailingPreference: 'POST' }),
    'OSHIRASE',
  );
  assert.equal(
    resolveMailingDeliveryScope({ memberType: 'SUPPORT', mailingPreference: 'POST' }),
    'OSHIRASE',
  );
});

test('個人・賛助で発送方法がメールなら広報誌のみ発送対象', () => {
  assert.equal(
    resolveMailingDeliveryScope({ memberType: 'INDIVIDUAL', mailingPreference: 'EMAIL' }),
    'KOHOUSHI_ONLY',
  );
  assert.equal(
    resolveMailingDeliveryScope({ memberType: 'SUPPORT', mailingPreference: 'EMAIL' }),
    'KOHOUSHI_ONLY',
  );
});

test('GAS レスポンスに分類済みフィールドがある場合はそれを優先', () => {
  assert.equal(
    resolveMailingDeliveryScope({
      memberType: 'INDIVIDUAL',
      mailingPreference: 'EMAIL',
      mailingDeliveryScope: 'OSHIRASE',
    }),
    'OSHIRASE',
  );
});

test('発送区分3択: 広報誌のみ発送はお知らせ発送対象を除く', () => {
  const rows = [
    { id: 'biz', memberType: 'BUSINESS', mailingPreference: 'EMAIL' },
    { id: 'ind-post', memberType: 'INDIVIDUAL', mailingPreference: 'POST' },
    { id: 'ind-email', memberType: 'INDIVIDUAL', mailingPreference: 'EMAIL' },
    { id: 'sup-email', memberType: 'SUPPORT', mailingPreference: 'EMAIL' },
  ];
  const only = rows
    .filter((row) => resolveMailingDeliveryScope(row) === 'KOHOUSHI_ONLY')
    .map((row) => row.id);
  assert.deepEqual(only, ['ind-email', 'sup-email']);
});
