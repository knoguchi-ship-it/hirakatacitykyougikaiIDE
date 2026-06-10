/**
 * v376.46 回帰テスト: 会計年度ステータス判定の【単一情報源】computeMemberFiscalStatus を直接検証。
 * 会員リスト（src/App.tsx）と宛先リスト（gas-src/Code.full.gs に build 注入）が本関数を共有するため、
 * ここが両画面の「在籍中」判定の正準。今回バグ（移行済み TRANSFERRED が ACTIVE に混入）の回帰を固定する。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeMemberFiscalStatus } from '../src/shared/memberFiscalStatus.mjs';

const CFY = 2026; // 現会計年度。FY2026 = 2026-04-01 〜 2027-03-31

type Case = {
  name: string;
  input: { status?: string; joinedDate?: string; withdrawnDate?: string; deleted?: boolean };
  fy: number;
  expect: { status: string; includeInMailing: boolean };
};

const cases: Case[] = [
  { name: '在籍中（当年度内に入会・退会なし）', input: { status: 'ACTIVE', joinedDate: '2025-04-01' }, fy: 2026, expect: { status: 'ACTIVE', includeInMailing: true } },
  { name: '入会日なし→在籍扱い', input: { status: 'ACTIVE', joinedDate: '' }, fy: 2026, expect: { status: 'ACTIVE', includeInMailing: true } },
  { name: '★移行済み(TRANSFERRED)は在籍中に数えない・宛先対象外', input: { status: 'TRANSFERRED', joinedDate: '2024-04-01' }, fy: 2026, expect: { status: 'TRANSFERRED', includeInMailing: false } },
  { name: '退会予定（当年度）→退会予定', input: { status: 'WITHDRAWAL_SCHEDULED', joinedDate: '2020-04-01', withdrawnDate: '2027-03-31' }, fy: 2026, expect: { status: 'WITHDRAWAL_SCHEDULED', includeInMailing: true } },
  { name: '退会予定だが過去年度判定→その年度は在籍中', input: { status: 'WITHDRAWAL_SCHEDULED', joinedDate: '2020-04-01', withdrawnDate: '2027-03-31' }, fy: 2024, expect: { status: 'ACTIVE', includeInMailing: true } },
  { name: '当年度内に退会→退会(宛先候補に含む)', input: { status: 'WITHDRAWN', joinedDate: '2020-04-01', withdrawnDate: '2026-09-01' }, fy: 2026, expect: { status: 'WITHDRAWN', includeInMailing: true } },
  { name: '前年度末以前に退会→対象外', input: { status: 'WITHDRAWN', joinedDate: '2020-04-01', withdrawnDate: '2026-03-31' }, fy: 2026, expect: { status: 'NOT_IN_YEAR', includeInMailing: false } },
  { name: '退会済みだが退会日なし→退会(対象外)', input: { status: 'WITHDRAWN' }, fy: 2026, expect: { status: 'WITHDRAWN', includeInMailing: false } },
  { name: '当年度末より後に入会→対象外', input: { status: 'ACTIVE', joinedDate: '2027-04-01' }, fy: 2026, expect: { status: 'NOT_IN_YEAR', includeInMailing: false } },
  { name: '削除フラグ→対象外', input: { status: 'ACTIVE', joinedDate: '2020-04-01', deleted: true }, fy: 2026, expect: { status: 'NOT_IN_YEAR', includeInMailing: false } },
];

for (const c of cases) {
  test(c.name, () => {
    const r = computeMemberFiscalStatus(c.input, c.fy, CFY);
    assert.deepEqual({ status: r.status, includeInMailing: r.includeInMailing }, c.expect);
  });
}

test('★回帰固定: TRANSFERRED は決して ACTIVE/includeInMailing にならない', () => {
  for (const fy of [2024, 2025, 2026, 2027]) {
    const r = computeMemberFiscalStatus({ status: 'TRANSFERRED', joinedDate: '2020-04-01' }, fy, CFY);
    assert.notEqual(r.status, 'ACTIVE');
    assert.equal(r.includeInMailing, false);
  }
});
