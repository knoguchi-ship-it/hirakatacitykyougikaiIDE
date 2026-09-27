/**
 * エイリアス送信が Gmail REST API 経由であることと、組み立てる RFC822 が壊れていないことを固定する。
 *
 * 背景: GmailApp.sendEmail({from}) は送信前にエイリアス一覧を照合するため
 * gmail.settings.basic 等を要求する。公開・会員 split は v263 のスコープ最小化で
 * これらを持たず、公開ポータル発のメール（受付確認など）が送信時に落ちていた。
 * users.messages.send は gmail.send だけで呼べるので v376.103 で切り替えた。
 * GmailApp に戻すと同じ事故が再発するので、ここで戻せないようにする。
 *
 * 本体と同じロジックをテスト側に書き直すとドリフトするため、gas-src から
 * 実ソースを切り出して評価する（AGENTS §3「テストにミラー実装を書かない」）。
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const GAS_SRC = path.join(process.cwd(), 'gas-src', 'Code.full.gs');
const source = fs.readFileSync(GAS_SRC, 'utf8');

function extractFunction(name: string): string {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が gas-src に見つからない`);
  const end = source.indexOf('\n}\n', start);
  assert.notEqual(end, -1, `${name} の終端が見つからない`);
  return source.slice(start, end + 3);
}

/** GAS の Utilities / UrlFetchApp / ScriptApp の最小スタブ */
function makeEnv(fetchImpl?: (url: string, params: any) => any) {
  const requests: Array<{ url: string; params: any }> = [];
  const toBuffer = (value: any) =>
    typeof value === 'string' ? Buffer.from(value, 'utf8') : Buffer.from(Uint8Array.from(value));
  const Utilities = {
    Charset: { UTF_8: 'UTF-8' },
    base64Encode: (value: any) => toBuffer(value).toString('base64'),
    base64EncodeWebSafe: (value: any) => toBuffer(value).toString('base64url'),
    getUuid: () => '11111111-2222-3333-4444-555555555555',
    newBlob: (text: string) => ({ getBytes: () => Array.from(Buffer.from(text, 'utf8')) }),
  };
  const UrlFetchApp = {
    fetch: (url: string, params: any) => {
      requests.push({ url, params });
      return fetchImpl ? fetchImpl(url, params) : { getResponseCode: () => 200, getContentText: () => '{}' };
    },
  };
  const ScriptApp = { getOAuthToken: () => 'TOKEN' };
  return { Utilities, UrlFetchApp, ScriptApp, requests };
}

const HELPERS = ['encodeMimeWord_', 'wrapBase64_', 'buildRfc822Message_', 'sendMailViaGmailApi_']
  .map(extractFunction)
  .join('\n');

function load(env: ReturnType<typeof makeEnv>) {
  return new Function(
    'Utilities',
    'UrlFetchApp',
    'ScriptApp',
    `${HELPERS}; return { encodeMimeWord_, buildRfc822Message_, sendMailViaGmailApi_ };`,
  )(env.Utilities, env.UrlFetchApp, env.ScriptApp);
}

/** 行コメントを落とす。説明コメントに書いた語をコード本体と誤認しないため。 */
function stripLineComments(text: string): string {
  return text.replace(/^\s*\/\/.*$/gm, '');
}

/** base64 本文を復元する（行折り返しを戻してからデコード） */
function decodeB64(block: string): string {
  return Buffer.from(block.split(/\r\n/).join(''), 'base64').toString('utf8');
}

test('日本語の件名・表示名は RFC 2047 encoded-word にする', () => {
  const { encodeMimeWord_ } = load(makeEnv());
  const encoded = encodeMimeWord_('【入会申込】受付のお知らせ');
  assert.match(encoded, /^=\?UTF-8\?B\?[A-Za-z0-9+/=]+\?=$/);
  assert.equal(Buffer.from(encoded.slice(10, -2), 'base64').toString('utf8'), '【入会申込】受付のお知らせ');
});

test('ASCII だけの件名はそのまま通す', () => {
  const { encodeMimeWord_ } = load(makeEnv());
  assert.equal(encodeMimeWord_('Password reset'), 'Password reset');
});

test('添付なしは text/plain・base64 で、本文が復元できる', () => {
  const { buildRfc822Message_ } = load(makeEnv());
  const msg = buildRfc822Message_({
    from: 'info@example.org',
    name: '枚方市介護支援専門員連絡協議会',
    to: 'member@example.org',
    subject: 'お知らせ',
    body: '本文です。\n二行目。',
    replyTo: 'info@example.org',
  });
  assert.match(msg, /^From: =\?UTF-8\?B\?[^?]+\?= <info@example\.org>\r\n/);
  assert.ok(msg.includes('To: member@example.org'));
  assert.ok(msg.includes('Reply-To: info@example.org'));
  assert.ok(msg.includes('Content-Type: text/plain; charset="UTF-8"'));
  assert.ok(!msg.includes('multipart'), '添付が無いのに multipart にしない');
  const body = msg.split('\r\n\r\n').slice(1).join('\r\n\r\n');
  assert.equal(decodeB64(body), '本文です。\n二行目。');
});

