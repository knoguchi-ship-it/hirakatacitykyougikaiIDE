// gas-src/61_line_post.gs — 公式 LINE の投稿依頼。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

// ─────────────────────────────────────────────────────────────────────────
// v374.1: 公式LINE投稿依頼（管理者ポータル → LINE 担当者への依頼集約）
// ─────────────────────────────────────────────────────────────────────────

var LINE_POST_STATUS_DRAFT = 'DRAFT';
var LINE_POST_STATUS_REQUESTED = 'REQUESTED';
var LINE_POST_STATUS_POSTED = 'POSTED';
var LINE_POST_TARGET_GENERAL = 'GENERAL';
var LINE_POST_TARGET_TRAINING = 'TRAINING';
var LINE_POST_TEXT_MAX = 500;
var LINE_POST_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
var LINE_POST_ATTACHMENT_KIND_IMAGE = 'IMAGE';
var LINE_POST_ATTACHMENT_KIND_PDF = 'PDF';

function ensureLinePostRequestSheet_(ss) {
  // v376.44: ヘッダー自己修復。getOrCreateSheet_ はヘッダーを書かないため、
  // シート未作成 or ヘッダー欠落（列数0）の場合は テーブル定義 からヘッダー行を書く。
  // これを欠くと appendRowsByHeaders_ の getRange(1,1,1,0) が
  // 「範囲の列数には1以上を指定してください」を投げ、保存が必ず失敗する。
  var sheet = ss.getSheetByName('T_LINE投稿依頼');
  if (!sheet) sheet = ss.insertSheet('T_LINE投稿依頼');
  if (sheet.getLastColumn() < 1) {
    var cols = テーブル定義['T_LINE投稿依頼'];
    sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getLinePostAssetsFolder_() {
  var ss = getOrCreateDatabase_();
  var folderId = String(getSystemSettingValue_(ss, 'LINE_POST_ASSETS_FOLDER_ID') || '').trim();
  if (folderId) {
    try { return DriveApp.getFolderById(folderId); } catch (e) { /* fall through to create */ }
  }
  var folder = DriveApp.createFolder('LINE投稿資材');
  upsertSystemSetting_(ss, 'LINE_POST_ASSETS_FOLDER_ID', folder.getId(),
    '公式LINE投稿の添付ファイル保存先 Drive フォルダID');
  return folder;
}

function rowToLinePostRequest_(row) {
  return {
    id: String(row['投稿依頼ID'] || ''),
    status: String(row['ステータス'] || LINE_POST_STATUS_DRAFT),
    text: String(row['テキスト'] || ''),
    trainingApplyUrl: String(row['研修申込リンク'] || ''),
    attachmentUrl: String(row['添付ファイルURL'] || ''),
    attachmentKind: String(row['添付ファイル種別'] || ''),
    attachmentName: String(row['添付ファイル名'] || ''),
    targetType: String(row['対象種別'] || LINE_POST_TARGET_GENERAL),
    targetId: String(row['対象ID'] || ''),
    createdByEmail: String(row['作成者メール'] || ''),
    createdByName: String(row['作成者名'] || ''),
    createdAt: String(row['作成日時'] || ''),
    updatedAt: String(row['更新日時'] || ''),
    requestedAt: String(row['投稿依頼日時'] || ''),
    postedAt: String(row['投稿日時'] || ''),
    postedByEmail: String(row['投稿マーク者メール'] || ''),
    postedByName: String(row['投稿マーク者名'] || ''),
    memo: String(row['備考'] || ''),
  };
}

// v376.45: LINE投稿「管理」権限（全件閲覧・投稿済みマーク・状態変更）の判定。
// MASTER または allowedMenus に line-post-manage を持つ session のみ true。
function lineCanManage_(session) {
  if (!session) return false;
  if (session.isMaster) return true;
  var menus = session.allowedMenus || [];
  for (var i = 0; i < menus.length; i += 1) {
    if (menus[i] === 'line-post-manage') return true;
  }
  return false;
}

function listLinePostRequests_(payload) {
  var p = payload || {};
  var statusFilter = String(p.status || '').trim();
  var targetTypeFilter = String(p.targetType || '').trim();
  var keyword = String(p.keyword || '').trim().toLowerCase();
  var limit = Math.min(Math.max(Number(p.limit) || 200, 1), 1000);

  var ss = getOrCreateDatabase_();
  ensureLinePostRequestSheet_(ss);
  // v376.45: 可視範囲 — 管理権限が無ければ自分が作成した依頼のみ。
  var session = p.__adminSession || null;
  var canManage = lineCanManage_(session);
  var callerEmail = String((session && session.loginId) || Session.getActiveUser().getEmail() || '').toLowerCase();
  var rows = getRowsAsObjects_(ss, 'T_LINE投稿依頼');
  var items = [];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (String(row['削除フラグ'] || '').toLowerCase() === 'true') continue;
    if (!canManage && String(row['作成者メール'] || '').toLowerCase() !== callerEmail) continue;
    if (statusFilter && String(row['ステータス']) !== statusFilter) continue;
    if (targetTypeFilter && String(row['対象種別']) !== targetTypeFilter) continue;
    if (keyword) {
      var hay = (String(row['テキスト']) + ' ' + String(row['備考']) + ' ' + String(row['添付ファイル名'])).toLowerCase();
      if (hay.indexOf(keyword) < 0) continue;
    }
    items.push(rowToLinePostRequest_(row));
  }
  // 作成日時降順
  items.sort(function (a, b) { return (a.createdAt < b.createdAt) ? 1 : (a.createdAt > b.createdAt ? -1 : 0); });
  var hasMore = items.length > limit;
  if (items.length > limit) items = items.slice(0, limit);
  return { items: items, total: items.length, hasMore: hasMore, statusFilter: statusFilter, targetTypeFilter: targetTypeFilter, canManage: canManage };
}

function getLinePostRequest_(payload) {
  var p = payload || {};
  var id = String(p.id || '').trim();
  if (!id) throw new Error('投稿依頼IDが必要です。');
  // v376.45: 外部 action 経由（__adminSession あり）のみ所有権ガード。内部呼び出し（save/transition の戻り）は素通り。
  var session = p.__adminSession || null;
  var enforceOwnership = !!session && !lineCanManage_(session);
  var callerEmail = String((session && session.loginId) || '').toLowerCase();
  var ss = getOrCreateDatabase_();
  ensureLinePostRequestSheet_(ss);
  var rows = getRowsAsObjects_(ss, 'T_LINE投稿依頼');
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i]['投稿依頼ID']) === id) {
      if (enforceOwnership && String(rows[i]['作成者メール'] || '').toLowerCase() !== callerEmail) {
        throw new Error('この投稿依頼を閲覧する権限がありません。');
      }
      if (String(rows[i]['削除フラグ'] || '').toLowerCase() === 'true') {
        throw new Error('削除済みの投稿依頼です。');
      }
      var item = rowToLinePostRequest_(rows[i]);
      // 関連情報（targetType=TRAINING なら研修名を同送）
      if (item.targetType === LINE_POST_TARGET_TRAINING && item.targetId) {
        var trainings = getRowsAsObjects_(ss, 'T_研修');
        for (var j = 0; j < trainings.length; j++) {
          if (String(trainings[j]['研修ID']) === item.targetId) {
            item.targetLabel = String(trainings[j]['研修名'] || '') + (trainings[j]['開催日'] ? ' (' + formatTrainingDate_(trainings[j]['開催日'], trainings[j]['開催終了時刻']) + ')' : '');
            break;
          }
        }
      }
      return { item: item };
    }
  }
  throw new Error('投稿依頼が見つかりません。');
}

