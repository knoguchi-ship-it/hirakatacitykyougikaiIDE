// gas-src/03_core_snapshot.gs — 完成品の置き場（スナップショット）。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

// ─── 2026-11-12 docs/328: 管理者認証の完成品（スクリプトプロパティ・管理プロジェクトだけ） ─────────────
// ホワイトリストの有効な行と、紐付く認証行の必要な列だけを JSON にして置く。パスワードハッシュ・ソルトは読まない・置かない。
// 正本はシートのまま。無い・壊れている・5 分を超えた・DB の最終更新日時が新しい・最終更新日時を確かめられない
// → シートから作り直してから判定する（TRD §1.4・§3.2.1・RD §12）。
var ADMIN_AUTH_SNAPSHOT_KEY_ = 'ADMIN_AUTH_SNAPSHOT_V1';
var ADMIN_AUTH_SNAPSHOT_OK_CACHE_KEY_ = 'admin_auth_snap_ok_v1';
var ADMIN_AUTH_SNAPSHOT_MAX_AGE_MS_ = 60 * 60 * 1000; // 2026-11-12 operator 決定 D1（以前は 5 分）・docs/332 §10.4
var ADMIN_AUTH_SNAPSHOT_CHECK_TTL_SECONDS_ = 30;
var ADMIN_AUTH_SNAPSHOT_MAX_CHARS_ = 8000;
var ADMIN_AUTH_SNAPSHOT_AUTH_COLUMNS_ = ['認証ID', 'システムロールコード', '会員ID', '職員ID', '削除フラグ'];

// DB の最終更新日時（ms）。読めなければ null（呼び出し側は「確かめられない」として正本へ）。
function getDbLastModifiedMs_(ss) {
  try {
    return DriveApp.getFileById(ss.getId()).getLastUpdated().getTime();
  } catch (e) {
    return null;
  }
}

// T_認証アカウント から、指定の認証IDの行の必要な列だけを読む。ハッシュ・ソルトの列には触れない。
// 削除済みの行は飛ばし、同じ認証IDが複数あれば上の行（以前の「最初に一致」と同じ）。
// 必要な列が無ければ空を返す（紐付けを確かめられない → 全員「紐付け無し」で拒否＝fail-closed）。
function readAdminAuthLinkedRows_(ss, authIds) {
  var out = {};
  var wanted = {};
  for (var w = 0; w < authIds.length; w += 1) if (authIds[w]) wanted[authIds[w]] = true;
  var cols = readSheetColumnsByName_(ss, 'T_認証アカウント', ADMIN_AUTH_SNAPSHOT_AUTH_COLUMNS_);
  if (!cols) return out;
  var ids = cols.columns['認証ID'];
  for (var r = 0; r < cols.rowCount; r += 1) {
    var id = String(ids[r] || '');
    if (!id || !wanted[id] || out[id]) continue;
    if (toBoolean_(cols.columns['削除フラグ'][r])) continue;
    out[id] = {
      roleCode: String(cols.columns['システムロールコード'][r] || ''),
      memberId: String(cols.columns['会員ID'][r] || ''),
      staffId: String(cols.columns['職員ID'][r] || ''),
    };
  }
  return out;
}

