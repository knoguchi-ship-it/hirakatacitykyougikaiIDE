// gas-src/41_training_files.gs — 研修の案内状ファイル・サムネイル。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

/**
 * 研修案内状ファイル（base64）をGoogle Driveにアップロードし、共有URLを返す。
 * PDFの場合はGoogleが自動生成するサムネイルを取得して永続保存し thumbnailUrl も返す。
 * payload: { base64: string, filename: string, mimeType: string }
 */
/**
 * 研修ファイル用フォルダを取得する（T_システム設定の TRAINING_FILE_FOLDER_ID）。
 * 2026-11-12 docs/324 ②（operator 指示「作らない様にして」）: **開けない・未設定のときは作らずに止める**（fail-closed）。
 *   以前は開けないと黙ってマイドライブ直下に「研修案内状」を作り、ID をスクリプトプロパティにだけ控えていた。
 *   設定へ書き戻さないので 10 分ごとの processPendingThumbnails が毎回作り、2026-11 に空フォルダが大量にできた。
 *   作り直しの入口は設定画面の「フォルダを作成・設定する」（setupTrainingFileFolder_）だけ。
 * getFoldersByName() は Drive 全体検索を行うため失敗リスクが高く使用しない。
 */
function getTrainingFolder_(ss) {
  return resolveTrainingFolder_(ss, false);
}

function resolveTrainingFolder_(ss, allowCreate) {
  var storedId = String((ss ? getSystemSettingValue_(ss, 'TRAINING_FILE_FOLDER_ID') : '') || '').trim();
  if (storedId) {
    try {
      return DriveApp.getFolderById(storedId);
    } catch (e) {
      if (!allowCreate) {
        throw new Error('研修ファイルの保存先フォルダを開けません（' + storedId + '）。設定画面の「フォルダを作成・設定する」で設定し直してください。');
      }
    }
  } else if (!allowCreate) {
    throw new Error('研修ファイルの保存先フォルダが設定されていません。設定画面の「フォルダを作成・設定する」で設定してください。');
  }
  var newFolder = DriveApp.getRootFolder().createFolder('研修案内状');
  newFolder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  return newFolder;
}

/**
 * 研修ファイル用フォルダIDを返す管理者 API。
 * 設定画面の「フォルダを作成・設定する」ボタンから呼び出す。
 * 開けない・未設定のときに新しく作るのはここだけ（明示の操作）。作ったら必ず T_システム設定へ保存する。
 */
function setupTrainingFileFolder_(payload) {
  var ss = getOrCreateDatabase_();
  var folder = resolveTrainingFolder_(ss, true);
  var folderId = folder.getId();
  var folderUrl = 'https://drive.google.com/drive/folders/' + folderId;

  // T_システム設定に保存
  var updates = [{ key: 'TRAINING_FILE_FOLDER_ID', value: folderId, description: '研修ファイル保存先Driveフォルダ ID' }];
  batchUpsertSystemSettings_(ss, updates);

  return { folderId: folderId, folderUrl: folderUrl };
}

