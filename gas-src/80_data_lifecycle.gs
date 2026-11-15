// gas-src/80_data_lifecycle.gs — 削除・アーカイブ・ログのスプレッドシート。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

function addDeleteLogSheet() {
  return addDeleteLogSheet_();
}

function addDeleteLogSheet_() {
  var ss = getOrCreateDatabase_();
  var sheetName = 'T_削除ログ';
  if (!ss.getSheetByName(sheetName)) {
    var sheet = ss.insertSheet(sheetName);
    var cols = テーブル定義[sheetName];
    sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
    sheet.setFrozenRows(1);
  }
  return { status: 'ok', sheet: sheetName };
}

function getDeleteMemberDisplayName_(memberRow) {
  var memberType = String(memberRow['会員種別コード'] || '');
  var fullName = joinHumanNameParts_(memberRow['姓'], memberRow['名']).trim();
  var officeName = String(memberRow['勤務先名'] || '').trim();
  if (memberType === 'BUSINESS') return officeName || fullName || '（事業所名なし）';
  return fullName || officeName || '（名前なし）';
}

function getDeleteStaffDisplayName_(staffRow, memberRow) {
  var officeName = memberRow ? getDeleteMemberDisplayName_(memberRow) : '（事業所不明）';
  var fullName = joinHumanNameParts_(staffRow['姓'], staffRow['名']).trim();
  return officeName + ' / ' + (fullName || '（職員名なし）');
}

function parseDeleteTargetKey_(rawValue) {
  var raw = String(rawValue || '').trim();
  if (!raw) return null;
  var matched = raw.match(/^(member|staff):(.+)$/);
  if (!matched) return null;
  return {
    targetKey: matched[1] + ':' + matched[2],
    targetKind: matched[1] === 'staff' ? 'STAFF' : 'MEMBER',
    id: matched[2],
  };
}

function normalizeDeleteTargetKeys_(payload) {
  var rawKeys = Array.isArray(payload && payload.targetKeys)
    ? payload.targetKeys
    : Array.isArray(payload && payload.memberIds)
      ? payload.memberIds.map(function(memberId) { return 'member:' + String(memberId || '').trim(); })
      : [];
  var seen = {};
  var keys = [];
  for (var i = 0; i < rawKeys.length; i++) {
    var parsed = parseDeleteTargetKey_(rawKeys[i]);
    if (!parsed || seen[parsed.targetKey]) continue;
    seen[parsed.targetKey] = true;
    keys.push(parsed.targetKey);
  }
  if (keys.length === 0) throw new Error('targetKeys が空です。');
  if (keys.length > 10) throw new Error('一度に処理できるのは最大10件です。');
  return keys;
}

function buildDeleteCatalog_(ss) {
  var members = getRowsAsObjects_(ss, 'T_会員');
  var staffs = getRowsAsObjects_(ss, 'T_事業所職員');
  var auths = getRowsAsObjects_(ss, 'T_認証アカウント');
  var memberById = {};
  var staffById = {};
  var staffsByMemberId = {};
  var memberLoginIdById = {};
  var staffLoginIdById = {};

  for (var i = 0; i < members.length; i++) {
    memberById[String(members[i]['会員ID'] || '')] = members[i];
  }
  for (var j = 0; j < staffs.length; j++) {
    var staffId = String(staffs[j]['職員ID'] || '');
    var memberId = String(staffs[j]['会員ID'] || '');
    staffById[staffId] = staffs[j];
    if (!staffsByMemberId[memberId]) staffsByMemberId[memberId] = [];
    staffsByMemberId[memberId].push(staffs[j]);
  }
  for (var k = 0; k < auths.length; k++) {
    var auth = auths[k];
    var authMemberId = String(auth['会員ID'] || '');
    var authStaffId = String(auth['職員ID'] || '');
    var loginId = String(auth['ログインID'] || '');
    if (authStaffId && !staffLoginIdById[authStaffId]) staffLoginIdById[authStaffId] = loginId;
    if (authMemberId && !memberLoginIdById[authMemberId] && !authStaffId) memberLoginIdById[authMemberId] = loginId;
  }

  return {
    members: members,
    staffs: staffs,
    auths: auths,
    memberById: memberById,
    staffById: staffById,
    staffsByMemberId: staffsByMemberId,
    memberLoginIdById: memberLoginIdById,
    staffLoginIdById: staffLoginIdById,
  };
}

function shouldArchiveMemberRow_(row) {
  return String(row['会員状態コード'] || 'ACTIVE') !== 'WITHDRAWN' || !toBoolean_(row['削除フラグ']);
}

function shouldArchiveStaffRow_(row) {
  return String(row['職員状態コード'] || 'ENROLLED') !== 'LEFT' || !toBoolean_(row['削除フラグ']);
}

function shouldArchiveAuthRow_(row) {
  return toBoolean_(row['アカウント有効フラグ']) || !toBoolean_(row['削除フラグ']);
}

function shouldArchiveWhitelistRow_(row) {
  return toBoolean_(row['有効フラグ']) || !toBoolean_(row['削除フラグ']);
}

