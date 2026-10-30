import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyRunFailure, parseClaspResponse } from './run-clasp-system-settings-fixtures.mjs';

test('clasp JSON envelope contains the API JSON string', () => {
  const api = { success: true, data: { valid: true, writes: 0 } };
  assert.deepEqual(parseClaspResponse(JSON.stringify({ response: JSON.stringify(api) })), api);
});

test('execution errors are classified without returning their contents', () => {
  assert.equal(classifyRunFailure({ stderr: 'invalid_grant' }), 'AUTH_RELOGIN_REQUIRED');
  assert.equal(classifyRunFailure({ stderr: 'unknown option' }), 'CLASP_OPTION_INVALID');
  assert.equal(classifyRunFailure({ stderr: 'unrecognized failure' }), 'CLASP_RUN_FAILED');
});

test('errors and malformed responses cannot be accepted', () => {
  for (const value of [
    '', '{}', '{"error":{"message":"failure"}}',
    '{"response":"not json"}', '{"response":"null"}',
    '{"response":{"success":true}}',
    JSON.stringify({ error: { message: 'failure' }, response: '{"success":true}' }),
  ]) assert.throws(() => parseClaspResponse(value));
});

test('API errors return only a fixed diagnostic category', () => {
  assert.throws(() => parseClaspResponse(JSON.stringify({ error: { message: 'Permission denied: private detail' } })), { message: 'CLASP_PERMISSION_DENIED' });
  assert.throws(() => parseClaspResponse(JSON.stringify({ error: { code: 3, details: [{ errorMessage: 'PERMISSION_DENIED: private detail' }] } })), { message: 'CLASP_EXECUTION_PERMISSION_DENIED' });
  assert.throws(() => parseClaspResponse(JSON.stringify({ error: { message: 'Requested entity was not found' } })), { message: 'CLASP_TARGET_NOT_FOUND' });
  assert.throws(() => parseClaspResponse(JSON.stringify({ error: { message: 'unrecognized private detail' } })), { message: 'CLASP_API_ERROR' });
});
