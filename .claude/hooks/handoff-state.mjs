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

export function removeHandoffPending(file) {
  // 他のpromptがmkdir済み・保存前でも、親ディレクトリを失わせない。
  fs.rmSync(file, { force: true });
}