function buildLogicalDeletePlan_(ss, targetKeys) {
  var catalog = buildDeleteCatalog_(ss);
  var parsedTargets = [];
  var memberIdSet = {};
  var staffIdSet = {};
  var seenTargetKey = {};

  for (var i = 0; i < targetKeys.length; i++) {
    var parsed = parseDeleteTargetKey_(targetKeys[i]);
    if (!parsed || seenTargetKey[parsed.targetKey]) continue;
    seenTargetKey[parsed.targetKey] = true;

    if (parsed.targetKind === 'MEMBER') {
      var memberRow = catalog.memberById[parsed.id];
      if (!memberRow) throw new Error('対象会員が見つかりません: ' + parsed.id);
      memberIdSet[parsed.id] = true;
      parsedTargets.push({
        targetKey: parsed.targetKey,
        targetKind: 'MEMBER',
        memberId: parsed.id,
        displayName: getDeleteMemberDisplayName_(memberRow),
        memberType: String(memberRow['会員種別コード'] || ''),
        memberStatus: String(memberRow['会員状態コード'] || ''),
        loginId: catalog.memberLoginIdById[parsed.id] || '',
        isDeleted: toBoolean_(memberRow['削除フラグ']),
      });
    } else {
      var staffRow = catalog.staffById[parsed.id];
      if (!staffRow) throw new Error('対象職員が見つかりません: ' + parsed.id);
      if (String(staffRow['職員権限コード'] || '') === 'REPRESENTATIVE') {
        throw new Error('代表者職員は単体では論理削除できません。先に事業所会員全体を対象にしてください。');
      }
      var parentMemberId = String(staffRow['会員ID'] || '');
      var parentMemberRow = catalog.memberById[parentMemberId] || null;
      staffIdSet[parsed.id] = true;
      parsedTargets.push({
        targetKey: parsed.targetKey,
        targetKind: 'STAFF',
        memberId: parentMemberId,
        staffId: parsed.id,
        displayName: getDeleteStaffDisplayName_(staffRow, parentMemberRow),
        memberType: parentMemberRow ? String(parentMemberRow['会員種別コード'] || 'BUSINESS') : 'BUSINESS',
        memberStatus: parentMemberRow ? String(parentMemberRow['会員状態コード'] || '') : '',
        staffRole: String(staffRow['職員権限コード'] || ''),
        staffStatus: String(staffRow['職員状態コード'] || ''),
        loginId: catalog.staffLoginIdById[parsed.id] || '',
        isDeleted: toBoolean_(staffRow['削除フラグ']),
      });
    }
  }

  var memberIds = Object.keys(memberIdSet);
  for (var j = 0; j < memberIds.length; j++) {
    var memberId = memberIds[j];
    var memberRowForChildren = catalog.memberById[memberId];
    if (memberRowForChildren && String(memberRowForChildren['会員種別コード'] || '') === 'BUSINESS') {
      var childStaffRows = catalog.staffsByMemberId[memberId] || [];
      for (var c = 0; c < childStaffRows.length; c++) {
        var childStaffId = String(childStaffRows[c]['職員ID'] || '');
        if (childStaffId) staffIdSet[childStaffId] = true;
      }
    }
  }

  var staffIds = Object.keys(staffIdSet);
  var affectedAuthIdSet = {};
  var counts = {
    'T_会員': 0,
    'T_事業所職員': 0,
    'T_認証アカウント': 0,
    'T_管理者Googleホワイトリスト': 0,
  };
  var retainedCounts = {
    'T_ログイン履歴': 0,
    'T_年会費納入履歴': 0,
    'T_年会費更新履歴': 0,
    'T_研修申込': 0,
  };

  for (var m = 0; m < memberIds.length; m++) {
    var memberRowForCount = catalog.memberById[memberIds[m]];
    if (memberRowForCount && shouldArchiveMemberRow_(memberRowForCount)) counts['T_会員']++;
  }
  for (var s = 0; s < staffIds.length; s++) {
    var staffRowForCount = catalog.staffById[staffIds[s]];
    if (staffRowForCount && shouldArchiveStaffRow_(staffRowForCount)) counts['T_事業所職員']++;
  }

  var whitelistRows = getRowsAsObjects_(ss, 'T_管理者Googleホワイトリスト');
  for (var w = 0; w < whitelistRows.length; w++) {
    var whitelistMemberId = String(whitelistRows[w]['紐付け会員ID'] || '');
    if (memberIdSet[whitelistMemberId] && shouldArchiveWhitelistRow_(whitelistRows[w])) {
      counts['T_管理者Googleホワイトリスト']++;
    }
  }

  for (var a = 0; a < catalog.auths.length; a++) {
    var authRow = catalog.auths[a];
    var authMemberId = String(authRow['会員ID'] || '');
    var authStaffId = String(authRow['職員ID'] || '');
    var authId = String(authRow['認証ID'] || '');
    if (memberIdSet[authMemberId] || (authStaffId && staffIdSet[authStaffId])) {
      if (authId) affectedAuthIdSet[authId] = true;
      if (shouldArchiveAuthRow_(authRow)) counts['T_認証アカウント']++;
    }
  }

  var loginRows = getRowsAsObjects_(getLogSs_(), 'T_ログイン履歴'); // v259: ログSS
  var feeRows = getRowsAsObjects_(ss, 'T_年会費納入履歴');
  var feeUpdateRows = getRowsAsObjects_(ss, 'T_年会費更新履歴');
  var trainingRows = getRowsAsObjects_(ss, 'T_研修申込');
  var affectedAuthIds = Object.keys(affectedAuthIdSet);

  retainedCounts['T_ログイン履歴'] = loginRows.filter(function(row) {
    return affectedAuthIds.indexOf(String(row['認証ID'] || '')) !== -1;
  }).length;
  retainedCounts['T_年会費納入履歴'] = feeRows.filter(function(row) {
    return memberIdSet[String(row['会員ID'] || '')];
  }).length;
  retainedCounts['T_年会費更新履歴'] = feeUpdateRows.filter(function(row) {
    return memberIdSet[String(row['会員ID'] || '')];
  }).length;
  retainedCounts['T_研修申込'] = trainingRows.filter(function(row) {
    return memberIdSet[String(row['会員ID'] || '')] ||
      memberIdSet[String(row['申込者ID'] || '')] ||
      staffIdSet[String(row['職員ID'] || '')];
  }).length;

  // 2026-10-13: 役員・振込口座・支払い・請求・変更申請も、削除の実行時に一緒にアーカイブへ移る
  // （getCascadeMatchers_）。以前は確認画面に出ておらず、未払いの請求や処理待ちの申請が一緒に消えた。
  // 実行時と同じ照合関数で数える。
  var relatedTables = ['T_役員', 'T_振込口座', 'T_支払い', 'T_支払い明細', 'T_請求', 'T_変更申請'];
  var paymentIdSetForPreview = {};
  getRowsAsObjects_(ss, 'T_支払い').forEach(function(row) {
    if (memberIdSet[String(row['会員ID'] || '')] || staffIdSet[String(row['職員ID'] || '')]) paymentIdSetForPreview[String(row['支払いID'] || '')] = true;
  });
  var unpaidClaimCount = 0;
  var pendingChangeRequestCount = 0;
  getCascadeMatchers_(memberIdSet, staffIdSet, paymentIdSetForPreview).forEach(function(pair) {
    var tableName = pair[0];
    if (relatedTables.indexOf(tableName) === -1) return;
    var hits = getRowsAsObjects_(ss, tableName).filter(pair[1]);
    retainedCounts[tableName] = hits.length;
    if (tableName === 'T_請求') {
      unpaidClaimCount = hits.filter(function(r) {
        var st = String(r['請求状態'] || '');
        return !toBoolean_(r['削除フラグ']) && (st === '申請中' || st === '承認済み');
      }).length;
    }
    if (tableName === 'T_変更申請') {
      pendingChangeRequestCount = hits.filter(function(r) { return String(r['申請状態コード'] || '') === 'PENDING'; }).length;
    }
  });

  var totalUpdatedRows = 0;
  Object.keys(counts).forEach(function(tableName) {
    totalUpdatedRows += counts[tableName] || 0;
  });
  var totalRows = totalUpdatedRows;
  Object.keys(retainedCounts).forEach(function(tableName) {
    totalRows += retainedCounts[tableName] || 0;
  });

  return {
    targetKeys: targetKeys,
    targets: parsedTargets,
    memberIds: memberIds,
    staffIds: staffIds,
    authIds: affectedAuthIds,
    counts: counts,
    retainedCounts: retainedCounts,
    totalUpdatedRows: totalUpdatedRows,
    totalRows: totalRows,
    unpaidClaimCount: unpaidClaimCount,
    pendingChangeRequestCount: pendingChangeRequestCount,
  };
}