function uploadTrainingFile_(payload) {
  if (!payload || !payload.base64) throw new Error('ファイルデータが空です。');
  var filename = payload.filename || 'upload';
  var mimeType = payload.mimeType || 'application/octet-stream';

  var bytes = Utilities.base64Decode(payload.base64);
  var blob = Utilities.newBlob(bytes, mimeType, filename);

  var ss = getOrCreateDatabase_();
  var folder = getTrainingFolder_(ss);

  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var pdfFileId = file.getId();
  var pdfFileUrl = file.getUrl();
  var thumbnailUrl = '';
  // v350: client が UX を切り替えるための状態。'skipped' は PDF 以外。
  // v351: 'client-generated' = ブラウザ側で pdf.js が render した PNG を保存
  var thumbnailGenerationStatus = 'skipped';

  // v351: client (pdfjs-dist) が先に 1 ページ目を PNG に変換して送ってきた場合は
  // それを Drive にそのまま createFile する（Drive thumbnail API 待ち skip）。
  // 体感 3〜8 秒で完結する。client 失敗時は thumbnailBase64=空で v350 経路へ。
  var clientThumbnailBase64 = String((payload && payload.thumbnailBase64) || '').trim();
  if (clientThumbnailBase64) {
    try {
      var clientPngBytes = Utilities.base64Decode(clientThumbnailBase64);
      var clientPngBlob = Utilities.newBlob(clientPngBytes, 'image/png',
        'thumb_' + pdfFileId + '_' + Date.now() + '_client.png');
      var clientPngFile = folder.createFile(clientPngBlob);
      clientPngFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      thumbnailUrl = clientPngFile.getUrl();
      thumbnailGenerationStatus = 'client-generated';
    } catch (e) {
      Logger.log('uploadTrainingFile_: client thumbnail save failed pdfFileId=' + pdfFileId + ': ' + e.message);
    }
  }

  // v349: client が thumbnail を送ってこなかった or 上で失敗した場合のみ、
  // サーバ側の Drive thumbnailLink polling へ fallback する。
  if (!thumbnailUrl) {
    var looksLikePdf = String(mimeType).toLowerCase().indexOf('pdf') >= 0 ||
      /\.pdf$/i.test(filename);
    if (looksLikePdf) {
      try {
        thumbnailUrl = generateAndSaveThumbnailForPdf_(pdfFileId, folder) || '';
        thumbnailGenerationStatus = thumbnailUrl ? 'generated' : 'pending';
      } catch (e) {
        Logger.log('uploadTrainingFile_: server thumbnail generation failed pdfFileId=' + pdfFileId + ': ' + e.message);
        thumbnailUrl = '';
        thumbnailGenerationStatus = 'failed';
      }
    }
  }

  return {
    url: pdfFileUrl,
    driveFileId: pdfFileId,
    thumbnailUrl: thumbnailUrl,
    thumbnailGenerationStatus: thumbnailGenerationStatus,
  };
}

/**
 * v350: 単一研修のサムネイル PNG を再生成する admin action。
 * 編集モーダルの「サムネイル再生成」ボタンから呼ぶ。
 * payload: { trainingId }
 * 返り値: { trainingId, thumbnailUrl, thumbnailGenerationStatus, reason? }
 */
function regenerateThumbnailForTraining_(payload) {
  var trainingId = String((payload && payload.trainingId) || '').trim();
  if (!trainingId) throw new Error('trainingId が未指定です。');
  var ss = getOrCreateDatabase_();
  var folder = getTrainingFolder_(ss);
  var rows = getRowsAsObjects_(ss, 'T_研修').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var row = rows.find ? rows.find(function(r) { return String(r['研修ID']) === trainingId; })
    : (function() { for (var i = 0; i < rows.length; i += 1) if (String(rows[i]['研修ID']) === trainingId) return rows[i]; return null; })();
  if (!row) throw new Error('研修ID「' + trainingId + '」が見つかりません。');

  var pdfUrl = String(row['案内状URL'] || '').trim();
  if (!pdfUrl) {
    return { trainingId: trainingId, thumbnailUrl: '', thumbnailGenerationStatus: 'skipped', reason: 'no_pdf' };
  }
  var pdfIdMatch = pdfUrl.match(/\/file\/d\/([^/?]+)/) || pdfUrl.match(/[?&]id=([^&]+)/);
  if (!pdfIdMatch) {
    return { trainingId: trainingId, thumbnailUrl: '', thumbnailGenerationStatus: 'failed', reason: 'pdf_url_unparseable' };
  }
  var pdfId = pdfIdMatch[1];
  var oldThumb = String(row['案内状サムネイルURL'] || '').trim();
  try {
    var newThumbUrl = generateAndSaveThumbnailForPdf_(pdfId, folder);
    if (!newThumbUrl) {
      return { trainingId: trainingId, thumbnailUrl: '', thumbnailGenerationStatus: 'pending', reason: 'thumbnail_not_ready' };
    }
    updateTrainingThumbnailUrlByRowId_(ss, trainingId, newThumbUrl);
    if (oldThumb) trashFileFromUrlIfPossible_(oldThumb);
    clearAllDataCache_();
    clearAdminDashboardCache_();
    clearTrainingManagementCache_();
    return { trainingId: trainingId, thumbnailUrl: newThumbUrl, thumbnailGenerationStatus: 'generated' };
  } catch (e) {
    Logger.log('regenerateThumbnailForTraining_: error trainingId=' + trainingId + ' msg=' + e.message);
    return { trainingId: trainingId, thumbnailUrl: '', thumbnailGenerationStatus: 'failed', reason: String(e.message || e).substring(0, 200) };
  }
}

