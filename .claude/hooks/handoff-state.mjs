/** H9の保存先。セッションIDをそのままファイルパスに使用しない。 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export function handoffPendingPath(state, sessionId = '') {
  if (!sessionId) return path.join(state, '.tmp', 'handoff-pending.json');
  const key = createHash('sha256').update(String(sessionId)).digest('hex');
  return path.join(state, '.tmp', 'handoff-pending', `${key}.json`);
}

export function handoffPendingForStop(state, sessionId = '') {
  const own = handoffPendingPath(state, sessionId);
  return fs.existsSync(own) ? own : handoffPendingPath(state);
}

export function removeHandoffPending(file, state) {
  fs.rmSync(file, { force: true });
  const directory = path.join(state, '.tmp', 'handoff-pending');
  if (path.dirname(file) === directory) {
    // 印がなくなれば前段フィルターはnodeを起動せずに終了できる。
    try { fs.rmdirSync(directory); } catch { /* 他のセッションが残っている場合は保持 */ }
  }
}