// ══ v376.52: 会員系削除 cascade アーカイブ（docs/249・a1 単一化）═══════════════
// 削除対象の会員/職員に紐づく行を live から除去し <table>_archive へ「移動」する。
// - 退避行にはサロゲート3列（アーカイブID/削除バッチID/アーカイブ日時）を付与
// - 削除バッチID = T_削除ログ.ログID。復元は同一バッチの全行を戻す（会員単位アトミック）
// - T_ログイン履歴 は archive せず物理 purge（高volume・PII 最小化）
// - 退会フロー（withdrawMember 系）はこの cascade を呼ばない（履歴保持・docs/249 §4.4）

// テーブル → 「live 行が削除対象会員系に属するか」の一致条件（cascade と診断の共通定義）
function getCascadeMatchers_(memberIdSet, staffIdSet, paymentIdSet) {
  function byMember(col) {
    return function(row) { return !!memberIdSet[String(row[col] || '')]; };
  }
  function byMemberOrStaff(mCol, sCol) {
    return function(row) {
      return !!memberIdSet[String(row[mCol] || '')] || !!staffIdSet[String(row[sCol] || '')];
    };
  }
  // 子 → 親の順（支払い明細は支払いより先）。ID 集合は事前解決済みだが安全側の明示順。
  return [
    ['T_研修申込', function(row) {
      return !!memberIdSet[String(row['会員ID'] || '')] ||
        !!staffIdSet[String(row['職員ID'] || '')] ||
        !!memberIdSet[String(row['申込者ID'] || '')];
    }],
    ['T_年会費納入履歴', byMember('会員ID')],
    ['T_年会費更新履歴', byMember('会員ID')],
    ['T_役員', byMemberOrStaff('会員ID', '職員ID')],
    ['T_振込口座', byMemberOrStaff('会員ID', '職員ID')],
    ['T_支払い明細', function(row) { return !!paymentIdSet[String(row['支払いID'] || '')]; }],
    ['T_支払い', byMemberOrStaff('会員ID', '職員ID')], // 2026-10-25: 職員の役員への支払いも
    ['T_請求', byMemberOrStaff('会員ID', '職員ID')],
    ['T_変更申請', byMember('会員ID')],
    ['T_管理者Googleホワイトリスト', byMember('紐付け会員ID')],
    ['T_認証アカウント', byMemberOrStaff('会員ID', '職員ID')],
    ['T_事業所職員', byMemberOrStaff('会員ID', '職員ID')],
    ['T_会員', byMember('会員ID')],
  ];
}

// シートから matchFn に一致する行を取り除き、取り除いた行（オブジェクト）を返す。
// beforeRemove(taken) は行を取り除く前に呼ぶ（アーカイブへの書き込みなど。失敗すれば何も消さない）。
// 残す行を詰め直したあと、空いた末尾の行はシートから削除する。中身だけ消すと空行が残り、
// シートの容量が減らない（2026-10-11 まではそうだった）。
function takeRowsByMatch_(sheet, matchFn, beforeRemove) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
  var keepRows = [];
  var taken = [];
  for (var r = 0; r < data.length; r++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) obj[headers[c]] = data[r][c];
    if (matchFn(obj)) taken.push(obj);
    else keepRows.push(data[r]);
  }
  if (taken.length === 0) return [];
  if (beforeRemove) beforeRemove(taken);
  sheet.getRange(2, 1, data.length, lastCol).clearContent();
  if (keepRows.length > 0) sheet.getRange(2, 1, keepRows.length, lastCol).setValues(keepRows);
  // 固定行（見出し）だけが残る形にはできないので、そのときは 1 行だけ空行を残す。
  var deletable = taken.length;
  if (sheet.getMaxRows() - deletable <= sheet.getFrozenRows()) deletable -= 1;
  if (deletable > 0) sheet.deleteRows(keepRows.length + 2, deletable);
  return taken;
}