function processPendingThumbnails(e) {
  assertTriggerOrMasterOperator_(e, 'processPendingThumbnails');
  try {
    var ss = getOrCreateDatabase_();
    var rows = getRowsAsObjects_(ss, 'T_研修').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
    // 2026-11-12 docs/324 ②: 先に対象（案内状あり・サムネイル無し）を数え、0 件ならフォルダに触れずに終わる。
    // 保存先を開けないときは getTrainingFolder_ が作らずに例外を投げる（下の catch で通知）。
    var targets = [];
    for (var t = 0; t < rows.length; t += 1) {
      if (String(rows[t]['案内状サムネイルURL'] || '').trim()) continue;
      var targetPdfUrl = String(rows[t]['案内状URL'] || '').trim();
      if (!targetPdfUrl) continue;
      var tm = targetPdfUrl.match(/\/file\/d\/([^/?]+)/) || targetPdfUrl.match(/[?&]id=([^&]+)/);
      if (tm) targets.push({ row: rows[t], fileId: tm[1] });
    }
    if (!targets.length) {
      recordJobHeartbeat_('processPendingThumbnails');
      return;
    }
    var folder = getTrainingFolder_(ss);
    var MAX_BATCH = 5;
    var processed = 0;
    for (var i = 0; i < targets.length && processed < MAX_BATCH; i += 1) {
      var row = targets[i].row;
      try {
        var newUrl = generateAndSaveThumbnailForPdf_(targets[i].fileId, folder);
        if (newUrl) {
          updateTrainingThumbnailUrlByRowId_(ss, String(row['研修ID']), newUrl);
          Logger.log('processPendingThumbnails: backfilled trainingId=' + row['研修ID']);
          processed += 1;
        }
      } catch (e) {
        Logger.log('processPendingThumbnails: error trainingId=' + row['研修ID'] + ' ' + e.message);
      }
    }
    if (processed > 0) {
      clearAllDataCache_();
      clearAdminDashboardCache_();
      clearTrainingManagementCache_();
    }
    recordJobHeartbeat_('processPendingThumbnails');
  } catch (e) {
    Logger.log('processPendingThumbnails: fatal ' + e.message);
    notifyScheduledJobFailureToChat_('processPendingThumbnails', e);
  }
}

/**
 * v350: processPendingThumbnails を 10 分ごとに走らせるトリガーを登録する。
 * 既存の同名トリガーを削除して再登録（冪等）。
 * admin の Apps Script editor から 1 回手動実行する想定。
 */
function setupPendingThumbnailsTrigger() {
  assertMasterOperator_('setupPendingThumbnailsTrigger');
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'processPendingThumbnails') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('processPendingThumbnails').timeBased().everyMinutes(10).create();
  Logger.log('setupPendingThumbnailsTrigger: trigger installed (every 10 min).');
  return { ok: true, intervalMinutes: 10 };
}

/**
 * v349: 既存 PDF (Drive 上の fileId) から 1 ページ目のサムネイル PNG を生成し、
 * 同フォルダに ANYONE_WITH_LINK の PNG ファイルとして保存して URL を返す。
 *
 * 流れ:
 *   1. Drive REST API v3 files.get?fields=thumbnailLink を Bearer 付きで呼び、
 *      Drive が裏で生成した lh3.googleusercontent.com の URL を取得。
 *      生成が間に合わない場合があるため最大 3 回まで sleep ＋ retry。
 *   2. thumbnailLink の =s220 を =w800 に置換して解像度を引き上げ、Bearer 付きで
 *      fetch して PNG bytes を取得。
 *   3. PNG を専用ファイル名で同フォルダに createFile + ANYONE_WITH_LINK 共有。
 *   4. 永続化した PNG の getUrl() を返却。
 *
 * 失敗時は空文字を返す（呼び出し側で UI fallback を出す）。
 *
 * Ref: Tanaike, 2023 ("Converting All Pages in PDF File to PNG Images using Google
 *      Apps Script") — multi-page splitting 部分は不要なので簡素化した形を採用。
 */