function saveLinePostRequest_(payload) {
  var p = payload || {};
  var session = p.__adminSession || null;
  var caller = String((session && session.loginId) || Session.getActiveUser().getEmail() || '').toLowerCase();
  var callerName = String((session && session.displayName) || '');
  var canManage = lineCanManage_(session);
  var ss = getOrCreateDatabase_();
  ensureLinePostRequestSheet_(ss);
  var text = String(p.text || '');
  if (!text) throw new Error('テキストを入力してください。');
  if (text.length > LINE_POST_TEXT_MAX) throw new Error('テキストは' + LINE_POST_TEXT_MAX + '文字以内で入力してください。');
  var trainingApplyUrl = String(p.trainingApplyUrl || '').trim();
  if (trainingApplyUrl) {
    var urlLower = trainingApplyUrl.toLowerCase();
    if (urlLower.indexOf('http://') !== 0 && urlLower.indexOf('https://') !== 0) {
      throw new Error('研修申込リンクは http(s):// で始まる URL を入力してください。');
    }
  }
  var targetType = String(p.targetType || LINE_POST_TARGET_GENERAL);
  if (targetType !== LINE_POST_TARGET_GENERAL && targetType !== LINE_POST_TARGET_TRAINING) {
    throw new Error('対象種別が不正です。');
  }
  var targetId = String(p.targetId || '').trim();
  if (targetType === LINE_POST_TARGET_TRAINING && !targetId) {
    throw new Error('対象種別が研修の場合は対象ID（研修ID）が必要です。');
  }
  var now = new Date().toISOString();
  var id = String(p.id || '').trim();
  var sheet = ss.getSheetByName('T_LINE投稿依頼');
  if (id) {
    // 既存更新（DRAFT のみ編集可）
    var rows = getRowsAsObjects_(ss, 'T_LINE投稿依頼');
    var foundIndex = -1;
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i]['投稿依頼ID']) === id) { foundIndex = i; break; }
    }
    if (foundIndex < 0) throw new Error('編集対象の投稿依頼が見つかりません。');
    // v376.45: 管理権限が無ければ自分の依頼のみ編集可（IDOR 防止）
    if (!canManage && String(rows[foundIndex]['作成者メール'] || '').toLowerCase() !== caller) {
      throw new Error('この投稿依頼を編集する権限がありません。');
    }
    if (String(rows[foundIndex]['ステータス']) !== LINE_POST_STATUS_DRAFT) {
      throw new Error('作成中（DRAFT）の投稿依頼のみ編集できます。先に「取り下げ」を実行してください。');
    }
    var existing = rows[foundIndex];
    var updates = Object.assign({}, existing, {
      'テキスト': text,
      '研修申込リンク': trainingApplyUrl,
      '添付ファイルURL': String(p.attachmentUrl || existing['添付ファイルURL'] || ''),
      '添付ファイル種別': String(p.attachmentKind || existing['添付ファイル種別'] || ''),
      '添付ファイル名': String(p.attachmentName || existing['添付ファイル名'] || ''),
      '対象種別': targetType,
      '対象ID': targetId,
      '更新日時': now,
      '備考': String(p.memo || ''),
    });
    // 添付削除リクエスト（明示 null）
    if (p.clearAttachment === true) {
      updates['添付ファイルURL'] = '';
      updates['添付ファイル種別'] = '';
      updates['添付ファイル名'] = '';
    }
    var saveSheet = ss.getSheetByName('T_LINE投稿依頼');
    updateRowByKey_(saveSheet, テーブル定義['T_LINE投稿依頼'], '投稿依頼ID', id, updates);
    return getLinePostRequest_({ id: id });
  } else {
    // 新規作成。v376.45: submitRequest=true なら即「投稿依頼中(REQUESTED)」で作成し通知。
    var newId = Utilities.getUuid();
    var doSubmit = p.submitRequest === true;
    var newRow = {
      '投稿依頼ID': newId,
      'ステータス': doSubmit ? LINE_POST_STATUS_REQUESTED : LINE_POST_STATUS_DRAFT,
      'テキスト': text,
      '研修申込リンク': trainingApplyUrl,
      '添付ファイルURL': String(p.attachmentUrl || ''),
      '添付ファイル種別': String(p.attachmentKind || ''),
      '添付ファイル名': String(p.attachmentName || ''),
      '対象種別': targetType,
      '対象ID': targetId,
      '作成者メール': caller,
      '作成日時': now,
      '更新日時': now,
      '投稿依頼日時': doSubmit ? now : '',
      '投稿日時': '',
      '投稿マーク者メール': '',
      '備考': String(p.memo || ''),
      '削除フラグ': 'false',
      '作成者名': callerName,
      '投稿マーク者名': '',
    };
    appendRowsByHeaders_(ss, 'T_LINE投稿依頼', [newRow]);
    var saved = getLinePostRequest_({ id: newId });
    if (doSubmit) saved.notification = linePostNotifyOutcome_(ss, newId, newRow, caller);
    return saved;
  }
}

