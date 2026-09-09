/**
 * v376.87 回帰テスト: processApiRequest の action 分岐が、存在しない変数を参照していないこと。
 *
 * 背景: v376.86 で `saveRegulationsBatch` の分岐に `adminSession && adminSession.loginId` と書いた。
 * この文脈に `adminSession` という変数は無く（管理者セッションは `parsedPayload.__adminSession`）、
 * 実行時に ReferenceError になって保存が丸ごと失敗した。
 * typecheck は .gs を見ないので通り、単体テストも分岐を評価しないので気づけなかった。
 *
 * ここでは分岐の本体を静的に読み、**その場に存在しない名前を使っていないか**を検査する。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const gas = fs.readFileSync(path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');

/** processApiRequest の本体を切り出す */
function extractDispatch(): string {
  const start = gas.indexOf('function processApiRequest(');
  assert.notEqual(start, -1, 'processApiRequest が見つからない');
  let depth = 0;
  for (let i = gas.indexOf('{', start); i < gas.length; i += 1) {
    if (gas[i] === '{') depth += 1;
    else if (gas[i] === '}') {
      depth -= 1;
      if (depth === 0) return gas.slice(start, i + 1);
    }
  }
  throw new Error('processApiRequest の終端が見つからない');
}

const dispatch = extractDispatch();

// U-27: v261 で残った公開 API は、本人確認が弱く承認を経ずに会員情報を書き換えられた。
// 新しい変更申請キューへ移行済みで画面からの呼び出しもないため、復活を許可しない。
const RETIRED_PUBLIC_ACTIONS = [
  'lookupMemberForPublicUpdate',
  'submitPublicMemberUpdate',
  'submitPublicBusinessUpdate',
  'addPublicStaffMember',
  'removePublicStaffByCmNumber',
  'submitPublicWithdrawalRequest',
];

test('action 分岐で管理者セッションは __adminSession から取る', () => {
  // 分岐の中で使ってよいのは parsedPayload.__adminSession（この関数のローカル）。
  // `adminSession` を裸で参照すると実行時 ReferenceError になる。
  const lines = dispatch.split('\n').filter((l) => !l.trim().startsWith('//'));
  const offenders = lines.filter((l) => /(^|[^.\w])adminSession\b/.test(l) && !/parsedPayload\.__adminSession/.test(l));
  assert.deepEqual(
    offenders.map((l) => l.trim().slice(0, 100)),
    [],
    'この文脈に存在しない adminSession を参照している。parsedPayload.__adminSession を使うこと'
  );
});

test('すべての action 分岐が実在する関数を呼んでいる', () => {
  // `data: someFunction_(` の形を集め、定義があることを確かめる。
  // 綴り違いやリネーム漏れを、デプロイ前に落とすため。
  const called = new Set(
    [...dispatch.matchAll(/data:\s*([A-Za-z0-9_]+_)\(/g)].map((m) => m[1])
  );
  const missing = [...called].filter((name) => !new RegExp(`function ${name}\\s*\\(`).test(gas));
  assert.deepEqual(missing, [], `分岐が呼んでいるが定義が無い関数: ${missing.join(', ')}`);
});

test('新しい action は権限表・分岐・許可リストの 3 箇所に揃っている', () => {
  // ADMIN_ACTION_PERMISSIONS に載っている admin action は、分岐にも存在すること。
  const permStart = gas.indexOf('var ADMIN_ACTION_PERMISSIONS = {');
  const permEnd = gas.indexOf('\n};', permStart);
  const permBody = gas.slice(permStart, permEnd);
  const actions = [...permBody.matchAll(/^\s*'([^']+)'\s*:/gm)].map((m) => m[1]);
  const notDispatched = actions.filter((a) => !dispatch.includes(`action === '${a}'`));
  assert.deepEqual(
    notDispatched,
    [],
    `権限表にあるが processApiRequest に分岐が無い action: ${notDispatched.join(', ')}`
  );
});

test('廃止した v261 公開 API は許可リスト・分岐・実装のいずれにも残っていない', () => {
  const publicActions = gas.match(/var PUBLIC_ALLOWED_ACTIONS = \{([\s\S]*?)\n\};/);
  assert.ok(publicActions, 'PUBLIC_ALLOWED_ACTIONS が見つからない');

  const remaining = RETIRED_PUBLIC_ACTIONS.filter((action) =>
    new RegExp(`\\b${action}\\s*:`).test(publicActions[1])
    || dispatch.includes(`action === '${action}'`)
    || new RegExp(`function ${action}_\\s*\\(`).test(gas)
  );
  assert.deepEqual(remaining, [], `廃止済みの公開 API が残っている: ${remaining.join(', ')}`);
});