function generateAndSaveThumbnailForPdf_(pdfFileId, folder) {
  if (!pdfFileId) return '';
  var authHeaders = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() };

  // v350: hasThumbnail boolean field を真実情報として polling する。
  // Drive コミュニティ推奨 (Latenode thread, 2024-2025) では 10-15 秒初動 +
  // 30s 毎に 5 分まで polling だが、Web App の同期 path で 5 分は不可。
  // ここでは admin の UX を考慮し最大 25 秒 (5s x 5 回) まで sync で粘る。
  // 間に合わなければ '' を返し、time-based trigger (processPendingThumbnails_)
  // が後追いで生成する。
  var thumbnailLink = '';
  var maxAttempts = 5;
  for (var attempt = 1; attempt <= maxAttempts; attempt += 1) {
    Utilities.sleep(5000);
    var metaUrl = 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(pdfFileId) +
      '?fields=thumbnailLink,hasThumbnail,mimeType&supportsAllDrives=true';
    var metaResp = UrlFetchApp.fetch(metaUrl, { muteHttpExceptions: true, headers: authHeaders });
    var metaCode = metaResp.getResponseCode();
    if (metaCode !== 200) {
      Logger.log('generateAndSaveThumbnailForPdf_: files.get attempt=' + attempt +
        ' code=' + metaCode + ' pdfFileId=' + pdfFileId +
        ' body=' + metaResp.getContentText().substring(0, 200));
      continue;
    }
    var meta = JSON.parse(metaResp.getContentText());
    if (meta && meta.hasThumbnail && meta.thumbnailLink) {
      thumbnailLink = meta.thumbnailLink;
      Logger.log('generateAndSaveThumbnailForPdf_: hasThumbnail=true at attempt=' + attempt +
        ' pdfFileId=' + pdfFileId);
      break;
    }
    Logger.log('generateAndSaveThumbnailForPdf_: hasThumbnail=' + (meta && meta.hasThumbnail) +
      ' thumbnailLink=' + (meta && !!meta.thumbnailLink) + ' attempt=' + attempt +
      ' pdfFileId=' + pdfFileId);
  }

  if (!thumbnailLink) {
    Logger.log('generateAndSaveThumbnailForPdf_: not ready after ' +
      maxAttempts + ' attempts pdfFileId=' + pdfFileId +
      ' — processPendingThumbnails_ trigger will retry later');
    return '';
  }

  var sizedLink = thumbnailLink.replace(/=s\d+(-.+)?$/, '=w800').replace(/=s\d+$/, '=w800');
  var imgResp = UrlFetchApp.fetch(sizedLink, {
    muteHttpExceptions: true,
    followRedirects: true,
    headers: authHeaders,
  });
  var imgCode = imgResp.getResponseCode();
  if (imgCode !== 200) {
    Logger.log('generateAndSaveThumbnailForPdf_: thumbnailLink fetch code=' + imgCode +
      ' pdfFileId=' + pdfFileId);
    return '';
  }
  var pngBlob = imgResp.getBlob();
  var contentType = pngBlob.getContentType() || 'image/png';
  if (contentType.indexOf('image/') !== 0) {
    Logger.log('generateAndSaveThumbnailForPdf_: unexpected contentType=' + contentType +
      ' pdfFileId=' + pdfFileId);
    return '';
  }
  pngBlob.setName('thumb_' + pdfFileId + '_' + Date.now() + '.png');

  var pngFile = folder.createFile(pngBlob);
  pngFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return pngFile.getUrl();
}

/**
 * v349: URL から fileId を抽出して Drive 上のファイルを trashed にする。
 * 想定: 研修案内 PDF / サムネイル PNG の差し替え時に旧ファイルを GC する。
 * fileId が抽出できない / 既に trashed / 権限不足 等は黙って無視する。
 */
