// docs/317 I4/I5（2026-10-31）: 画面側の「結果不明」の扱い。
// 実際の部品（src/shared/memberConversionOutcome.ts）と、API クライアントの配線を確かめる。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  GasTransportError,
  convertWithOutcomeCheck,
  conversionOutcomeUnknownMessage,
  newConversionOperationId,
} from '../src/shared/memberConversionOutcome.ts';

type R = { converted: boolean; newStaffId?: string };

function harness(convert: (p: any) => Promise<R>, lookup: (id: string) => Promise<{ found: boolean; result?: R }>) {
  const calls = { convert: [] as any[], lookup: [] as string[] };
  return {
    calls,
    run: (payload: any = { direction: 'INDIVIDUAL_TO_STAFF' }) => convertWithOutcomeCheck<any, R>(payload, {
      convert: (p) => { calls.convert.push(p); return convert(p); },
      lookup: (id) => { calls.lookup.push(id); return lookup(id); },
      newId: () => 'op-fixed-0001',
    }),
  };
}

test('操作IDを作って付けて送る（既に付いていればそれを使う）', async () => {
  const h = harness(async () => ({ converted: true }), async () => ({ found: false }));
  await h.run();
  await h.run({ direction: 'STAFF_TO_INDIVIDUAL', operationId: 'op-given-0002' });
  assert.deepEqual(h.calls.convert.map((p) => p.operationId), ['op-fixed-0001', 'op-given-0002']);
  assert.equal(h.calls.lookup.length, 0, '答えが返れば照会しない');
});

test('答えが返らなかったら操作IDで 1 回だけ照会し、反映済みなら成功として返す（送り直さない）', async () => {
  const h = harness(async () => { throw new GasTransportError('Timeout'); }, async () => ({ found: true, result: { converted: true, newStaffId: 'S9' } }));
  const r = await h.run();
  assert.deepEqual([r.converted, r.newStaffId, r.recovered], [true, 'S9', true]);
  assert.equal(h.calls.convert.length, 1, '移行は 1 回だけ送る');
  assert.deepEqual(h.calls.lookup, ['op-fixed-0001']);
});

test('照会でも見つからない・照会も届かないときは、推測せず結果不明と操作IDを示す', async () => {
  for (const lookup of [async () => ({ found: false }), async () => { throw new GasTransportError('again'); }]) {
    const h = harness(async () => { throw new GasTransportError('Timeout'); }, lookup as any);
    await assert.rejects(h.run(), (e: Error) => e.message === conversionOutcomeUnknownMessage('op-fixed-0001'));
    assert.equal(h.calls.convert.length, 1);
  }
  assert.match(conversionOutcomeUnknownMessage('x1'), /操作ID: MC-x1/, 'サーバーの完了記録と同じ表記');
});

test('サーバーが答えた失敗（入力不備・未反映）は照会せずにそのまま見せる', async () => {
  const h = harness(async () => { throw new Error('この会員はすでに移行済みです。'); }, async () => ({ found: true, result: { converted: true } }));
  await assert.rejects(h.run(), /すでに移行済み/);
  assert.equal(h.calls.lookup.length, 0);
});

test('操作IDはサーバーが受け付ける形（英数字とハイフン・8〜64 文字）', () => {
  for (let i = 0; i < 20; i += 1) {
    const id = newConversionOperationId();
    assert.ok(id.length >= 8 && id.length <= 64 && /^[A-Za-z0-9-]+$/.test(id), id);
  }
});

test('API クライアント: 通信の失敗を GasTransportError にし、移行は結果確認つきの部品を通す', () => {
  const api = fs.readFileSync(new URL('../src/services/api.ts', import.meta.url), 'utf8');
  assert.match(api, /withFailureHandler\(\(error: Error\) => reject\(new GasTransportError\(/);
  const start = api.indexOf('async convertMemberType(');
  const body = api.slice(start, api.indexOf('\n  }\n', start));
  assert.match(body, /convertWithOutcomeCheck\(payload/);
  assert.match(body, /getMemberConversionResult\(operationId\)/);
  // 移行を自動再試行（callWithConnectionRetry）に載せない（打ち切った呼び出しが実行済みかもしれない）
  assert.doesNotMatch(body, /callWithConnectionRetry/);
});
