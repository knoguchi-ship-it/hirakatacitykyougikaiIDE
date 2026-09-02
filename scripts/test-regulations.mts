/**
 * v376.65 回帰テスト: 規程・重要事項マスタ（案C Phase 1）。
 *
 * 背景:
 * 入会申込画面の「事務局からのお願い」と定款リンクは、これまでフロントの
 * MEMBERSHIP_NOTICE_HIGHLIGHTS / INCORPORATION_URL にハードコードされており事務局が改定できなかった。
 * v376.65 で本文の正本を `T_規程` の 1 箇所へ移した。壊れると実害になるのは次の 3 点:
 *   1. 入力検証（不正な区分・対象・外部リンクを保存させない）
 *   2. seed が既存行を上書きしないこと（事務局の改定が初期化で消える事故の防止）
 *   3. 正本が 1 箇所であること（フロントのハードコードが復活していないこと）
 *
 * 1〜2 は gas-src の実ソースから関数を抽出して評価する（ミラー実装にしない＝ドリフト防止）。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');
const formSrc = fs.readFileSync(
  path.join(ROOT, 'src', 'components', 'application', 'MemberApplicationForm.tsx'),
  'utf8',
);

function extractFunction(name: string): string {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が gas-src に見つからない`);
  let depth = 0;
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`${name} の終端が見つからない`);
}

function extractArrayVar(name: string): string {
  const start = source.indexOf(`var ${name} = [`);
  assert.notEqual(start, -1, `${name} が gas-src に見つからない`);
  const end = source.indexOf('];', start);
  return source.slice(start, end + 2);
}

const validate = new Function(
  `${extractArrayVar('REGULATION_KINDS')}
   ${extractArrayVar('REGULATION_TARGETS')}
   ${extractFunction('validateRegulationPayload_')}
   return validateRegulationPayload_;`,
)() as (p: Record<string, unknown>) => Record<string, string>;

// ── 入力検証 ──────────────────────────────────────────────
test('正常な入力はそのまま通る（前後の空白は落とす）', () => {
  const v = validate({ title: '  会費の返還について  ', body: '本文', kind: 'NOTICE', target: 'ALL', linkUrl: '', linkLabel: '' });
  assert.equal(v.title, '会費の返還について');
  assert.equal(v.kind, 'NOTICE');
  assert.equal(v.target, 'ALL');
});

test('タイトル未入力は弾く', () => {
  assert.throws(() => validate({ title: '   ', body: '本文' }), /タイトル/);
});

test('★区分・対象会員種別は許可値以外を弾く（deny-by-default）', () => {
  assert.throws(() => validate({ title: 't', body: '', kind: 'EVIL' }), /区分/);
  assert.throws(() => validate({ title: 't', body: '', target: 'ADMIN' }), /対象会員種別/);
});

test('★外部リンクは https のみ（javascript: / http: を弾く）', () => {
  assert.throws(() => validate({ title: 't', body: '', linkUrl: 'javascript:alert(1)' }), /https/);
  assert.throws(() => validate({ title: 't', body: '', linkUrl: 'http://example.com' }), /https/);
  const ok = validate({ title: 't', body: '', linkUrl: 'https://example.com/rule' });
  assert.equal(ok.linkUrl, 'https://example.com/rule');
});

test('長さ上限を超える入力は弾く', () => {
  assert.throws(() => validate({ title: 'あ'.repeat(101), body: '' }), /100 文字/);
  assert.throws(() => validate({ title: 't', body: 'あ'.repeat(20001) }), /20,000 文字/);
  assert.throws(() => validate({ title: 't', body: '', linkUrl: 'https://e.com/' + 'a'.repeat(500) }), /500 文字/);
  assert.throws(() => validate({ title: 't', body: '', linkLabel: 'あ'.repeat(41) }), /40 文字/);
});

// ── seed が既存行を壊さないこと ───────────────────────────
function runSeed(existingRowCount: number): { appended: boolean; rows: unknown[] } {
  let appended = false;
  let rows: unknown[] = [];
  const sheet = { getLastRow: () => existingRowCount + 1 };
  const ss = { getSheetByName: () => sheet };
  const fn = new Function(
    'ss', 'appendRowsByHeaders_',
    `${source.slice(source.indexOf('var REGULATION_SEED = ['), source.indexOf('];', source.indexOf('var REGULATION_SEED = [')) + 2)}
     ${extractFunction('seedRegulationsIfEmpty_')}
     return seedRegulationsIfEmpty_(ss);`,
  );
  fn(ss, (_ss: unknown, _name: string, r: unknown[]) => { appended = true; rows = r; });
  return { appended, rows };
}

test('★空のときだけ seed する（既存行があれば触らない＝改定が消えない）', () => {
  const empty = runSeed(0);
  assert.equal(empty.appended, true);
  assert.equal(empty.rows.length, 5, '初期文面 5 件が入る');
  const filled = runSeed(3);
  assert.equal(filled.appended, false, '既存行があるときは append してはならない');
});

// ── 正本が 1 箇所であること ───────────────────────────────
test('★フロントのハードコード文面が復活していない', () => {
  assert.doesNotMatch(formSrc, /MEMBERSHIP_NOTICE_HIGHLIGHTS/, '旧ハードコード定数が残っている');
  assert.match(formSrc, /FALLBACK_REGULATIONS/, 'フォールバック定数が無い');
  // フォールバックは「規程が取れないときだけ」使う
  assert.match(formSrc, /regulations && regulations\.length > 0/, 'サーバー値を優先していない');
});

test('★公開ポータル設定に規程が乗り、公開フラグの立った行だけ返る', () => {
  assert.match(source, /regulations: ppRegulations/, '公開ポータル設定に規程が乗っていない');
  assert.match(source, /var ppRegulations = listRegulations_\(db, true\)/, '公開側で publishedOnly を指定していない');
});

test('★規程 CRUD は admin 限定 action として登録されている（public boundary を増やさない）', () => {
  for (const action of ['listRegulations', 'saveRegulation', 'deleteRegulation']) {
    assert.match(source, new RegExp(`'${action}': \\['MASTER','ADMIN'\\]`), `${action} が admin 権限表に無い`);
  }
  const publicActions = source.slice(source.indexOf('PUBLIC_ALLOWED_ACTIONS'), source.indexOf('PUBLIC_ALLOWED_ACTIONS') + 2000);
  for (const action of ['listRegulations', 'saveRegulation', 'deleteRegulation']) {
    assert.ok(!publicActions.includes(action), `${action} が public 許可リストに漏れている`);
  }
});