/**
 * v349 backfill: 既存研修のサムネイル PNG を一括生成する MASTER 専用ツール。
 * clasp run regenerateAllThumbnails --params '[{ ... }]' から呼ぶ。
 *
 * payload:
 *   - trainingId?: string  特定の研修だけ対象。未指定で全件
 *   - force?: boolean      既にサムネイル URL がある研修も上書きする
 *   - dryRun?: boolean     生成は行わず対象数だけ報告
 *
 * 返却: { dryRun, processed, succeeded, skipped, failed: [{id,name,reason}] }
 *
 * セキュリティ: clasp run は OAuth 認証済の deployer (k.noguchi@hcm-n.org) として
 * 実行されるため、ここでは MASTER 確認を行わない。Apps Script editor から
 * 誤って呼ばれても damage は「サムネイル再生成」だけで非破壊。元 PDF が現 deployer
 * から不可視 (Drive REST 404) のものはスキップして失敗扱い + 理由をログへ。
 */
function regenerateAllThumbnails(payload) {
  assertMasterOperator_('regenerateAllThumbnails');
  var opts = payload || {};
  var trainingId = String(opts.trainingId || '').trim();
  var force = !!opts.force;
  var dryRun = !!opts.dryRun;

  var ss = getOrCreateDatabase_();
  var folder = getTrainingFolder_(ss);
  var sheet = ss.getSheetByName('T_研修');
  if (!sheet || sheet.getLastRow() < 2) {
    return { dryRun: dryRun, processed: 0, succeeded: 0, skipped: 0, failed: [] };
  }

  var rows = getRowsAsObjects_(ss, 'T_研修').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  if (trainingId) {
    rows = rows.filter(function(r) { return String(r['研修ID']) === trainingId; });
  }

  var result = { dryRun: dryRun, processed: 0, succeeded: 0, skipped: 0, failed: [] };

  for (var i = 0; i < rows.length; i += 1) {
    var row = rows[i];
    var pdfUrl = String(row['案内状URL'] || '').trim();
    var existingThumb = String(row['案内状サムネイルURL'] || '').trim();
    if (!pdfUrl) {
      result.skipped += 1;
      continue;
    }
    if (existingThumb && !force) {
      result.skipped += 1;
      continue;
    }
    result.processed += 1;

    var pdfIdMatch = pdfUrl.match(/\/file\/d\/([^/?]+)/) || pdfUrl.match(/[?&]id=([^&]+)/);
    if (!pdfIdMatch) {
      result.failed.push({ id: String(row['研修ID']), name: String(row['研修名']), reason: 'pdf_url_unparseable' });
      continue;
    }
    var pdfId = pdfIdMatch[1];

    if (dryRun) {
      result.succeeded += 1;
      continue;
    }

    try {
      var newThumbUrl = generateAndSaveThumbnailForPdf_(pdfId, folder);
      if (!newThumbUrl) {
        result.failed.push({ id: String(row['研修ID']), name: String(row['研修名']), reason: 'no_thumbnail_link' });
        continue;
      }
      updateTrainingThumbnailUrlByRowId_(ss, String(row['研修ID']), newThumbUrl);
      if (existingThumb) {
        trashFileFromUrlIfPossible_(existingThumb);
      }
      result.succeeded += 1;
      Logger.log('regenerateAllThumbnails: OK trainingId=' + row['研修ID'] + ' -> ' + newThumbUrl);
    } catch (e) {
      var reason = String((e && e.message) || e).substring(0, 200);
      result.failed.push({ id: String(row['研修ID']), name: String(row['研修名']), reason: reason });
      Logger.log('regenerateAllThumbnails: FAIL trainingId=' + row['研修ID'] + ' reason=' + reason);
    }
  }

  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();
  return result;
}

function updateTrainingThumbnailUrlByRowId_(ss, trainingId, thumbUrl) {
  var sheet = ss.getSheetByName('T_研修');
  if (!sheet) throw new Error('T_研修 sheet missing');
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var idCol = headers.indexOf('研修ID');
  var thumbCol = headers.indexOf('案内状サムネイルURL');
  var updatedCol = headers.indexOf('更新日時');
  if (idCol < 0 || thumbCol < 0) throw new Error('required column missing');
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  var ids = sheet.getRange(2, idCol + 1, lastRow - 1, 1).getValues();
  for (var r = 0; r < ids.length; r += 1) {
    if (String(ids[r][0]) === String(trainingId)) {
      sheet.getRange(r + 2, thumbCol + 1).setValue(thumbUrl);
      if (updatedCol >= 0) sheet.getRange(r + 2, updatedCol + 1).setValue(new Date().toISOString());
      return;
    }
  }
}