// 共通ムーバ: matchFn に一致する行を live から除去し <table>_archive へ append する。
// archive シートのヘッダー欠落（列数0）は自己修復する。戻り値は移動件数。
function moveRowsToArchiveByMatch_(ss, tableName, matchFn, batchId, nowIso) {
  var srcSheet = ss.getSheetByName(tableName);
  if (!srcSheet || srcSheet.getLastRow() < 2) return 0;
  var dstName = tableName + '_archive';
  var dstSheet = ss.getSheetByName(dstName);
  if (!dstSheet) dstSheet = ss.insertSheet(dstName);
  if (dstSheet.getLastColumn() < 1) writeSheetHeaders_(dstSheet, テーブル定義[dstName]);
  var moved = takeRowsByMatch_(srcSheet, matchFn, function(taken) {
    for (var i = 0; i < taken.length; i++) {
      taken[i]['アーカイブID'] = Utilities.getUuid();
      taken[i]['削除バッチID'] = batchId;
      taken[i]['アーカイブ日時'] = nowIso;
    }
    appendRowsByHeaders_(ss, dstName, taken);
  });
  return moved.length;
}

// 削除対象認証IDのログイン履歴を log スプレッドシートから物理削除する（docs/249: purge 確定）
function purgeLoginHistoryByAuthIds_(authIdSet) {
  if (Object.keys(authIdSet || {}).length === 0) return 0;
  var sheet = getLogSs_().getSheetByName('T_ログイン履歴');
  return takeRowsByMatch_(sheet, function(row) { return !!authIdSet[String(row['認証ID'] || '')]; }).length;
}

// cascade オーケストレータ: 支払いID/認証ID を移動前に解決 → 13テーブル移動 → ログイン履歴 purge
function runDeleteCascade_(ss, memberIdSet, staffIdSet, batchId, nowIso) {
  var paymentIdSet = {};
  var payRows = getRowsAsObjects_(ss, 'T_支払い');
  for (var p = 0; p < payRows.length; p++) {
    if (memberIdSet[String(payRows[p]['会員ID'] || '')] || staffIdSet[String(payRows[p]['職員ID'] || '')]) {
      var payId = String(payRows[p]['支払いID'] || '');
      if (payId) paymentIdSet[payId] = true;
    }
  }
  var authIdSet = {};
  var authRows = getRowsAsObjects_(ss, 'T_認証アカウント');
  for (var a = 0; a < authRows.length; a++) {
    var authRow = authRows[a];
    if (memberIdSet[String(authRow['会員ID'] || '')] || staffIdSet[String(authRow['職員ID'] || '')]) {
      var authIdVal = String(authRow['認証ID'] || '');
      if (authIdVal) authIdSet[authIdVal] = true;
    }
  }

  var matchers = getCascadeMatchers_(memberIdSet, staffIdSet, paymentIdSet);
  var moved = {};
  for (var i = 0; i < matchers.length; i++) {
    moved[matchers[i][0]] = moveRowsToArchiveByMatch_(ss, matchers[i][0], matchers[i][1], batchId, nowIso);
  }
  var purgedLoginHistory = purgeLoginHistoryByAuthIds_(authIdSet);
  return { batchId: batchId, moved: moved, purgedLoginHistory: purgedLoginHistory };
}

// 復元: 各 archive から 削除バッチID 一致行を live へ戻す（サロゲート3列は落とす）
function restoreArchiveBatch_(batchId) {
  var targetBatchId = String(batchId || '');
  if (!targetBatchId) throw new Error('削除バッチID が空です。');
  var ss = getOrCreateDatabase_();
  var restored = {};
  for (var i = 0; i < ARCHIVE_SOURCE_TABLES.length; i++) {
    var srcName = ARCHIVE_SOURCE_TABLES[i];
    var sheet = ss.getSheetByName(srcName + '_archive');
    restored[srcName] = 0;
    if (!sheet || sheet.getLastRow() < 2) continue;
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var batchCol = headers.indexOf('削除バッチID');
    if (batchCol < 0) continue;
    var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, lastCol).getValues();
    var keepRows = [];
    var backObjs = [];
    for (var r = 0; r < data.length; r++) {
      if (String(data[r][batchCol] || '') === targetBatchId) {
        var obj = {};
        for (var c = 0; c < headers.length; c++) obj[headers[c]] = data[r][c];
        delete obj['アーカイブID'];
        delete obj['削除バッチID'];
        delete obj['アーカイブ日時'];
        backObjs.push(obj);
      } else {
        keepRows.push(data[r]);
      }
    }
    if (backObjs.length === 0) continue;
    appendRowsByHeaders_(ss, srcName, backObjs);
    sheet.getRange(2, 1, data.length, lastCol).clearContent();
    if (keepRows.length > 0) sheet.getRange(2, 1, keepRows.length, lastCol).setValues(keepRows);
    restored[srcName] = backObjs.length;
  }
  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();
  return { batchId: targetBatchId, restored: restored };
}

// operator 実行（▶ 引数なし）: 直近の削除バッチ（T_削除ログ 最終行）を復元する
function restoreLastArchiveBatch_APPLY() {
  assertMasterOperator_('restoreLastArchiveBatch_APPLY');
  var ss = getOrCreateDatabase_();
  var logs = getRowsAsObjects_(ss, 'T_削除ログ');
  if (logs.length === 0) throw new Error('T_削除ログ が空です（復元対象なし）。');
  var lastLogId = String(logs[logs.length - 1]['ログID'] || '');
  var result = restoreArchiveBatch_(lastLogId);
  Logger.log(JSON.stringify(result, null, 2));
  return JSON.stringify(result);
}

