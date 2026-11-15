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

/**
 * 期限切れの印を会話を問わず消す（2026-11-15）。終了処理なしで閉じた会話の印が残り、前段が毎回nodeを起動するのを防ぐ。
 * 期限は中身の at、読めなければ更新日時で判定する（保存途中のファイルは更新日時が新しいので消えない）。共有ディレクトリは消さない。
 */
export function sweepStaleHandoffPending(state, maxAgeMs, now = Date.now()) {
  const dir = path.join(state, '.tmp', 'handoff-pending');
  let names = [];
  try { names = fs.readdirSync(dir).filter((n) => n.endsWith('.json')).map((n) => path.join(dir, n)); } catch { /* 無ければ旧形式だけ */ }
  for (const file of [handoffPendingPath(state), ...names]) {
    try {
      const st = fs.statSync(file);
      if (!st.isFile()) continue;
      let at = NaN;
      try { at = Number(JSON.parse(fs.readFileSync(file, 'utf8')).at); } catch { /* 読めなければ更新日時 */ }
      if (!Number.isFinite(at)) at = st.mtimeMs;
      if (now - at > maxAgeMs) removeHandoffPending(file);
    } catch { /* 無い・消えた・読めない */ }
  }
}
