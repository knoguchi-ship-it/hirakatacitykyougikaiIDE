import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const filePath = resolve('backend/Code.gs');
const content = readFileSync(filePath, 'utf8');

const jsdocStart = content.indexOf('/**\n * PDF名簿出力: 選択会員のPDFをZIPで生成してDriveに保存し');
const nextFuncStart = content.indexOf('\nfunction resolveRosterTemplatePrefix_');

if (jsdocStart === -1 || nextFuncStart === -1) {
  console.error('Markers not found:', { jsdocStart, nextFuncStart });
  process.exit(1);
}

const newBlock = `/**
 * PDF名簿出力 v205: 1000件対応アーキテクチャ
 *
 * フロントエンドが CHUNK_SIZE=250 件ずつ分割し、順次 processRosterChunk_ を呼ぶ。
 * 各チャンク内で PARALLEL_BATCH=15 本の temp SS + UrlFetchApp.fetchAll() で並列 PDF 取得。
 * 失敗分は最大 MAX_RETRY=2 回リトライ。全成功のみ部分 ZIP を Drive 一時フォルダへ保存。
 * 全チャンク完了後に finalizeRosterExport_ で部分 ZIP を統合して最終 ZIP を生成。
 * all-or-nothing: いずれかのチャンクで失敗が残った場合は ZIP を出力しない。
 *
 * GAS 6分制限 vs 件数試算:
 *   250件/チャンク、PARALLEL_BATCH=15 → ceil(250/15)=17バッチ x ~10s ≈ 3分 (余裕あり)
 *   1000件 = 4チャンク x ~3分 ≈ 計12分（GASは1回あたり6分以内に収まる）
 *   finalizeRosterExport_ (unzip+rezip) ≈ 30秒
 *
 * 注意: 会員データなし（memberMap に存在しない ID）は恒久失敗として扱いリトライしない。
 */

/**
 * v205: PDF 出力ジョブ初期化。Drive に一時フォルダを作成して folderId を返す。
 */
function initRosterExport_(payload) {
  var folder = DriveApp.createFolder(
    '_ROSTER_JOB_' + Utilities.getUuid().substring(0, 12)
  );
  return { folderId: folder.getId() };
}

/**
 * v205: チャンク単位の PDF 生成（all-or-nothing + リトライ）。
 *
 * - 内部で最大 MAX_RETRY 回リトライ（transient HTTP エラー対策）。
 * - 全成功: chunk_{chunkIndex}.zip を folderId フォルダに保存 → { ok: true, count }
 * - 失敗残存: { ok: false, errors[] } (ZIP 保存なし。フロント側が cleanupRosterExport_ を呼ぶ)
 *
 * payload: { folderId, chunkIndex, memberIds[], year }
 */
function processRosterChunk_(payload) {
  var p          = payload || {};
  var folderId   = String(p.folderId   || '');
  var chunkIndex = Number(p.chunkIndex || 0);
  var memberIds  = p.memberIds         || [];
  var year       = Number(p.year       || 0);
  var MAX_RETRY  = 2;
  var PARALLEL_BATCH = 15;

  if (!folderId)         throw new Error('folderId が指定されていません。');
  if (!memberIds.length) return { ok: true, count: 0 };

  var now = new Date();
  var currentFY = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  if (!year || !isFinite(year)) year = currentFY;

  var dbSs = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var templateId = String(getSystemSettingValue_(dbSs, 'ROSTER_TEMPLATE_SS_ID') || '').trim();
  if (!templateId) {
    throw new Error('名簿テンプレートSSが未設定です。システム設定 > ROSTER_TEMPLATE_SS_ID を登録してください。');
  }
  var templateFile;
  try { templateFile = DriveApp.getFileById(templateId); }
  catch (e) { throw new Error('テンプレートSSの取得に失敗しました: ' + e.message); }

  var memberSheet = dbSs.getSheetByName('T_会員');
  var staffSheet  = dbSs.getSheetByName('T_事業所職員');
  var feeSheet    = dbSs.getSheetByName('T_年会費納入履歴');

  var memberMap = {};
  getSheetData_(memberSheet).forEach(function(m) {
    memberMap[String(m['会員ID'] || '')] = m;
  });
  var staffByMember = {};
  (staffSheet ? getSheetData_(staffSheet) : []).forEach(function(s) {
    if (toBoolean_(s['削除フラグ'])) return;
    var mid = String(s['会員ID'] || '');
    if (!staffByMember[mid]) staffByMember[mid] = [];
    staffByMember[mid].push(s);
  });
  var feeMap = {};
  (feeSheet ? getSheetData_(feeSheet) : []).forEach(function(r) {
    if (toBoolean_(r['削除フラグ'])) return;
    if (Number(r['対象年度'] || 0) !== year) return;
    var mid = String(r['会員ID'] || '');
    if (mid) feeMap[mid] = String(r['会費納入状態コード'] || 'UNPAID');
  });

  var remainingIds = memberIds.slice();
  var allBlobs     = [];
  var finalErrors  = [];

  for (var attempt = 0; attempt <= MAX_RETRY; attempt++) {
    if (remainingIds.length === 0) break;
    if (attempt > 0) Utilities.sleep(2000);
    var result = generatePdfsForIds_(
      remainingIds, templateFile, memberMap, staffByMember, feeMap, year, PARALLEL_BATCH
    );
    allBlobs     = allBlobs.concat(result.blobs);
    remainingIds = result.failedIds;
    finalErrors  = result.errors;
  }

  if (remainingIds.length > 0) {
    return { ok: false, errors: finalErrors };
  }

  var zipBlob = Utilities.zip(allBlobs, 'chunk_' + chunkIndex + '.zip');
  DriveApp.getFolderById(folderId).createFile(zipBlob);
  return { ok: true, count: allBlobs.length };
}

/**
 * v205: 全チャンクの部分 ZIP を統合して最終 ZIP を生成。
 * payload: { folderId, year }
 */
function finalizeRosterExport_(payload) {
  var p        = payload || {};
  var folderId = String(p.folderId || '');
  var year     = Number(p.year    || 0);

  if (!folderId) throw new Error('folderId が指定されていません。');

  var folder = DriveApp.getFolderById(folderId);
  var files  = folder.getFiles();

  var allBlobs = [];
  while (files.hasNext()) {
    var file = files.next();
    try {
      var unzipped = Utilities.unzip(file.getBlob());
      unzipped.forEach(function(b) { allBlobs.push(b); });
    } catch (e) {
      Logger.log('finalizeRosterExport_: unzip 失敗: ' + file.getName() + ': ' + e.message);
    }
  }

  if (allBlobs.length === 0) {
    throw new Error('統合する PDF がありません。チャンク処理が完了していない可能性があります。');
  }

  var now = new Date();
  var currentFY = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  if (!year || !isFinite(year)) year = currentFY;

  var zipName = '名簿_' + year + '年度_' + allBlobs.length + '件.zip';
  var zipBlob = Utilities.zip(allBlobs, zipName);
  var zipFile = DriveApp.createFile(zipBlob);
  var downloadUrl = 'https://drive.google.com/uc?export=download&id=' + zipFile.getId();

  try { folder.setTrashed(true); } catch (ce) {
    Logger.log('finalizeRosterExport_: temp folder 削除失敗: ' + ce.message);
  }

  return {
    downloadUrl: downloadUrl,
    fileId:      zipFile.getId(),
    zipName:     zipName,
    count:       allBlobs.length,
  };
}

/**
 * v205: エラー・中断時の一時フォルダクリーンアップ。
 * payload: { folderId }
 */
function cleanupRosterExport_(payload) {
  var folderId = String((payload || {}).folderId || '');
  if (!folderId) return { ok: true };
  try { DriveApp.getFolderById(folderId).setTrashed(true); }
  catch (e) { Logger.log('cleanupRosterExport_: ' + e.message); }
  return { ok: true };
}

/**
 * v205: PDF 生成コアヘルパー（processRosterChunk_ から呼ばれる）。
 * memberIds を会員種別でソートし、parallelBatch 本の temp SS + UrlFetchApp.fetchAll() で並列 PDF 取得。
 * returns { blobs: Blob[], failedIds: string[], errors: string[] }
 *
 * failedIds: HTTP エラー会員 ID のみ（リトライ対象）。
 *            会員データなしは errors のみ（リトライ不要なので failedIds に入れない）。
 */
function generatePdfsForIds_(memberIds, templateFile, memberMap, staffByMember, feeMap, year, parallelBatch) {
  var MEMBER_HEADERS = [
    '会員番号', '会員種別', '姓', '名', 'フリガナ姓', 'フリガナ名',
    '勤務先名', '事業所番号', '勤務先郵便番号', '勤務先都道府県', '勤務先市区町村', '勤務先住所',
    '勤務先電話', '勤務先FAX', '自宅郵便番号', '自宅都道府県', '自宅市区町村', '自宅住所',
    'メールアドレス', '入会日', '年会費状態', '年会費年度', '介護支援専門員番号',
  ];
  var STAFF_HEADERS = [
    '職員番号', '職員権限', '姓', '名', 'フリガナ姓', 'フリガナ名',
    'メールアドレス', '入会日', '職員状態',
  ];
  var roleOrder = { REPRESENTATIVE: 0, ADMIN: 1, STAFF: 2 };

  var memberTypeOf = {};
  memberIds.forEach(function(id) {
    var m = memberMap[String(id)];
    memberTypeOf[String(id)] = m ? String(m['会員種別コード'] || '') : '';
  });
  var sortedIds = memberIds.slice().sort(function(a, b) {
    var ta = memberTypeOf[String(a)] || '';
    var tb = memberTypeOf[String(b)] || '';
    return ta < tb ? -1 : ta > tb ? 1 : 0;
  });

  var actualBatch  = Math.min(parallelBatch, sortedIds.length);
  var tempContexts = [];
  for (var ti = 0; ti < actualBatch; ti++) {
    try {
      var tmpFile = templateFile.makeCopy(
        '_ROSTER_TMP_' + Utilities.getUuid().substring(0, 8) + '_' + ti
      );
      var tmpSs = SpreadsheetApp.openById(tmpFile.getId());

      if (ti === 0) {
        var visibleSheets = tmpSs.getSheets().filter(function(s) {
          return !s.isSheetHidden() && !isTemplateInternalSheet_(s.getName());
        });
        if (visibleSheets.length === 0) {
          try { DriveApp.getFileById(tmpFile.getId()).setTrashed(true); } catch (ce) {}
          throw new Error(
            'テンプレートSSに表示用シートがありません。' +
            '「P_」または「B_」で始まるシートを1枚以上追加してください。'
          );
        }
      }

      var tmpDataSheet = ensureRosterTemplateDataSheet_(tmpSs);
      tmpDataSheet.hideSheet();
      tempContexts.push({
        ss:        tmpSs,
        dataSheet: tmpDataSheet,
        fileId:    tmpFile.getId(),
        lastType:  null,
      });
    } catch (e) {
      if (ti === 0) throw e;
      Logger.log('generatePdfsForIds_: temp SS ' + ti + ' 作成失敗: ' + e.message);
    }
  }

  if (tempContexts.length === 0) {
    throw new Error('テンプレートSSのコピーに失敗しました。Drive の容量・権限・ID を確認してください。');
  }
  actualBatch = tempContexts.length;

  var oauthToken = ScriptApp.getOAuthToken();
  var blobs     = [];
  var failedIds = [];
  var errors    = [];

  for (var batchStart = 0; batchStart < sortedIds.length; batchStart += actualBatch) {
    var batchIds  = sortedIds.slice(batchStart, batchStart + actualBatch);
    var requests  = [];
    var batchMeta = [];

    for (var j = 0; j < batchIds.length; j++) {
      var ctx      = tempContexts[j];
      var memberId = String(batchIds[j]);
      var member   = memberMap[memberId];

      if (!member) {
        errors.push(memberId + ': 会員データなし');
        continue;
      }

      var mtype = String(member['会員種別コード'] || '');
      var enrolledStaff = [];
      if (mtype === 'BUSINESS') {
        enrolledStaff = (staffByMember[memberId] || []).filter(function(s) {
          return String(s['職員状態コード'] || '') === 'ENROLLED';
        });
        enrolledStaff.sort(function(a, b) {
          return (roleOrder[a['職員権限コード']] || 9) - (roleOrder[b['職員権限コード']] || 9);
        });
      }

      var dataSheet = ctx.dataSheet;
      dataSheet.clearContents();
      dataSheet.getRange(1, 1, 1, MEMBER_HEADERS.length).setValues([MEMBER_HEADERS]);
      dataSheet.getRange(2, 1, 1, MEMBER_HEADERS.length).setValues([[
        memberId, mtype,
        String(member['姓'] || ''), String(member['名'] || ''),
        String(member['セイ'] || ''), String(member['メイ'] || ''),
        String(member['勤務先名'] || ''), String(member['事業所番号'] || ''),
        String(member['勤務先郵便番号'] || ''), String(member['勤務先都道府県'] || ''),
        String(member['勤務先市区町村'] || ''), String(member['勤務先住所'] || ''),
        String(member['勤務先電話番号'] || ''), String(member['勤務先FAX番号'] || ''),
        String(member['自宅郵便番号'] || ''), String(member['自宅都道府県'] || ''),
        String(member['自宅市区町村'] || ''), String(member['自宅住所'] || ''),
        String(member['代表メールアドレス'] || ''), String(member['入会日'] || ''),
        feeMap[memberId] || 'NONE', year,
        String(member['介護支援専門員番号'] || ''),
      ]]);
      if (enrolledStaff.length > 0) {
        dataSheet.getRange(4, 1, 1, STAFF_HEADERS.length).setValues([STAFF_HEADERS]);
        dataSheet.getRange(5, 1, enrolledStaff.length, STAFF_HEADERS.length)
          .setValues(enrolledStaff.map(function(s) {
            return [
              String(s['職員ID'] || ''), String(s['職員権限コード'] || ''),
              String(s['姓'] || ''), String(s['名'] || ''),
              String(s['セイ'] || ''), String(s['メイ'] || ''),
              String(s['メールアドレス'] || ''), String(s['入会日'] || ''),
              String(s['職員状態コード'] || ''),
            ];
          }));
      }

      if (ctx.lastType !== mtype) {
        selectRosterDisplaySheetsV2_(ctx.ss, mtype);
        ctx.lastType = mtype;
      }

      requests.push({
        url: 'https://docs.google.com/spreadsheets/d/' + ctx.fileId +
          '/export?format=pdf&size=a4&portrait=true&fitw=true' +
          '&sheetnames=false&printtitle=false&pagenumbers=false&gridlines=false&fzr=false',
        headers: { Authorization: 'Bearer ' + oauthToken },
        muteHttpExceptions: true,
      });
      batchMeta.push({ memberId: memberId, member: member, ctxIndex: j });
    }

    if (requests.length === 0) continue;

    SpreadsheetApp.flush();

    for (var k = 0; k < batchMeta.length; k++) {
      var ctx = tempContexts[batchMeta[k].ctxIndex];
      var dispSheets = ctx.ss.getSheets().filter(function(s) { return !s.isSheetHidden(); });
      if (dispSheets.length > 0 && dispSheets[0].getLastRow() > 0 && dispSheets[0].getLastColumn() > 0) {
        dispSheets[0].getRange(1, 1).getValue();
      }
    }

    var responses = UrlFetchApp.fetchAll(requests);

    for (var k = 0; k < responses.length; k++) {
      var meta     = batchMeta[k];
      var response = responses[k];
      if (response.getResponseCode() === 200) {
        var lastName   = String(meta.member['姓'] || '').trim();
        var firstName  = String(meta.member['名'] || '').trim();
        var officeName = String(meta.member['勤務先名'] || '').trim().substring(0, 20);
        var pdfName    = meta.memberId + '_' + (lastName + firstName || officeName || '名前なし') + '.pdf';
        blobs.push(response.getBlob().setName(pdfName));
      } else {
        failedIds.push(meta.memberId);
        errors.push(
          String(meta.member['姓'] || '') + String(meta.member['名'] || '') +
          '（' + meta.memberId + '）: HTTP ' + response.getResponseCode()
        );
      }
    }
  }

  tempContexts.forEach(function(ctx) {
    try { DriveApp.getFileById(ctx.fileId).setTrashed(true); } catch (ce) {
      Logger.log('generatePdfsForIds_: cleanup 失敗: ' + ce.message);
    }
  });

  return { blobs: blobs, failedIds: failedIds, errors: errors };
}`;

const before = content.slice(0, jsdocStart);
const after  = content.slice(nextFuncStart);
const newContent = before + newBlock + after;
writeFileSync(filePath, newContent, 'utf8');
console.log('Done. Length:', newContent.length);