// operator 実行（▶ 引数なし）: archive 内の削除バッチ一覧（バッチID別件数 + 削除ログ情報）
function listArchiveBatches_LOG() {
  assertMasterOperator_('listArchiveBatches_LOG');
  var ss = getOrCreateDatabase_();
  var byBatch = {};
  for (var i = 0; i < ARCHIVE_SOURCE_TABLES.length; i++) {
    var srcName = ARCHIVE_SOURCE_TABLES[i];
    var rows = getRowsAsObjects_(ss, srcName + '_archive');
    for (var r = 0; r < rows.length; r++) {
      var bid = String(rows[r]['削除バッチID'] || '(none)');
      if (!byBatch[bid]) byBatch[bid] = { total: 0, tables: {} };
      byBatch[bid].total++;
      byBatch[bid].tables[srcName] = (byBatch[bid].tables[srcName] || 0) + 1;
    }
  }
  var logs = getRowsAsObjects_(ss, 'T_削除ログ');
  for (var l = 0; l < logs.length; l++) {
    var logIdVal = String(logs[l]['ログID'] || '');
    if (byBatch[logIdVal]) {
      byBatch[logIdVal].deletedAt = String(logs[l]['操作日時'] || '');
      byBatch[logIdVal].operator = String(logs[l]['操作者メール'] || '');
      byBatch[logIdVal].targetKeys = String(logs[l]['対象会員IDリスト'] || '');
    }
  }
  var result = { batches: byBatch, generatedAt: new Date().toISOString() };
  Logger.log(JSON.stringify(result, null, 2));
  return JSON.stringify(result);
}

// operator 実行（▶ 引数なし・read-only）: 現 DB の削除負債を診断する（docs/249 §7）。
// 旧削除実装（in-place soft delete）で live に残った削除済み会員/職員と、
// それらを参照して取り残された子テーブル行（孤児候補）を計測する。非破壊。
function diagnoseMemberDeleteDebt_LOG() {
  assertMasterOperator_('diagnoseMemberDeleteDebt_LOG');
  var ss = getOrCreateDatabase_();
  var members = getRowsAsObjects_(ss, 'T_会員');
  var staffs = getRowsAsObjects_(ss, 'T_事業所職員');
  var liveMemberIds = {};
  var deletedMemberIds = {};
  for (var m = 0; m < members.length; m++) {
    var mid = String(members[m]['会員ID'] || '');
    if (!mid) continue;
    if (toBoolean_(members[m]['削除フラグ'])) deletedMemberIds[mid] = true;
    else liveMemberIds[mid] = true;
  }
  var liveStaffIds = {};
  var deletedStaffIds = {};
  for (var s = 0; s < staffs.length; s++) {
    var sid = String(staffs[s]['職員ID'] || '');
    if (!sid) continue;
    if (toBoolean_(staffs[s]['削除フラグ'])) deletedStaffIds[sid] = true;
    else liveStaffIds[sid] = true;
  }

  // 子テーブル別に「削除済み会員/職員を参照」「存在しないIDを参照」の live 行を数える
  var childRefSpecs = [
    ['T_研修申込', ['会員ID'], ['職員ID']],
    ['T_年会費納入履歴', ['会員ID'], []],
    ['T_年会費更新履歴', ['会員ID'], []],
    ['T_役員', ['会員ID'], ['職員ID']],
    ['T_振込口座', ['会員ID'], ['職員ID']],
    ['T_支払い', ['会員ID'], ['職員ID']],
    ['T_請求', ['会員ID'], ['職員ID']],
    ['T_変更申請', ['会員ID'], []],
    ['T_管理者Googleホワイトリスト', ['紐付け会員ID'], []],
    ['T_認証アカウント', ['会員ID'], ['職員ID']],
  ];
  var orphans = {};
  for (var t = 0; t < childRefSpecs.length; t++) {
    var tableName = childRefSpecs[t][0];
    var memberCols = childRefSpecs[t][1];
    var staffCols = childRefSpecs[t][2];
    var rows = getRowsAsObjects_(ss, tableName);
    var refDeleted = 0;
    var refMissing = 0;
    var liveRowCount = 0;
    for (var r2 = 0; r2 < rows.length; r2++) {
      if (toBoolean_(rows[r2]['削除フラグ'])) continue;
      liveRowCount++;
      var flaggedDeleted = false;
      var flaggedMissing = false;
      for (var mc = 0; mc < memberCols.length; mc++) {
        var refM = String(rows[r2][memberCols[mc]] || '');
        if (!refM) continue;
        if (deletedMemberIds[refM]) flaggedDeleted = true;
        else if (!liveMemberIds[refM]) flaggedMissing = true;
      }
      for (var sc = 0; sc < staffCols.length; sc++) {
        var refS = String(rows[r2][staffCols[sc]] || '');
        if (!refS) continue;
        if (deletedStaffIds[refS]) flaggedDeleted = true;
        else if (!liveStaffIds[refS]) flaggedMissing = true;
      }
      if (flaggedDeleted) refDeleted++;
      else if (flaggedMissing) refMissing++;
    }
    orphans[tableName] = { liveRows: liveRowCount, refSoftDeleted: refDeleted, refMissing: refMissing };
  }

  var report = {
    schemaVersion: DB_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    members: {
      total: members.length,
      live: Object.keys(liveMemberIds).length,
      softDeleted: Object.keys(deletedMemberIds).length,
    },
    staffs: {
      total: staffs.length,
      live: Object.keys(liveStaffIds).length,
      softDeleted: Object.keys(deletedStaffIds).length,
    },
    orphans: orphans,
    note: 'refSoftDeleted=削除済み会員/職員を参照する live 行, refMissing=存在しないIDを参照する live 行。バックフィル要否判断用（docs/249 §7）',
  };
  Logger.log(JSON.stringify(report, null, 2));
  return JSON.stringify(report);
}