function uploadLinePostAttachment_(payload) {
  var p = payload || {};
  var base64 = String(p.base64 || '');
  var mimeType = String(p.mimeType || '').toLowerCase();
  var fileName = String(p.fileName || 'attachment');
  if (!base64) throw new Error('添付データが空です。');
  // mimeType 判定
  var kind = '';
  if (mimeType.indexOf('image/') === 0) kind = LINE_POST_ATTACHMENT_KIND_IMAGE;
  else if (mimeType === 'application/pdf') kind = LINE_POST_ATTACHMENT_KIND_PDF;
  else throw new Error('画像（jpg/png/gif/webp）または PDF のみアップロード可能です。');
  // size check (base64 length × 3/4 ≒ bytes)
  var approxBytes = Math.floor(base64.length * 0.75);
  if (approxBytes > LINE_POST_ATTACHMENT_MAX_BYTES) {
    throw new Error('ファイルサイズが上限（10MB）を超えています。');
  }
  var bytes = Utilities.base64Decode(base64);
  var blob = Utilities.newBlob(bytes, mimeType, fileName);
  var folder = getLinePostAssetsFolder_();
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return {
    url: file.getUrl(),
    fileId: file.getId(),
    fileName: file.getName(),
    kind: kind,
    mimeType: mimeType,
    sizeBytes: approxBytes,
  };
}

