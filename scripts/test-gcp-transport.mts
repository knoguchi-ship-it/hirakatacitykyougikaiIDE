// docs/250 Phase 3: GCP read transport（callGcpApi / callApi runtime 分岐 / GcpApiClient）の単体テスト。
// 実行: node --experimental-strip-types --no-warnings --test scripts/test-gcp-transport.mts
//
// 検証範囲（PHASE3_DESIGN §3 完了ゲート）:
//  - envelope unwrap（{success,data} → data / {success:false,error} → reject）
//  - エラー経路（HTTP 非 2xx / apiBaseUrl 未設定）
//  - 未実装 action の deny-by-default reject（allowlist 外は fetch 自体を呼ばない）
//  - callApi の runtime 分岐（'gcp' 明示時のみ fetch・既定は GAS 経路のまま）
// GcpApiClient（src/services/api.ts）は '../types' など拡張子なし import のため Node から
// 直接 import できない（既存 unit test も同様に api.ts 本体は import していない）。
// callAction は callGcpApi への委譲のみ・stub 導出ループは Phase 1 から不変のため、
// 配線の整合は typecheck（prerelease）で担保する。
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// ── window / fetch モック（import 前に用意。api.ts は module 評価時に __APP_CONFIG__ を読む） ──
type FetchCall = { url: string; init: { method: string; headers: Record<string, string>; body: string } };
const fetchCalls: FetchCall[] = [];
let nextResponse: { ok: boolean; status: number; json: () => Promise<unknown> } = {
  ok: true,
  status: 200,
  json: async () => ({ success: true, data: [] }),
};

const win: { __APP_CONFIG__?: Record<string, unknown> } = {};
(globalThis as unknown as { window: typeof win }).window = win;
(globalThis as unknown as { fetch: unknown }).fetch = async (url: string, init: FetchCall['init']) => {
  fetchCalls.push({ url, init });
  return nextResponse;
};

const { callApi, callGcpApi, GCP_READ_ACTIONS, GCP_ACTION_NOT_IMPLEMENTED_MESSAGE } = await import('../src/shared/api-base.ts');

const GCP_CONFIG = { apiRuntime: 'gcp' as const, apiBaseUrl: 'http://localhost:8787', apiAuthToken: 'test-token' };

beforeEach(() => {
  fetchCalls.length = 0;
  delete win.__APP_CONFIG__;
  nextResponse = { ok: true, status: 200, json: async () => ({ success: true, data: [] }) };
});

// ── callGcpApi: envelope unwrap ──
test('callGcpApi: 成功 envelope は data を返し、契約どおりの POST を送る', async () => {
  nextResponse = { ok: true, status: 200, json: async () => ({ success: true, data: [{ id: 'T001' }] }) };
  const data = await callGcpApi<Array<{ id: string }>>('getPublicTrainings', null, GCP_CONFIG);
  assert.deepEqual(data, [{ id: 'T001' }]);
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url, 'http://localhost:8787/api');
  assert.equal(fetchCalls[0].init.method, 'POST');
  assert.equal(fetchCalls[0].init.headers['Content-Type'], 'application/json');
  assert.equal(fetchCalls[0].init.headers.Authorization, 'Bearer test-token');
  assert.deepEqual(JSON.parse(fetchCalls[0].init.body), { action: 'getPublicTrainings', payload: null });
});

test('callGcpApi: apiAuthToken 未設定時は Authorization ヘッダーを付けない', async () => {
  await callGcpApi('getPublicPortalSettings', null, { apiRuntime: 'gcp', apiBaseUrl: 'http://localhost:8787' });
  assert.equal(fetchCalls.length, 1);
  assert.equal('Authorization' in fetchCalls[0].init.headers, false);
});

test('callGcpApi: 失敗 envelope は error message で reject', async () => {
  nextResponse = { ok: true, status: 200, json: async () => ({ success: false, error: 'unknown_action' }) };
  await assert.rejects(() => callGcpApi('getPublicTrainings', null, GCP_CONFIG), /unknown_action/);
});

// ── callGcpApi: エラー経路 ──
test('callGcpApi: HTTP 非 2xx は status 付きで reject', async () => {
  nextResponse = { ok: false, status: 503, json: async () => ({}) };
  await assert.rejects(() => callGcpApi('getPublicTrainings', null, GCP_CONFIG), /HTTP 503/);
});

test('callGcpApi: apiBaseUrl 未設定は reject（fetch を呼ばない）', async () => {
  await assert.rejects(() => callGcpApi('getPublicTrainings', null, { apiRuntime: 'gcp' }), /apiBaseUrl/);
  assert.equal(fetchCalls.length, 0);
});

// ── deny-by-default ──
test('callGcpApi: allowlist 外 action は未実装 reject（fetch を呼ばない）', async () => {
  await assert.rejects(() => callGcpApi('fetchAllData', null, GCP_CONFIG), new RegExp(GCP_ACTION_NOT_IMPLEMENTED_MESSAGE.slice(0, 12)));
  await assert.rejects(() => callGcpApi('memberLogin', { loginId: 'x', password: 'y' }, GCP_CONFIG), /未実装/);
  assert.equal(fetchCalls.length, 0);
});

test('allowlist は portal-api と同一の 2 read action のみ', () => {
  assert.deepEqual([...GCP_READ_ACTIONS].sort(), ['getPublicPortalSettings', 'getPublicTrainings']);
});

// ── callApi runtime 分岐 ──
test('callApi: __APP_CONFIG__ が gcp のときのみ fetch 経路に入る', async () => {
  win.__APP_CONFIG__ = { ...GCP_CONFIG };
  nextResponse = { ok: true, status: 200, json: async () => ({ success: true, data: { trainingMenuEnabled: true } }) };
  const data = await callApi<{ trainingMenuEnabled: boolean }>('getPublicPortalSettings');
  assert.equal(data.trainingMenuEnabled, true);
  assert.equal(fetchCalls.length, 1);
});

test('callApi: 既定（config 未注入）は GAS 経路のまま＝google 不在で従来メッセージ reject・fetch 不使用', async () => {
  await assert.rejects(() => callApi('getPublicTrainings'), /Google Apps Script/);
  assert.equal(fetchCalls.length, 0);
});

test("callApi: apiRuntime:'gas' 明示（本番 build 注入値）も GAS 経路のまま", async () => {
  win.__APP_CONFIG__ = { apiRuntime: 'gas' };
  await assert.rejects(() => callApi('getPublicTrainings'), /Google Apps Script/);
  assert.equal(fetchCalls.length, 0);
});
