// v376.32: 公開ポータル研修ディープリンクの単体テスト。
// 実行: node --experimental-strip-types --no-warnings --test scripts/test-deeplink.mts
//
// 方針（OWASP Input Validation / deep-link testing best practice 準拠）:
//  - URL ビルダー / readDeepLink は実コード（src/config/publicPortal.ts, src/utils/deepLink.ts）を import して検証。
//  - サーバ側 sanitizeDeepLinkValue_ は GAS コード（gas-src/Code.full.gs）のため module import 不可。
//    本テストでは契約をミラーし allowlist / XSS 拒否 / 長さ制限 / null を網羅検証する。
//    実デプロイ済みコードの end-to-end 検証はライブ Playwright（?t=<script>… が無効化されること）で別途実施。
import { test } from 'node:test';
import assert from 'node:assert/strict';

// ── window モック（deepLink.ts は呼び出し時に window を参照する） ──
(globalThis as unknown as { window: { __APP_URL__?: string; __DEEPLINK__?: unknown } }).window = {
  __APP_URL__: 'https://script.google.com/macros/s/TESTID/exec',
};

const { buildPublicTrainingApplyUrl, PUBLIC_PORTAL_BASE_URL } = await import('../src/config/publicPortal.ts');
const { buildTrainingApplyUrl, buildPageUrl, getAppUrl, readDeepLink, consumeDeepLink } = await import('../src/utils/deepLink.ts');

// ── 実コード: src/config/publicPortal.ts ──
test('buildPublicTrainingApplyUrl: 正式 public URL + ?t=<id>', () => {
  assert.equal(
    buildPublicTrainingApplyUrl('abc-123'),
    `${PUBLIC_PORTAL_BASE_URL}?t=abc-123`,
  );
});
test('buildPublicTrainingApplyUrl: 特殊文字は URL エンコードされる', () => {
  assert.equal(buildPublicTrainingApplyUrl('a/b c'), `${PUBLIC_PORTAL_BASE_URL}?t=a%2Fb%20c`);
});

// ── 実コード: src/utils/deepLink.ts ──
test('getAppUrl: 注入済み __APP_URL__ を返す', () => {
  assert.equal(getAppUrl(), 'https://script.google.com/macros/s/TESTID/exec');
});
test('buildTrainingApplyUrl: base + ?t=<id>（エンコード）', () => {
  assert.equal(buildTrainingApplyUrl('id 1'), 'https://script.google.com/macros/s/TESTID/exec?t=id%201');
});
test('buildPageUrl: base + ?p=<page>', () => {
  assert.equal(buildPageUrl('member-application'), 'https://script.google.com/macros/s/TESTID/exec?p=member-application');
});
test('readDeepLink: __DEEPLINK__ から {trainingId, page} を読む', () => {
  (globalThis as unknown as { window: { __DEEPLINK__?: unknown } }).window.__DEEPLINK__ = { t: 'T123', p: '' };
  assert.deepEqual(readDeepLink(), { trainingId: 'T123', page: undefined });
});
test('readDeepLink: 未注入時は空オブジェクト', () => {
  (globalThis as unknown as { window: { __DEEPLINK__?: unknown } }).window.__DEEPLINK__ = undefined;
  assert.deepEqual(readDeepLink(), {});
});
test('consumeDeepLink: 適用後に __DEEPLINK__ を消去（二重適用防止）', () => {
  (globalThis as unknown as { window: { __DEEPLINK__?: unknown } }).window.__DEEPLINK__ = { t: 'X' };
  consumeDeepLink();
  assert.equal((globalThis as unknown as { window: { __DEEPLINK__?: unknown } }).window.__DEEPLINK__, undefined);
});

// ── サーバ側 sanitize（gas-src/Code.full.gs sanitizeDeepLinkValue_ のミラー）──
// allowlist: 英数 / - / _ のみ、最大 80 文字、deny-by-default。
function sanitizeDeepLinkValue(raw: unknown): string {
  if (raw == null) return '';
  let s = String(raw).trim();
  if (!s) return '';
  if (s.length > 80) s = s.slice(0, 80);
  const allowed = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  for (let i = 0; i < s.length; i++) {
    if (allowed.indexOf(s.charAt(i)) === -1) return '';
  }
  return s;
}

test('sanitize: UUID 形式の研修IDは許可', () => {
  assert.equal(sanitizeDeepLinkValue('3f9a1c2e-4b6d-47a8-9e10-2b3c4d5e6f70'), '3f9a1c2e-4b6d-47a8-9e10-2b3c4d5e6f70');
});
test('sanitize: ページキー（training-list 等）は許可', () => {
  assert.equal(sanitizeDeepLinkValue('member-application'), 'member-application');
  assert.equal(sanitizeDeepLinkValue('withdraw'), 'withdraw');
});
test('sanitize: XSS ペイロードは拒否（空文字）', () => {
  assert.equal(sanitizeDeepLinkValue('<script>alert(1)</script>'), '');
  assert.equal(sanitizeDeepLinkValue('" onerror=alert(1)'), '');
  assert.equal(sanitizeDeepLinkValue("javascript:alert(1)"), ''); // : は不許可
});
test('sanitize: 空白・記号・日本語を含む値は拒否', () => {
  assert.equal(sanitizeDeepLinkValue('a b'), '');
  assert.equal(sanitizeDeepLinkValue('研修'), '');
  assert.equal(sanitizeDeepLinkValue('a.b'), '');
  assert.equal(sanitizeDeepLinkValue('a/b'), '');
});
test('sanitize: 80 文字超は切り詰め（許可文字のみなら通る）', () => {
  const long = 'a'.repeat(100);
  assert.equal(sanitizeDeepLinkValue(long).length, 80);
});
test('sanitize: 81文字のうち末尾に不許可文字 → 切詰後に許可文字のみなら通る', () => {
  const v = 'a'.repeat(80) + '<';
  assert.equal(sanitizeDeepLinkValue(v), 'a'.repeat(80)); // 81文字目以降は切り捨てられる
});
test('sanitize: null / undefined / 空 → 空文字', () => {
  assert.equal(sanitizeDeepLinkValue(null), '');
  assert.equal(sanitizeDeepLinkValue(undefined), '');
  assert.equal(sanitizeDeepLinkValue('   '), '');
});