function searchMembersForDelete_(payload) {
  var query = String(payload.query || '').trim();
  if (!query) throw new Error('検索クエリが空です。');

  var ss = getOrCreateDatabase_();
  var catalog = buildDeleteCatalog_(ss);
  var results = [];

  for (var i = 0; i < catalog.members.length; i++) {
    var member = catalog.members[i];
    var memberId = String(member['会員ID'] || '');
    if (!memberId) continue;
    var displayName = getDeleteMemberDisplayName_(member);
    var loginId = catalog.memberLoginIdById[memberId] || '';
    var memberSearchValues = [
      memberId,
      displayName,
      loginId,
      String(member['事業所番号'] || ''),
      String(member['代表メールアドレス'] || ''),
    ];
    if (!matchesSearchQuery_(query, memberSearchValues)) continue;
    results.push({
      targetKey: 'member:' + memberId,
      targetKind: 'MEMBER',
      memberId: memberId,
      displayName: displayName,
      memberType: String(member['会員種別コード'] || ''),
      memberStatus: String(member['会員状態コード'] || ''),
      loginId: loginId,
      isDeleted: toBoolean_(member['削除フラグ']),
    });
    if (results.length >= 20) return results;
  }

  for (var j = 0; j < catalog.staffs.length; j++) {
    var staff = catalog.staffs[j];
    if (String(staff['職員権限コード'] || '') === 'REPRESENTATIVE') continue;
    var staffId = String(staff['職員ID'] || '');
    if (!staffId) continue;
    var parentMemberId = String(staff['会員ID'] || '');
    var parentMember = catalog.memberById[parentMemberId] || null;
    var staffDisplayName = getDeleteStaffDisplayName_(staff, parentMember);
    var staffLoginId = catalog.staffLoginIdById[staffId] || '';
    var staffSearchValues = [
      staffId,
      parentMemberId,
      staffDisplayName,
      staffLoginId,
      String(staff['メールアドレス'] || ''),
      String(staff['介護支援専門員番号'] || ''),
    ];
    if (!matchesSearchQuery_(query, staffSearchValues)) continue;
    results.push({
      targetKey: 'staff:' + staffId,
      targetKind: 'STAFF',
      memberId: parentMemberId,
      staffId: staffId,
      displayName: staffDisplayName,
      memberType: parentMember ? String(parentMember['会員種別コード'] || 'BUSINESS') : 'BUSINESS',
      memberStatus: parentMember ? String(parentMember['会員状態コード'] || '') : '',
      staffRole: String(staff['職員権限コード'] || ''),
      staffStatus: String(staff['職員状態コード'] || ''),
      loginId: staffLoginId,
      isDeleted: toBoolean_(staff['削除フラグ']),
    });
    if (results.length >= 20) break;
  }

  return results;
}

function previewDeleteMember_(payload) {
  var targetKeys = normalizeDeleteTargetKeys_(payload);
  var ss = getOrCreateDatabase_();
  var plan = buildLogicalDeletePlan_(ss, targetKeys);
  return {
    targets: plan.targets,
    counts: plan.counts,
    retainedCounts: plan.retainedCounts,
    totalRows: plan.totalRows,
    totalUpdatedRows: plan.totalUpdatedRows,
    unpaidClaimCount: plan.unpaidClaimCount,
    pendingChangeRequestCount: plan.pendingChangeRequestCount,
  };
}

function executeDeleteMember_(payload) {
  var confirmText = String(payload.confirmText || '');
  if (confirmText !== '論理削除') throw new Error('確認テキストが一致しません。');

  var targetKeys = normalizeDeleteTargetKeys_(payload);
  var ss = getOrCreateDatabase_();
  var plan = buildLogicalDeletePlan_(ss, targetKeys);
  if (plan.targets.length === 0) throw new Error('対象が見つかりません。');

  var snap = {};
  function collectRows_(tableName, filterFn) {
    var rows = getRowsAsObjects_(ss, tableName);
    snap[tableName] = rows.filter(filterFn);
  }

  var memberIdSet = {};
  var staffIdSet = {};
  var authIdSet = {};
  for (var i = 0; i < plan.memberIds.length; i++) memberIdSet[String(plan.memberIds[i])] = true;
  for (var j = 0; j < plan.staffIds.length; j++) staffIdSet[String(plan.staffIds[j])] = true;
  for (var k = 0; k < plan.authIds.length; k++) authIdSet[String(plan.authIds[k])] = true;

  collectRows_('T_会員', function(row) { return memberIdSet[String(row['会員ID'] || '')]; });
  collectRows_('T_事業所職員', function(row) { return staffIdSet[String(row['職員ID'] || '')]; });
  collectRows_('T_認証アカウント', function(row) { return authIdSet[String(row['認証ID'] || '')]; });
  collectRows_('T_管理者Googleホワイトリスト', function(row) { return memberIdSet[String(row['紐付け会員ID'] || '')]; });
  collectRows_('T_ログイン履歴', function(row) { return authIdSet[String(row['認証ID'] || '')]; });
  collectRows_('T_年会費納入履歴', function(row) { return memberIdSet[String(row['会員ID'] || '')]; });
  collectRows_('T_年会費更新履歴', function(row) { return memberIdSet[String(row['会員ID'] || '')]; });
  collectRows_('T_研修申込', function(row) {
    return memberIdSet[String(row['会員ID'] || '')] ||
      memberIdSet[String(row['申込者ID'] || '')] ||
      staffIdSet[String(row['職員ID'] || '')];
  });

  if (!ss.getSheetByName('T_削除ログ')) {
    addDeleteLogSheet_();
  }

  var logId = Utilities.getUuid();
  var operatorEmail = '';
  try {
    var session = checkAdminBySession_();
    // 2026-10-13: 管理者セッションに googleEmail という項目は無い（loginId がメール）。
    // 以前は常に空になり、削除ログの操作者が記録されていなかった。
    operatorEmail = session ? String(session.loginId || '') : '';
  } catch (e) {}

  appendRowsByHeaders_(ss, 'T_削除ログ', [{
    'ログID': logId,
    '操作日時': new Date().toISOString(),
    '操作者メール': operatorEmail,
    '対象会員IDリスト': plan.targetKeys.join(','),
    '削除前スナップショットJSON': JSON.stringify(snap),
  }]);

  // v376.52 cascade アーカイブ（docs/249・a1 単一化）: 旧実装（in-place soft delete のみで
  // live に行が残り、役員/請求/振込口座/支払い/変更申請は放置＝孤児化）を廃止し、
  // 会員系13テーブルを live から除去して *_archive へ移動する。ログイン履歴は物理 purge。
  // 削除バッチID = 削除ログの logId（復元は同一バッチの全行を戻す＝会員単位アトミック）。
  var nowIso = new Date().toISOString();
  var cascade = runDeleteCascade_(ss, memberIdSet, staffIdSet, logId, nowIso);

  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();

  return {
    logId: logId,
    archivedTargetKeys: plan.targetKeys,
    affectedCounts: plan.counts,
    retainedCounts: plan.retainedCounts,
    cascade: cascade,
  };
}