// 見出しから列を探し、隣り合う列はまとめて読む。必要な列が 1 つでも無ければ null（確かめられない）。
// 返り値: { rowCount, columns: { 列名: [値…] } }。docs/328（管理者認証）・docs/330（件数）で共有。
// ─── 2026-11-12 docs/332 S1: 完成品の置き場（スクリプトプロパティ・TRD §3.2.1） ─────────────────────
// JSON を gzip＋base64 にし、1 件 8,000 バイト以下に分けて SNAP:<名前>:<世代>:<番号> に書く。
// 書き終えてから SNAP:<名前>（現在の世代）を替え、古い世代を消す（書きかけを読まない）。
// 古い印は SNAPSTALE:<名前> に時刻で置き、印より前に作り始めた完成品だけを古いとみなす（作り直しの途中の書き込みを取りこぼさない）。
// 時間トリガーは HEAD、web アプリは版のコードで動くため、形式の番号が違えば使わない。
var SNAPSHOT_FORMAT_ = 1;
var SNAPSHOT_PREFIX_ = 'SNAP:';
var SNAPSHOT_STALE_PREFIX_ = 'SNAPSTALE:';
var SNAPSHOT_CHUNK_BYTES_ = 8000;
var SNAPSHOT_TOTAL_LIMIT_BYTES_ = 400 * 1024;
var SNAPSHOT_MAX_AGE_MASTERS_MS_ = 10 * 60 * 1000;
var SNAPSHOT_MAX_AGE_MASTERS_ADMIN_MS_ = 60 * 60 * 1000;
var SNAPSHOT_MAX_AGE_SETTINGS_MS_ = 60 * 60 * 1000;
var SNAPSHOT_MAX_AGE_DASHBOARD_MS_ = 60 * 60 * 1000;

// 2026-11-15 docs/332 §13.9 A: マスタの完成品の上限。管理はトリガーが DB の最終更新日時で直接編集も拾うので 60 分。
// 公開・会員はトリガーが無く書き込みを知らないので 10 分。トリガーと表示の読みの両方がここを使う
// （表示の読みだけ 10 分に残すと、トリガーが作らなくなった後に API の中で作り直しが起きて遅くなる）。
function mastersSnapshotMaxAgeMs_() {
  return APP_SECURITY_BOUNDARY === 'admin' ? SNAPSHOT_MAX_AGE_MASTERS_ADMIN_MS_ : SNAPSHOT_MAX_AGE_MASTERS_MS_;
}

function utf8ByteLength_(text) {
  var s = String(text == null ? '' : text);
  var n = 0;
  for (var i = 0; i < s.length; i += 1) {
    var c = s.charCodeAt(i);
    if (c < 0x80) n += 1;
    else if (c < 0x800) n += 2;
    else if (c >= 0xD800 && c <= 0xDBFF) { n += 4; i += 1; }
    else n += 3;
  }
  return n;
}

function encodeSnapshotPayload_(data) {
  return Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(JSON.stringify(data), 'application/json')).getBytes());
}

function decodeSnapshotPayload_(text) {
  return JSON.parse(Utilities.ungzip(Utilities.newBlob(Utilities.base64Decode(text), 'application/x-gzip')).getDataAsString('UTF-8'));
}

// meta: { dbModifiedAtMs, buildStartedAtMs }。書けなかったら false（呼び出し側は作った中身でそのまま答える）
function writeSnapshot_(name, data, meta) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(2000)) {
    console.warn('完成品 ' + name + ' を書けませんでした（ロックが取れない）。今回は書かずに答えます');
    return false;
  }
  try {
    var props = PropertiesService.getScriptProperties();
    var all = props.getProperties();
    var pointerKey = SNAPSHOT_PREFIX_ + name;
    var chunkPrefix = pointerKey + ':';
    var payload = encodeSnapshotPayload_(data);
    var gen = String(Date.now()) + String(Math.floor(Math.random() * 1000));
    var next = {};
    var count = 0;
    for (var i = 0; i < payload.length; i += SNAPSHOT_CHUNK_BYTES_) {
      next[chunkPrefix + gen + ':' + count] = payload.slice(i, i + SNAPSHOT_CHUNK_BYTES_);
      count += 1;
    }
    var pointer = JSON.stringify({
      format: SNAPSHOT_FORMAT_,
      gen: gen,
      count: count,
      builtAtMs: Date.now(),
      buildStartedAtMs: meta && typeof meta.buildStartedAtMs === 'number' ? meta.buildStartedAtMs : Date.now(),
      dbModifiedAtMs: meta && typeof meta.dbModifiedAtMs === 'number' ? meta.dbModifiedAtMs : -1,
    });
    // 切り替えの間は新旧 2 世代が並ぶ。その合計で上限を見る
    var total = 0;
    Object.keys(all).forEach(function(k) { if (k !== pointerKey) total += utf8ByteLength_(k) + utf8ByteLength_(all[k]); });
    Object.keys(next).forEach(function(k) { total += k.length + next[k].length; });
    total += pointerKey.length + pointer.length;
    if (total > SNAPSHOT_TOTAL_LIMIT_BYTES_) {
      console.warn('完成品 ' + name + ' を書くと全プロパティが ' + total + ' バイトになり上限 400 KB を超えるため書きません（正本から答えます）');
      return false;
    }
    props.setProperties(next, false);
    props.setProperty(pointerKey, pointer);
    Object.keys(all).forEach(function(k) { if (k.indexOf(chunkPrefix) === 0) props.deleteProperty(k); });
    return true;
  } catch (e) {
    console.warn('完成品 ' + name + ' を書けませんでした: ' + (e && e.message ? e.message : e));
    return false;
  } finally {
    lock.releaseLock();
  }
}

