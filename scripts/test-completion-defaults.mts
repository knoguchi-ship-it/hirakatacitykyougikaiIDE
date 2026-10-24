/**
 * 2026-10-25 回帰テスト: docs/307 F26「入会申込の完了画面が、承認待ちなのに『ログイン情報を送信しました』と出す」。
 *
 * 公開ポータルの入会申込は必ず承認待ちになり、ログイン情報は承認のときに送る。完了画面の既定の文面
 * （設定が空のときに出る）が「送信しました」と言ってはならない。既定の文面は 4 か所に同じものがある
 * （GAS・管理画面の設定・公開ポータル・申込フォーム）ので、食い違いも落とす。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** `key: '…'` か `key: [ … ].join('\n')`（`key = …` も）の値を取り出して評価する */
function valueOf(source: string, key: string, sep = ': '): string {
  // 型の宣言（`key: string;`）は飛ばし、値（文字列か配列）が続く箇所を取る
  let start = source.indexOf(key + sep);
  while (start !== -1 && !/['"[]/.test(source[start + key.length + sep.length])) start = source.indexOf(key + sep, start + 1);
  assert.notEqual(start, -1, `${key} が見つからない`);
  let i = start + key.length + sep.length;
  let expr: string;
  if (source[i] === '[') {
    let depth = 0;
    let j = i;
    for (; j < source.length; j += 1) {
      if (source[j] === '[') depth += 1;
      else if (source[j] === ']' && --depth === 0) break;
    }
    expr = source.slice(i, j + 1) + ".join('\\n')";
  } else {
    const q = source[i];
    const end = source.indexOf(q, i + 1);
    expr = source.slice(i, end + 1);
  }
  return new Function(`return ${expr};`)() as string;
}

const KEYS = [
  'completionGuidanceBodyWhenCredentialSent',
  'completionGuidanceBodyWhenCredentialNotSent',
  'completionLoginInfoBodyWhenCredentialSent',
  'completionLoginInfoBodyWhenCredentialNotSent',
  'completionNoCredentialNotice',
  'completionCredentialNotice',
];
const COPIES = {
  'gas-src/Code.full.gs': read('gas-src/Code.full.gs').slice(read('gas-src/Code.full.gs').indexOf('var PUBLIC_PORTAL_DEFAULTS = {')),
  'src/App.tsx': read('src/App.tsx'),
  'src/public-portal/App.tsx': read('src/public-portal/App.tsx'),
};
const form = read('src/components/application/MemberApplicationForm.tsx');
const FORM_CONST: Record<string, string> = {
  completionGuidanceBodyWhenCredentialSent: 'DEFAULT_COMPLETION_GUIDANCE_BODY_WHEN_CREDENTIAL_SENT',
  completionGuidanceBodyWhenCredentialNotSent: 'DEFAULT_COMPLETION_GUIDANCE_BODY_WHEN_CREDENTIAL_NOT_SENT',
  completionLoginInfoBodyWhenCredentialSent: 'DEFAULT_COMPLETION_LOGIN_INFO_BODY_WHEN_CREDENTIAL_SENT',
  completionLoginInfoBodyWhenCredentialNotSent: 'DEFAULT_COMPLETION_LOGIN_INFO_BODY_WHEN_CREDENTIAL_NOT_SENT',
};

test('F26: 完了画面の既定の文面は 4 か所で同じ', () => {
  for (const key of KEYS) {
    const values = Object.entries(COPIES).map(([file, src]) => [file, valueOf(src, key)] as const);
    const formValue = FORM_CONST[key] ? valueOf(form, `const ${FORM_CONST[key]}`, ' = ') : valueOf(form, key, ' = ');
    for (const [file, v] of values) assert.equal(v, formValue, `${key}: ${file} と申込フォームが違う`);
  }
});

test('F26: 承認待ちの完了画面で、ログイン情報を「送信しました」と言わない', () => {
  for (const key of ['completionGuidanceBodyWhenCredentialSent', 'completionCredentialNotice']) {
    const v = valueOf(COPIES['src/public-portal/App.tsx'], key);
    assert.ok(!/ログイン情報[^。]*送信しました/.test(v), `${key}: ${v}`);
    assert.match(v, /承認後/);
  }
});