function getDeleteLogs_(payload) {
  var limit = Math.min(parseInt(payload && payload.limit, 10) || 20, 100);
  var ss = getOrCreateDatabase_();
  if (!ss.getSheetByName('T_削除ログ')) return [];
  var rows = getRowsAsObjects_(ss, 'T_削除ログ');
  return rows.slice(-limit).reverse().map(function(row) {
    var snap = {};
    try { snap = JSON.parse(String(row['削除前スナップショットJSON'] || '{}')); } catch (e) {}
    var totalRows = Object.keys(snap).reduce(function(sum, tableName) {
      return sum + (Array.isArray(snap[tableName]) ? snap[tableName].length : 0);
    }, 0);
    return {
      logId: String(row['ログID'] || ''),
      operatedAt: String(row['操作日時'] || ''),
      operatorEmail: String(row['操作者メール'] || ''),
      memberIdList: String(row['対象会員IDリスト'] || ''),
      totalAffectedRows: totalRows,
    };
  });
}

// ============================================================
// v259: ログSS分離・アーカイブ関連
// ============================================================

/**
 * ログスプレッドシートをセットアップする（初回1回だけ実行）。
 * 新規スプレッドシートを作成し、Script Properties に LOG_SPREADSHEET_ID を保存。
 * その後 rebuildLogDatabaseSchema() でシートを作成してから
 * migrateLogsToLogSpreadsheet() で既存ログを移行する。
 */
function setupLogSpreadsheet() {
  var existing = PropertiesService.getScriptProperties().getProperty('LOG_SPREADSHEET_ID');
  if (existing) {
    return { status: 'already_set', id: existing, message: 'LOG_SPREADSHEET_ID は既に設定済みです。' };
  }
  var logSs = SpreadsheetApp.create('会員システム_ログDB');
  var logId = logSs.getId();
  PropertiesService.getScriptProperties().setProperty('LOG_SPREADSHEET_ID', logId);
  // デフォルトシートにヘッダーを設定
  rebuildLogDatabaseSchemaInternal_(logSs);
  return {
    status: 'created',
    id: logId,
    url: logSs.getUrl(),
    message: 'ログSSを作成しました。全GASプロジェクトのScript Propertiesに LOG_SPREADSHEET_ID=' + logId + ' を設定してください。',
  };
}

/**
 * ログSSのスキーマを再構築する（既存ログSSのシートが壊れた場合など）。
 */
function rebuildLogDatabaseSchema() {
  var logSs = getLogSs_();
  rebuildLogDatabaseSchemaInternal_(logSs);
  return {
    id: logSs.getId(),
    sheets: logSs.getSheets().map(function(s) { return s.getName(); }),
  };
}

function rebuildLogDatabaseSchemaInternal_(logSs) {
  // v360: T_メール送信明細 を追加（Header-Detail パターン）
  var logTableNames = ['T_ログイン履歴', 'T_監査ログ', 'T_メール送信ログ', 'T_メール送信明細'];
  for (var i = 0; i < logTableNames.length; i++) {
    var name = logTableNames[i];
    var headers = テーブル定義[name];
    if (!headers) continue;
    var sheet = logSs.getSheetByName(name);
    if (!sheet) {
      sheet = logSs.insertSheet(name);
    }
    if (sheet.getLastColumn() === 0 || sheet.getRange(1, 1).getValue() !== headers[0]) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }
  // デフォルトの「シート1」を削除
  var defaultSheet = logSs.getSheetByName('シート1');
  if (defaultSheet && logSs.getSheets().length > 1) {
    logSs.deleteSheet(defaultSheet);
  }
}

/**
 * メインSSのログデータをログSSに移行する（一回実行専用）。
 * 実行前に setupLogSpreadsheet() でログSSを作成済みであること。
 */
function migrateLogsToLogSpreadsheet() {
  var mainSs = getOrCreateDatabase_();
  var logSs = getLogSs_();
  if (mainSs.getId() === logSs.getId()) {
    return { status: 'skipped', message: 'LOG_SPREADSHEET_ID が未設定のため移行をスキップしました。先に setupLogSpreadsheet() を実行してください。' };
  }
  var logTableNames = ['T_ログイン履歴', 'T_監査ログ', 'T_メール送信ログ'];
  var results = {};
  for (var i = 0; i < logTableNames.length; i++) {
    var tableName = logTableNames[i];
    var srcSheet = mainSs.getSheetByName(tableName);
    var dstSheet = logSs.getSheetByName(tableName);
    if (!srcSheet || !dstSheet) {
      results[tableName] = 'シートが見つかりません';
      continue;
    }
    var srcLastRow = srcSheet.getLastRow();
    if (srcLastRow < 2) {
      results[tableName] = 'データなし（スキップ）';
      continue;
    }
    var srcData = srcSheet.getRange(2, 1, srcLastRow - 1, srcSheet.getLastColumn()).getValues();
    var dstLastRow = dstSheet.getLastRow();
    var startRow = dstLastRow + 1;
    var neededRows = startRow + srcData.length - 1;
    if (neededRows > dstSheet.getMaxRows()) {
      dstSheet.insertRowsAfter(dstSheet.getMaxRows(), neededRows - dstSheet.getMaxRows());
    }
    dstSheet.getRange(startRow, 1, srcData.length, srcData[0].length).setValues(srcData);
    results[tableName] = srcData.length + '行を移行しました';
  }
  return { status: 'done', results: results };
}

/**
 * 退会済み会員（指定年数以上前）をアーカイブシートに移動する（定期実行用）。
 * デフォルトは退会から3年以上経過した会員をアーカイブ対象とする。
 * 実行前に rebuildDatabaseSchema() でアーカイブシートが作成済みであること。
 */