// all は getProperties() の結果。無い・欠けた・壊れた・形式が違うものは null
function readSnapshot_(name, all) {
  var pointer = null;
  try { pointer = JSON.parse(all[SNAPSHOT_PREFIX_ + name] || 'null'); } catch (e) { return null; }
  if (!pointer || pointer.format !== SNAPSHOT_FORMAT_ || !pointer.gen || !(pointer.count > 0)) return null;
  var parts = [];
  for (var i = 0; i < pointer.count; i += 1) {
    var v = all[SNAPSHOT_PREFIX_ + name + ':' + pointer.gen + ':' + i];
    if (typeof v !== 'string') return null;
    parts.push(v);
  }
  var data;
  try { data = decodeSnapshotPayload_(parts.join('')); } catch (e) { return null; }
  var staleAt = Number(all[SNAPSHOT_STALE_PREFIX_ + name] || 0);
  return {
    data: data,
    gen: String(pointer.gen), // 版（画面が持つ版と比べ、同じなら送らない・docs/332 §13.9 B）
    builtAtMs: Number(pointer.builtAtMs) || 0,
    dbModifiedAtMs: typeof pointer.dbModifiedAtMs === 'number' ? pointer.dbModifiedAtMs : -1,
    stale: staleAt > 0 && staleAt >= (Number(pointer.buildStartedAtMs) || 0),
  };
}

// 書き込みの最下層で呼ぶ。印より前に作り始めた完成品は古いとみなされる
function markSnapshotStale_(name) {
  try {
    PropertiesService.getScriptProperties().setProperty(SNAPSHOT_STALE_PREFIX_ + name, String(Date.now()));
  } catch (e) {
    console.warn('完成品 ' + name + ' に古い印を付けられませんでした: ' + (e && e.message ? e.message : e));
  }
}

// 時間トリガーの判断。無い・古い印・DB が新しい・最終更新日時を確かめられない・上限超え → 作り直す
function snapshotNeedsRebuild_(snap, dbModifiedMs, nowMs, maxAgeMs) {
  if (!snap || snap.stale) return true;
  if (dbModifiedMs === null || dbModifiedMs === undefined) return true;
  if (dbModifiedMs > snap.dbModifiedAtMs) return true;
  return nowMs - snap.builtAtMs >= maxAgeMs || nowMs < snap.builtAtMs;
}

// 表示の読み。新しい完成品があればそれを、無ければ作って置いて返す。古い印付きは使わない
function getOrBuildSnapshot_(name, maxAgeMs, buildFn) {
  var all = {};
  try { all = PropertiesService.getScriptProperties().getProperties(); } catch (e) { all = {}; }
  var snap = readSnapshot_(name, all);
  var now = Date.now();
  if (snap && !snap.stale && now >= snap.builtAtMs && now - snap.builtAtMs < maxAgeMs) return snap.data;
  var startedAt = Date.now();
  var dbModified = getDbLastModifiedMs_(getOrCreateDatabase_());
  var data = buildFn();
  writeSnapshot_(name, data, { dbModifiedAtMs: dbModified === null ? -1 : dbModified, buildStartedAtMs: startedAt });
  return data;
}