function trashFileFromUrlIfPossible_(url) {
  if (!url) return false;
  var fileId = extractDriveFileId_(url);
  if (!fileId) return false;
  try {
    DriveApp.getFileById(fileId).setTrashed(true);
    return true;
  } catch (e) {
    Logger.log('trashFileFromUrlIfPossible_: ' + e.message + ' url=' + url);
    return false;
  }
}

// v345: Google Drive ファイルのサムネイルを base64 data URL で返す。
//
// 真因の経緯:
//   - v272 で DriveApp.getFileById(id).getThumbnail() を使用していたが、これは
//     PDF に対し常に null を返す Apps Script の既知制約があり、PDF サムネイルが
//     一切表示できない状態だった（issuetracker / forums 多数）。
//   - v345 で Google Drive の公開 thumbnail endpoint
//     `https://drive.google.com/thumbnail?id=<id>&sz=w400` を UrlFetchApp で取得し、
//     bytes を base64 へ変換するアプローチへ切替。Drive の thumbnail CDN が PDF→
//     画像変換を裏で実行するため、PDF にもサムネイルが返る。
//   - <img src> 直接参照では rate limit / 多枚問題が起きるが、サーバー側で取得して
//     base64 化すればクライアントは data: URL を読むだけなので回避できる。
//   - ANYONE_WITH_LINK 共有ファイルは無認証 UrlFetchApp で取得可能（member split は
//     drive scope 無しだが script.external_request はあるため動作する）。
//   - CacheService で 1 時間キャッシュ（item size limit 100KB を考慮し、超える
//     payload はキャッシュをスキップ）。
/**
 * v349: 引数で渡される URL は「PDF の URL」ではなく **「事前生成済み PNG サムネイル」
 * の Drive URL** である前提（uploadTrainingFile_ が生成して T_研修.案内状サムネイルURL
 * に保存している）。実行ユーザー所有の PNG なので DriveApp.getBlob() で確実に取れる。
 *
 * v358: payload.size でリサイズ指示を受け付ける。
 *   - 未指定 / 0: 既存の DriveApp.getBlob() (元 PNG をそのまま返却、低解像度サムネ用)
 *   - 数値 (例: 2000): Drive thumbnailLink を w<N> で再取得して高解像度 PNG を返す
 *     （lightbox 拡大表示用）
 *
 * 想定外（fileId 抽出不可 / 取得例外 / image 以外）の場合は SVG プレースホルダを返却し、
 * 画面が空にならないようにする。
 */