function runArchiveOldWithdrawnMembers() {
  var archiveYears = 3; // 退会からX年以上経過した会員をアーカイブ
  var ss = getOrCreateDatabase_();
  var cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - archiveYears);
  var cutoffStr = cutoff.toISOString().slice(0, 10);

  var results = {
    members: moveWithdrawnRowsToArchive_(ss, 'T_会員', 'T_会員_archive', '退会日', cutoffStr, '会員ID'),
    staff: moveWithdrawnRowsToArchive_(ss, 'T_事業所職員', 'T_事業所職員_archive', '退会日', cutoffStr, '職員ID'),
  };
  // 2026-10-13: 存在しない invalidateAllDataCache_ を呼んでいた（行を移した直後に例外になる）。
  clearAllDataCache_();
  return { status: 'done', cutoff: cutoffStr, moved: results };
}

// v376.36: 退会済み行を archive へ「移動」（追記 + ソースから物理削除）。
//   - keyCol（会員ID/職員ID）で冪等化: 既に archive 済みの key は二重追記せずソースから除去（自己修復）
//   - archive 行は dst ヘッダー順にマップして構築し、surrogate `アーカイブID` と `アーカイブ日時` を付与
//   - dst スキーマを実行時に normalizeTableColumns_ で最新化（アーカイブ列を保証）
function moveWithdrawnRowsToArchive_(ss, srcName, dstName, dateCol, cutoffStr, keyCol) {
  var srcSheet = ss.getSheetByName(srcName);
  var dstSheet = ss.getSheetByName(dstName);
  if (!srcSheet || !dstSheet || srcSheet.getLastRow() < 2) return 0;

  // archive スキーマを最新化（アーカイブID/アーカイブ日時 列を保証）
  try { normalizeTableColumns_(ss, dstName); } catch (e) { Logger.log('moveWithdrawnRowsToArchive_ normalize skipped: ' + e); }

  var headers = srcSheet.getRange(1, 1, 1, srcSheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var h = 0; h < headers.length; h++) cols[headers[h]] = h;
  var dstHeaders = dstSheet.getRange(1, 1, 1, dstSheet.getLastColumn()).getValues()[0];

  // 既存 archive の key 集合（冪等性: 二重移動・二重追記を防止）
  var existingKeys = {};
  if (keyCol && dstSheet.getLastRow() >= 2) {
    var dKeyIdx = dstHeaders.indexOf(keyCol);
    if (dKeyIdx >= 0) {
      var dKeys = dstSheet.getRange(2, dKeyIdx + 1, dstSheet.getLastRow() - 1, 1).getValues();
      for (var k = 0; k < dKeys.length; k++) {
        var kv = String(dKeys[k][0] || '').trim();
        if (kv) existingKeys[kv] = true;
      }
    }
  }

  var data = srcSheet.getRange(2, 1, srcSheet.getLastRow() - 1, srcSheet.getLastColumn()).getValues();
  var keepRows = [];
  var archiveRows = [];
  var nowIso = new Date().toISOString();

  for (var r = 0; r < data.length; r++) {
    var isDeleted = toBoolean_(data[r][cols['削除フラグ']]);
    var withdrawnDate = cols[dateCol] != null ? normalizeDateInput_(data[r][cols[dateCol]]) : '';
    var isCandidate = isDeleted && withdrawnDate && withdrawnDate <= cutoffStr;
    if (!isCandidate) { keepRows.push(data[r]); continue; }

    var keyVal = keyCol && cols[keyCol] != null ? String(data[r][cols[keyCol]] || '').trim() : '';
    if (keyVal && existingKeys[keyVal]) {
      // 既に archive 済（前回の部分失敗等）→ 二重追記せずソースから除去（冪等な自己修復）
      Logger.log('moveWithdrawnRowsToArchive_: duplicate key already archived, removing from source: ' + dstName + ' / ' + keyVal);
      continue;
    }
    // dst ヘッダー順に行を構築（source 値はヘッダー名でマップ、サロゲート/日時を付与）
    var archiveId = 'ARC-' + Utilities.getUuid().split('-').join('').substring(0, 12).toUpperCase();
    var row = [];
    for (var c = 0; c < dstHeaders.length; c++) {
      var hn = dstHeaders[c];
      if (hn === 'アーカイブID') row.push(archiveId);
      else if (hn === 'アーカイブ日時') row.push(nowIso);
      else if (cols[hn] != null) row.push(data[r][cols[hn]]);
      else row.push('');
    }
    archiveRows.push(row);
    if (keyVal) existingKeys[keyVal] = true;
  }

  // 候補も重複除去も無ければ何もしない
  if (archiveRows.length === 0 && keepRows.length === data.length) return 0;

  // archive シートに先に追記（保存成功後にソースを削除＝データ消失防止）
  if (archiveRows.length > 0) {
    var startRow = dstSheet.getLastRow() + 1;
    var neededRows = startRow + archiveRows.length - 1;
    if (neededRows > dstSheet.getMaxRows()) {
      dstSheet.insertRowsAfter(dstSheet.getMaxRows(), neededRows - dstSheet.getMaxRows());
    }
    dstSheet.getRange(startRow, 1, archiveRows.length, dstHeaders.length).setValues(archiveRows);
  }

  // ソースの整理（archive 追記成功後に keepRows のみ残す）
  srcSheet.getRange(2, 1, data.length, srcSheet.getLastColumn()).clearContent();
  if (keepRows.length > 0) {
    srcSheet.getRange(2, 1, keepRows.length, headers.length).setValues(keepRows);
  }

  return archiveRows.length;
}

/**
 * LOG_SPREADSHEET_ID をこのプロジェクトのスクリプトプロパティに設定する。
 * admin/member split に同じログSSIDを適用するために使用する。
 */
function applyLogSpreadsheetId() {
  var LOG_SS_ID = '1NmVv483UeehF8dqCdyNKOqOtv_fPKROhHN7011N23lw';
  PropertiesService.getScriptProperties().setProperty('LOG_SPREADSHEET_ID', LOG_SS_ID);
  var verify = PropertiesService.getScriptProperties().getProperty('LOG_SPREADSHEET_ID');
  return { status: 'ok', LOG_SPREADSHEET_ID: verify };
}
