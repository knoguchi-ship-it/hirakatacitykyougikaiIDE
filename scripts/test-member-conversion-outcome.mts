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

// 2026-11-01（docs/317 §9.4 S で発見）: 退会・移行などは終わると詳細を閉じる。以前は成功の表示を詳細の中に出した
// 直後に閉じていたため、誰にも見えなかった。結果は一覧（閉じた後も見える場所）へ渡す。
test('会員詳細: 終わると閉じる操作は、結果を一覧へ渡してから閉じる', () => {
  const detail = fs.readFileSync(new URL('../src/components/MemberDetailAdmin.tsx', import.meta.url), 'utf8');
  const lines = detail.split('\n');
  const closes = lines.map((l, i) => (l.trim() === 'onBack();' ? i : -1)).filter((i) => i >= 0);
  assert.ok(closes.length >= 7, `onBack() の呼び出しが ${closes.length} 件（退会・退会予約・取消・除籍・移行 3 種）`);
  for (const i of closes) {
    const before = lines.slice(Math.max(0, i - 8), i).join('\n');
    assert.match(before, /finishWithNotice\(/, `${i + 1} 行目の前で結果を一覧へ渡していない`);
    assert.doesNotMatch(before, /setSuccessMsg\(/, `${i + 1} 行目: 閉じる直前に詳細の中へ出している（見えない）`);
  }
  const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const uses = app.split('<MemberDetailAdmin').slice(1).map((s) => s.slice(0, s.indexOf('/>')));
  assert.equal(uses.length, 2);
  for (const u of uses) assert.match(u, /onActionDone=\{setMemberActionNotice\}/);
  assert.match(app, /role="status"[^>]*>\s*<p[^>]*>\{memberActionNotice\}/);
});

test('職員→個人のモーダル: 以前の個人会員の会員IDに戻ることを書く（「新しい会員IDが発行されます」だけにしない）', () => {
  const detail = fs.readFileSync(new URL('../src/components/MemberDetailAdmin.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(detail, /除籍され、新しい会員IDが発行されます/);
  assert.match(detail, /以前の個人会員の記録があれば、その会員IDに戻ります/);
});