test('Reply-To が無ければヘッダーを出さない', () => {
  const { buildRfc822Message_ } = load(makeEnv());
  const msg = buildRfc822Message_({ from: 'a@example.org', to: 'b@example.org', subject: 's', body: 'b' });
  assert.ok(!msg.includes('Reply-To:'));
});

test('添付ありは multipart/mixed で、本文と添付が分かれる', () => {
  const { buildRfc822Message_ } = load(makeEnv());
  const blob = {
    getName: () => '研修案内.pdf',
    getContentType: () => 'application/pdf',
    getBytes: () => Array.from(Buffer.from('%PDF-1.4 dummy', 'utf8')),
  };
  const msg = buildRfc822Message_({
    from: 'info@example.org',
    name: '協議会',
    to: 'member@example.org',
    subject: '一斉送信',
    body: '添付をご確認ください。',
    attachments: [blob],
  });
  const boundary = (msg.match(/boundary="([^"]+)"/) || [])[1];
  assert.ok(boundary, 'boundary を宣言する');
  assert.ok(msg.includes('Content-Type: multipart/mixed'));
  const parts = msg.split('--' + boundary);
  assert.equal(parts.length, 4, 'ヘッダー + 本文パート + 添付パート + 終端');
  assert.ok(msg.trimEnd().endsWith('--' + boundary + '--'), '終端 boundary で閉じる');
  // 添付パート: ファイル名は RFC 2047、中身は base64
  assert.match(parts[2], /Content-Disposition: attachment; filename="=\?UTF-8\?B\?[^"]+"/);
  assert.ok(parts[2].includes('Content-Type: application/pdf'));
  assert.equal(decodeB64(parts[2].split('\r\n\r\n')[1].trim()), '%PDF-1.4 dummy');
});

test('base64 は 76 桁で折る', () => {
  const { buildRfc822Message_ } = load(makeEnv());
  const msg = buildRfc822Message_({ from: 'a@example.org', to: 'b@example.org', subject: 's', body: 'あ'.repeat(500) });
  const body = msg.split('\r\n\r\n').slice(1).join('\r\n\r\n');
  const lines = body.split('\r\n');
  assert.ok(lines.length > 1, '長い本文は複数行になる');
  for (const line of lines) assert.ok(line.length <= 76, `76 桁を超える行がある: ${line.length}`);
  assert.equal(decodeB64(body), 'あ'.repeat(500));
});

test('users.messages.send を Bearer トークン付きで叩く', () => {
  const env = makeEnv();
  const { sendMailViaGmailApi_ } = load(env);
  sendMailViaGmailApi_({ from: 'info@example.org', to: 'b@example.org', subject: 's', body: 'b' });
  assert.equal(env.requests.length, 1);
  assert.equal(env.requests[0].url, 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send');
  assert.equal(env.requests[0].params.headers.Authorization, 'Bearer TOKEN');
  const raw = JSON.parse(env.requests[0].params.payload).raw;
  assert.ok(!/[+/]/.test(raw), 'raw は base64url（+ と / を含まない）');
  assert.ok(Buffer.from(raw, 'base64url').toString('utf8').includes('To: b@example.org'));
});

test('非 2xx は Gmail のエラー文を載せて投げる（Chat の要確認に出す材料）', () => {
  const env = makeEnv(() => ({
    getResponseCode: () => 403,
    getContentText: () => JSON.stringify({ error: { message: 'Delegation denied for info@example.org' } }),
  }));
  const { sendMailViaGmailApi_ } = load(env);
  assert.throws(
    () => sendMailViaGmailApi_({ from: 'info@example.org', to: 'b@example.org', subject: 's', body: 'b' }),
    /HTTP 403[\s\S]*Delegation denied/,
  );
});

test('エイリアス送信で GmailApp を使わない（スコープ事故の再発防止）', () => {
  const fn = stripLineComments(extractFunction('sendEmailWithValidatedFrom_'));
  assert.ok(!fn.includes('GmailApp'), 'GmailApp は gmail.settings.basic 等を要求するので使えない');
  assert.ok(fn.includes('sendMailViaGmailApi_'), 'エイリアス送信は Gmail REST API に一本化する');
  assert.ok(fn.includes('MailApp.sendEmail'), 'エイリアス未指定は従来どおり MailApp');
});

test('添付を扱う経路は 1 本だけ（二重実装を作らない）', () => {
  const code = stripLineComments(source);
  assert.equal(code.split('GmailApp.sendEmail(').length - 1, 0, 'GmailApp 送信は残さない');
  assert.equal(code.split('function sendMailViaGmailApi_(').length - 1, 1);
  assert.equal(code.split('sendEmailWithValidatedFrom_(').length - 1, 2, '定義 1 + 呼び出し 1（deliverMail_ のみ）');
});
