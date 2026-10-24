/**
 * 2026-10-25 回帰テスト: docs/307 F21「承認画面に変更後の値しか出ない」。
 *
 * 未処理の変更申請には今の値（会員の項目・職員情報変更の職員ごと）を付けて返す。生成物（admin split）から
 * 関数を取り出し、シートだけを差し替えて動かす（ミラー実装にしない・AGENTS L3.1）。
 * 項目 → 列の対応は会員一覧（mapMembersForApi_）と同じでなければならない（ずれると今の値が別の列になる）。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const admin = fs.readFileSync(path.join(ROOT, 'gas/admin/Code.gs'), 'utf8');

function extractBlock(source: string, head: string): string {
  const start = source.indexOf(head);
  assert.notEqual(start, -1, `${head} が見つからない`);
  const open = source.slice(start).search(/[{[]/) + start;
  const close = source[open] === '{' ? '}' : ']';
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === source[open]) depth += 1;
    else if (source[i] === close && --depth === 0) return source.slice(start, i + 1) + ';';
  }
  throw new Error(`${head} の終端が見つからない`);
}
const fn = (name: string) => extractBlock(admin, `function ${name}(`).replace(/;$/, '');
const decl = (name: string) => extractBlock(admin, `var ${name} = `);

const FIELD_COLUMN = new Function(`${decl('PUBLIC_UPDATE_FIELD_COLUMN_')} return PUBLIC_UPDATE_FIELD_COLUMN_;`)() as Record<string, string>;
const STAFF_COLUMN = new Function(`${decl('STAFF_UPDATE_FIELD_COLUMN_')} return STAFF_UPDATE_FIELD_COLUMN_;`)() as Record<string, string>;
const TABLES = new Function(`${decl('テーブル定義')} return テーブル定義;`)() as Record<string, string[]>;

function getChangeRequests(sheets: Record<string, object[]>) {
  const reads: string[] = [];
  const run = new Function('deps', `
    function getOrCreateDatabase_() { return {}; }
    function getRowsAsObjects_(ss, name) { deps.reads.push(name); return deps.sheets[name] || []; }
    function toBoolean_(v) { return v === true || String(v) === 'true'; }
    ${decl('PUBLIC_UPDATE_FIELD_COLUMN_')}
    ${decl('STAFF_UPDATE_FIELD_COLUMN_')}
    ${fn('buildChangeRequestCurrentValues_')}
    ${fn('getAdminChangeRequests_')}
    return getAdminChangeRequests_;
  `)({ sheets, reads });
  return { list: run({}) as Array<{ requestId: string; current: any }>, reads };
}

const request = (id: string, status: string, type: string, changeData: object) => ({
  申請ID: id, 会員ID: 'M1', 会員種別コード: 'INDIVIDUAL', 申請種別コード: type, 申請状態コード: status,
  申請日時: '2026-10-2' + id.slice(-1), 申請内容JSON: JSON.stringify(changeData), 削除フラグ: false,
});

test('F21: 未処理の変更申請に、変えようとしている項目の今の値を付ける', () => {
  const { list } = getChangeRequests({
    T_変更申請: [
      request('CR1', 'PENDING', 'MEMBER_UPDATE', {
        fields: { mobilePhone: '090-0000-0001', careManagerNumber: '87654321' },
        staffUpdate: [{ staffId: 'S1', email: 'new@example.invalid' }],
      }),
      request('CR2', 'APPROVED', 'MEMBER_UPDATE', { fields: { mobilePhone: '090-1' } }),
      request('CR3', 'PENDING', 'MEMBER_APPLICATION', { applicationPayload: {} }),
    ],
    T_会員: [{ 会員ID: 'M1', 携帯電話番号: '090-9999-9999', 介護支援専門員番号: '12345678', 姓: '★山田' }],
    T_事業所職員: [{ 職員ID: 'S1', メールアドレス: 'old@example.invalid', 姓: '★職員' }],
  });
  const byId = Object.fromEntries(list.map((r) => [r.requestId, r.current]));
  assert.deepEqual(byId.CR1, {
    fields: { mobilePhone: '090-9999-9999', careManagerNumber: '12345678' },
    staff: { S1: { email: 'old@example.invalid' } },
  });
  assert.equal(byId.CR2, null, '処理済みの申請の今の値は変更後なので付けない');
  assert.equal(byId.CR3, null, '入会申込には今の値が無い');
});

test('F21: 未処理の変更が無ければ会員・職員の表を読まない（無駄な読込を足さない）', () => {
  const { reads } = getChangeRequests({ T_変更申請: [request('CR2', 'APPROVED', 'MEMBER_UPDATE', { fields: {} })] });
  assert.deepEqual(reads, ['T_変更申請']);
});

test('F21: 会員が見つからない・空のセルでも落ちない', () => {
  const { list } = getChangeRequests({
    T_変更申請: [request('CR1', 'PENDING', 'MEMBER_UPDATE', { fields: { fax: '06-1' }, staffUpdate: [{ staffId: 'GONE', email: 'x@example.invalid' }] })],
    T_会員: [],
  });
  assert.deepEqual(list[0].current, { fields: {}, staff: {} });
});

test('F21: 項目 → 列の対応は、公開ポータルで変更できる項目を全部持ち、会員一覧と同じ列を指す', () => {
  const allow = new Function(`${decl('PUBLIC_INDIVIDUAL_UPDATE_ALLOWLIST_')} ${decl('PUBLIC_BUSINESS_UPDATE_ALLOWLIST_')}
    return PUBLIC_INDIVIDUAL_UPDATE_ALLOWLIST_.concat(PUBLIC_BUSINESS_UPDATE_ALLOWLIST_);`)() as string[];
  for (const k of allow) assert.ok(FIELD_COLUMN[k], `${k} の列が無い（承認画面に今の値が出ない）`);

  const memberCols = TABLES['T_会員'];
  const staffCols = TABLES['T_事業所職員'];
  for (const [k, col] of Object.entries(FIELD_COLUMN)) assert.ok(memberCols.includes(col), `${k}: T_会員 に ${col} が無い`);
  for (const [k, col] of Object.entries(STAFF_COLUMN)) assert.ok(staffCols.includes(col), `${k}: T_事業所職員 に ${col} が無い`);

  const listing = fn('mapMembersForApi_');
  for (const [k, col] of Object.entries(FIELD_COLUMN)) {
    assert.ok(listing.includes(`${k}: String(m['${col}']`), `${k}: 会員一覧は ${col} 以外の列を見ている`);
  }
  for (const k of ['email', 'careManagerNumber']) {
    assert.ok(listing.includes(`${k}: String(st['${STAFF_COLUMN[k]}']`), `職員の ${k}: 会員一覧と列が違う`);
  }
});
