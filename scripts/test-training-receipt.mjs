import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../gas-src/Code.full.gs', import.meta.url), 'utf8');
const start = source.indexOf('function sendTrainingApplicationReceipt_(');
assert.notEqual(start, -1);
let depth = 0;
let end = -1;
for (let i = source.indexOf('{', start); i < source.length; i++) {
  if (source[i] === '{') depth++;
  if (source[i] === '}' && --depth === 0) { end = i + 1; break; }
}
assert.notEqual(end, -1);
function run(deliver) {
  const fn = new Function('renderConfiguredMail_', 'formatTrainingDate_', 'deliverMail_', 'Logger', `
    var TRAINING_APPLY_RECEIPT_DEFAULT_SUBJECT = '', TRAINING_APPLY_RECEIPT_DEFAULT_BODY = '';
    ${source.slice(start, end)}
    return sendTrainingApplicationReceipt_;
  `)(() => ({ subject: 'subject', body: 'body' }), () => 'date', deliver, { log: () => {} });
  return fn({}, 'test@example.invalid', 'test', { 研修名: 'test' }, 'test');
}
test('申込者への通常送信が成功した場合だけ送信済みとする', () => {
  assert.equal(run(() => ({ sent: true, mode: 'LIVE' })), true);
  assert.equal(run(() => ({ sent: true, mode: 'REDIRECT' })), false);
  assert.equal(run(() => ({ sent: false, suppressed: true })), false);
  assert.equal(run(() => { throw new Error('failure'); }), false);
  assert.equal(run(() => undefined), false);
});

test('申込保存後に確認メールを試し、受付結果へ送信状態を渡す', () => {
  const applyStart = source.indexOf('function applyTrainingExternal_(');
  const applyEnd = source.indexOf('function cancelTrainingExternal_(', applyStart);
  assert.ok(applyStart >= 0 && applyEnd > applyStart);
  const apply = source.slice(applyStart, applyEnd);
  const saved = apply.indexOf("appendRowsByHeaders_(db, 'T_研修申込'");
  const receipt = apply.indexOf('sendTrainingApplicationReceipt_(db, email, name, training, applyId)');
  assert.ok(saved >= 0 && receipt > saved);
  assert.match(apply, /success:\s*true,\s*data:\s*\{\s*applyId:\s*applyId,\s*confirmationMailSent:\s*confirmationMailSent\s*\}/);
});