function getFileThumbnail_(payload) {
  var fileUrl = String((payload && payload.fileUrl) || '').trim();
  if (!fileUrl) return { thumbnail: null };
  var requestedSize = Number((payload && payload.size) || 0);

  var fileId = extractDriveFileId_(fileUrl);
  if (!fileId) {
    Logger.log('getFileThumbnail_: cannot extract fileId from url=' + fileUrl);
    return { thumbnail: makePdfSvgPlaceholder_('PDF') };
  }
  if (!isTrainingGuideDriveFileAllowed_(fileId)) {
    Logger.log('getFileThumbnail_: denied non-training fileId=' + fileId);
    return { thumbnail: makePdfSvgPlaceholder_('PDF') };
  }

  var cache = CacheService.getScriptCache();
  var cacheKey = 'thumb_v358_' + fileId + '_s' + (requestedSize || 0);
  try {
    var cached = cache.get(cacheKey);
    if (cached) return { thumbnail: cached };
  } catch (e1) {}

  // v358: 大きいサイズ要求時は thumbnailLink (lh3.googleusercontent.com) を再取得
  if (requestedSize > 0) {
    try {
      var authHeaders = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() };
      var metaUrl = 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(fileId) +
        '?fields=thumbnailLink,mimeType,name&supportsAllDrives=true';
      var metaResp = UrlFetchApp.fetch(metaUrl, { muteHttpExceptions: true, headers: authHeaders });
      if (metaResp.getResponseCode() === 200) {
        var meta = JSON.parse(metaResp.getContentText());
        if (meta && meta.thumbnailLink) {
          var sizedLink = meta.thumbnailLink
            .replace(/=s\d+(-.+)?$/, '=w' + requestedSize)
            .replace(/=s\d+$/, '=w' + requestedSize)
            .replace(/=w\d+(-.+)?$/, '=w' + requestedSize);
          var imgResp = UrlFetchApp.fetch(sizedLink, {
            muteHttpExceptions: true,
            followRedirects: true,
            headers: authHeaders,
          });
          if (imgResp.getResponseCode() === 200) {
            var hrBlob = imgResp.getBlob();
            var hrCt = hrBlob.getContentType() || 'image/png';
            if (hrCt.indexOf('image/') === 0) {
              var hrDataUrl = 'data:' + hrCt + ';base64,' + Utilities.base64Encode(hrBlob.getBytes());
              if (hrDataUrl.length < 95 * 1024) {
                try { cache.put(cacheKey, hrDataUrl, 3600); } catch (e2) {}
              }
              return { thumbnail: hrDataUrl };
            }
          } else {
            Logger.log('getFileThumbnail_ high-res link fetch code=' + imgResp.getResponseCode());
          }
        }
      } else {
        Logger.log('getFileThumbnail_ high-res files.get code=' + metaResp.getResponseCode());
      }
      // 高解像度取得が何らかで失敗した場合は通常 PNG 取得経路へ fallback
    } catch (eHr) {
      Logger.log('getFileThumbnail_ high-res error: ' + eHr.message);
    }
  }

  try {
    var file = DriveApp.getFileById(fileId);
    var blob = file.getBlob();
    var contentType = blob.getContentType() || '';
    if (contentType.indexOf('image/') !== 0) {
      // 受け取ったのが PNG ではなく PDF だった等の異常系
      Logger.log('getFileThumbnail_: not an image fileId=' + fileId + ' ct=' + contentType);
      return { thumbnail: makePdfSvgPlaceholder_(file.getName()) };
    }
    var base64 = Utilities.base64Encode(blob.getBytes());
    var dataUrl = 'data:' + contentType + ';base64,' + base64;
    if (dataUrl.length < 95 * 1024) {
      try { cache.put(cacheKey, dataUrl, 3600); } catch (e2) {}
    }
    return { thumbnail: dataUrl };
  } catch (e) {
    Logger.log('getFileThumbnail_: error fileId=' + fileId + ' msg=' + e.message);
    return { thumbnail: makePdfSvgPlaceholder_('PDF') };
  }
}

/**
 * v358: 各種 Drive URL から fileId を堅牢に抽出する共通ヘルパー。
 * 対応形式:
 *   - https://drive.google.com/file/d/<id>/view (or /preview or /edit)
 *   - https://drive.google.com/open?id=<id>
 *   - https://drive.google.com/uc?export=download&id=<id>
 *   - https://drive.google.com/d/<id>
 *   - 単体 fileId 文字列 (28〜44 文字の英数 + - _)
 *   - URL encode された上記
 */
function extractDriveFileId_(url) {
  if (!url) return null;
  var decoded;
  try { decoded = decodeURIComponent(String(url)); } catch (e) { decoded = String(url); }
  var patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]{20,})/,
    /\/d\/([a-zA-Z0-9_-]{20,})/,
    /[?&]id=([a-zA-Z0-9_-]{20,})/,
    /^([a-zA-Z0-9_-]{28,44})$/,
  ];
  for (var i = 0; i < patterns.length; i += 1) {
    var m = decoded.match(patterns[i]);
    if (m && m[1]) return m[1];
  }
  return null;
}

/**
 * Drive proxy の公開面を T_研修 に登録済みの案内 PDF / 生成済みサムネイルだけへ制限する。
 * WebApp は USER_DEPLOYING 権限で Drive を読むため、任意 fileId proxy にならないよう fail-closed。
 */
function isTrainingGuideDriveFileAllowed_(fileId) {
  var targetId = String(fileId || '').trim();
  if (!targetId) return false;
  try {
    var ss = getOrCreateDatabase_();
    var rows = getRowsAsObjects_(ss, 'T_研修');
    for (var i = 0; i < rows.length; i += 1) {
      var row = rows[i];
      if (toBoolean_(row['削除フラグ'])) continue;
      if (APP_SECURITY_BOUNDARY === 'public' && !computeTrainingAvailability_(row).isApplicationOpen) continue;
      var pdfId = extractDriveFileId_(row['案内状URL']);
      if (pdfId && pdfId === targetId) return true;
      var thumbId = extractDriveFileId_(row['案内状サムネイルURL']);
      if (thumbId && thumbId === targetId) return true;
    }
  } catch (e) {
    Logger.log('isTrainingGuideDriveFileAllowed_: fail-closed error=' + (e && e.message ? e.message : String(e)));
  }
  return false;
}