// v376.45: 投稿依頼登録の通知メール（saveLinePostRequest_ の submitRequest と transition 'request' で共用）。
// docs/307 S30/31（2026-10-24）: 結果を返す。以前は通知先が未設定・送信抑止でも黙って「依頼済み」になり、
// 依頼者は担当者に伝わったと思い込んだ。呼び出し元は戻り値を画面へ返す（linePostNotifyOutcome_）。
function notifyLinePostRequest_(ss, id, row, caller) {
  var notifyEmail = String(getSystemSettingValue_(ss, 'LINE_POST_NOTIFY_EMAIL') || '').trim();
  if (!notifyEmail) return { notified: false, reason: 'not_configured' };
  var now = new Date().toISOString();
  var subject = '【LINE投稿依頼】新規依頼が登録されました';
  var body = '公式LINE への投稿依頼が登録されました。\n\n'
    + '【投稿依頼ID】' + id + '\n'
    + '【依頼者】' + (String(row['作成者名'] || '') ? (String(row['作成者名']) + '（' + caller + '）') : caller) + '\n'
    + '【依頼日時】' + now + '\n\n'
    + '----- 本文 -----\n' + String(row['テキスト'] || '') + '\n\n'
    + (String(row['研修申込リンク'] || '') ? '【研修申込リンク】' + String(row['研修申込リンク']) + '\n' : '')
    + (String(row['添付ファイルURL'] || '') ? '【添付ファイル】' + String(row['添付ファイル名'] || '') + '\n' + String(row['添付ファイルURL']) + '\n' : '');
  var sent = deliverMail_('LINE_POST_REQUEST', notifyEmail, subject, body, {});
  return sent && sent.sent ? { notified: true } : { notified: false, reason: 'suppressed' };
}

function linePostNotifyOutcome_(ss, id, row, caller) {
  try {
    return notifyLinePostRequest_(ss, id, row, caller);
  } catch (e) {
    Logger.log('[notifyLinePostRequest_] failed: ' + e.message);
    return { notified: false, reason: 'failed' };
  }
}