/**
 * v357: Drive 上の PDF 本体の bytes を base64 で返す。lightbox 内 iframe で
 * ブラウザ内蔵 PDF viewer に表示する用途。
 *
 * 背景: Drive の /file/d/<id>/preview を直接 iframe で埋め込むと、Drive が
 * CSP `frame-ancestors https://drive.google.com` を返すため外部からの埋め込み
 * が CSP 違反でブロックされる (2024 以降の Google セキュリティ強化)。
 * GAS server で PDF bytes を取得して base64 で返し、client で blob URL を
 * 作って iframe に渡せば CSP の制約を受けない。
 *
 * 制限: 大きい PDF を毎回 client へ送るとレスポンス時間が伸びるため、
 * 10MB 超のファイルは error code で返して client に「別タブで開く」案内へ
 * 切り替えてもらう。
 */
function getFileBytes_(payload) {
  var fileUrl = String((payload && payload.fileUrl) || '').trim();
  if (!fileUrl) return { base64: null, error: 'empty_url' };
  var fileId = extractDriveFileId_(fileUrl);
  if (!fileId) {
    Logger.log('getFileBytes_: cannot extract fileId from url=' + fileUrl);
    return { base64: null, error: 'unparseable_url' };
  }
  if (!isTrainingGuideDriveFileAllowed_(fileId)) {
    Logger.log('getFileBytes_: denied non-training fileId=' + fileId);
    return { base64: null, error: 'access_denied' };
  }

  var authHeaders = { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() };
  try {
    var metaResp = UrlFetchApp.fetch(
      'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(fileId) +
      '?fields=size,mimeType,name&supportsAllDrives=true',
      { muteHttpExceptions: true, headers: authHeaders }
    );
    if (metaResp.getResponseCode() !== 200) {
      Logger.log('getFileBytes_ meta non-200 code=' + metaResp.getResponseCode() + ' fileId=' + fileId);
      return { base64: null, error: 'meta_failed' };
    }
    var meta = JSON.parse(metaResp.getContentText());
    var sizeBytes = Number(meta.size || 0);
    if (sizeBytes > 10 * 1024 * 1024) {
      Logger.log('getFileBytes_ too large: ' + sizeBytes + ' fileId=' + fileId);
      return { base64: null, error: 'file_too_large', size: sizeBytes };
    }

    var bytesResp = UrlFetchApp.fetch(
      'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(fileId) +
      '?alt=media&supportsAllDrives=true',
      { muteHttpExceptions: true, headers: authHeaders, followRedirects: true }
    );
    if (bytesResp.getResponseCode() !== 200) {
      Logger.log('getFileBytes_ media non-200 code=' + bytesResp.getResponseCode() + ' fileId=' + fileId);
      return { base64: null, error: 'media_failed' };
    }
    var blob = bytesResp.getBlob();
    return {
      base64: Utilities.base64Encode(blob.getBytes()),
      mimeType: blob.getContentType() || meta.mimeType || 'application/pdf',
      name: meta.name || '',
      size: sizeBytes,
    };
  } catch (e) {
    Logger.log('getFileBytes_ error: ' + e.message + ' fileId=' + fileId);
    return { base64: null, error: 'exception' };
  }
}

function makePdfSvgPlaceholder_(name) {
  var safe = String(name || 'PDF')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .substring(0, 60);
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">' +
    '<rect width="320" height="180" fill="#f1f5f9"/>' +
    '<text x="160" y="80" text-anchor="middle" font-family="sans-serif" font-size="42" fill="#94a3b8">PDF</text>' +
    '<text x="160" y="130" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#475569">' + safe + '</text>' +
    '</svg>';
  return 'data:image/svg+xml;base64,' + Utilities.base64Encode(Utilities.newBlob(svg, 'image/svg+xml').getBytes());
}