function transitionLinePostRequest_(payload) {
  var p = payload || {};
  var id = String(p.id || '').trim();
  // build pruner が `if (action === '...')` を dispatcher case と誤認するのを避けるため
  // パラメータ名は `transAction` を使用（payload.action は外部 API 名で固定のため受信側のみ別名）
  var transAction = String(p.action || '').trim(); // 'request' / 'post' / 'withdraw'
  if (!id) throw new Error('投稿依頼IDが必要です。');
  var session = p.__adminSession || null;
  var caller = String((session && session.loginId) || Session.getActiveUser().getEmail() || '').toLowerCase();
  var callerName = String((session && session.displayName) || '');
  var canManage = lineCanManage_(session);
  var ss = getOrCreateDatabase_();
  ensureLinePostRequestSheet_(ss);
  var rows = getRowsAsObjects_(ss, 'T_LINE投稿依頼');
  var found = null;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i]['投稿依頼ID']) === id) { found = rows[i]; break; }
  }
  if (!found) throw new Error('投稿依頼が見つかりません。');
  var isOwner = String(found['作成者メール'] || '').toLowerCase() === caller;
  // v376.45: post（投稿済みマーク）は管理権限のみ。request/withdraw は所有者 or 管理権限。
  if (transAction === 'post') {
    if (!canManage) throw new Error('「投稿済み」にする権限がありません（LINE投稿 管理権限が必要です）。');
  } else if (transAction === 'request' || transAction === 'withdraw') {
    if (!canManage && !isOwner) throw new Error('この投稿依頼を操作する権限がありません。');
  }
  var now = new Date().toISOString();
  var currentStatus = String(found['ステータス']);
  var updates = { '更新日時': now };
  if (transAction === 'request') {
    if (currentStatus !== LINE_POST_STATUS_DRAFT) {
      throw new Error('作成中（DRAFT）の投稿依頼のみ依頼へ移行できます。');
    }
    updates['ステータス'] = LINE_POST_STATUS_REQUESTED;
    updates['投稿依頼日時'] = now;
  } else if (transAction === 'post') {
    if (currentStatus !== LINE_POST_STATUS_REQUESTED) {
      throw new Error('投稿依頼中（REQUESTED）の依頼のみ「投稿済み」に移行できます。');
    }
    updates['ステータス'] = LINE_POST_STATUS_POSTED;
    updates['投稿日時'] = now;
    updates['投稿マーク者メール'] = caller;
    updates['投稿マーク者名'] = callerName;
  } else if (transAction === 'withdraw') {
    if (currentStatus === LINE_POST_STATUS_POSTED) {
      throw new Error('投稿済みの依頼は取下げできません。');
    }
    updates['ステータス'] = LINE_POST_STATUS_DRAFT;
    updates['投稿依頼日時'] = '';
  } else {
    throw new Error('不正な遷移アクションです。');
  }
  var transSheet = ss.getSheetByName('T_LINE投稿依頼');
  updateRowByKey_(transSheet, テーブル定義['T_LINE投稿依頼'], '投稿依頼ID', id, updates);
  var transitioned = getLinePostRequest_({ id: id });
  // docs/307 S44: 通知は状態を保存してから送る（以前は先に送り、保存に失敗しても通知だけ届いた）
  if (transAction === 'request') transitioned.notification = linePostNotifyOutcome_(ss, id, found, caller);
  return transitioned;
}

function deleteLinePostRequest_(payload) {
  var p = payload || {};
  var id = String(p.id || '').trim();
  if (!id) throw new Error('投稿依頼IDが必要です。');
  var ss = getOrCreateDatabase_();
  ensureLinePostRequestSheet_(ss);
  // v376.45: 管理権限が無ければ自分の依頼のみ削除可
  var session = p.__adminSession || null;
  if (session && !lineCanManage_(session)) {
    var callerEmail = String(session.loginId || '').toLowerCase();
    var rows = getRowsAsObjects_(ss, 'T_LINE投稿依頼');
    var owns = false;
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i]['投稿依頼ID']) === id) { owns = String(rows[i]['作成者メール'] || '').toLowerCase() === callerEmail; break; }
    }
    if (!owns) throw new Error('この投稿依頼を削除する権限がありません。');
  }
  var delSheet = ss.getSheetByName('T_LINE投稿依頼');
  updateRowByKey_(delSheet, テーブル定義['T_LINE投稿依頼'], '投稿依頼ID', id, {
    '削除フラグ': 'true',
    '更新日時': new Date().toISOString(),
  });
  return { ok: true, id: id };
}
