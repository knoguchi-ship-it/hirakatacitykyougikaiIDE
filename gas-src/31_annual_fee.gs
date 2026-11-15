// gas-src/31_annual_fee.gs — 会計年度・年会費。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

function parseTransferAccount_(raw, fallback) {
  var defaultAccount = fallback || DEMO_TRANSFER_ACCOUNT;
  if (!raw) return defaultAccount;
  var txt = String(raw);
  try {
    var parsed = JSON.parse(txt);
    if (parsed && parsed.bankName && parsed.accountNumber) {
      return parsed;
    }
  } catch (e) {}
  return defaultAccount;
}

function getAnnualFeeTransferAccountSetting_(ss) {
  var raw = getSystemSettingValue_(ss, 'ANNUAL_FEE_TRANSFER_ACCOUNT');
  if (!raw) return DEMO_TRANSFER_ACCOUNT;
  try {
    var parsed = JSON.parse(String(raw));
    if (parsed && parsed.bankName && parsed.accountNumber && parsed.accountName) {
      return {
        bankName: String(parsed.bankName || ''),
        branchName: String(parsed.branchName || ''),
        accountType: String(parsed.accountType || '普通') === '当座' ? '当座' : '普通',
        accountNumber: String(parsed.accountNumber || ''),
        accountName: String(parsed.accountName || ''),
        note: String(parsed.note || ''),
      };
    }
  } catch (e) {}
  return DEMO_TRANSFER_ACCOUNT;
}

function validateAnnualFeeTransferAccount_(account) {
  if (!account) throw new Error('年会費の振込先が未設定です。');
  var normalized = {
    bankName: String(account.bankName || '').trim(),
    branchName: String(account.branchName || '').trim(),
    accountType: String(account.accountType || '普通') === '当座' ? '当座' : '普通',
    accountNumber: String(account.accountNumber || '').trim(),
    accountName: String(account.accountName || '').trim(),
    note: String(account.note || '').trim(),
  };
  if (!normalized.bankName) throw new Error('年会費の振込先の銀行名は必須です。');
  if (!normalized.branchName) throw new Error('年会費の振込先の支店名は必須です。');
  if (!normalized.accountNumber) throw new Error('年会費の振込先の口座番号は必須です。');
  if (!normalized.accountName) throw new Error('年会費の振込先の口座名義は必須です。');
  if (normalized.bankName.length > 100 || normalized.branchName.length > 100 || normalized.accountName.length > 150 || normalized.note.length > 500) {
    throw new Error('年会費の振込先情報が長すぎます。');
  }
  return normalized;
}

function getCurrentFiscalYear_() {
  var now = new Date();
  var month = now.getMonth() + 1;
  return month >= 4 ? now.getFullYear() : now.getFullYear() - 1;
}

function getAnnualFeeFiscalYearPreviousEndDate_(fiscalYear) {
  return String(Number(fiscalYear || 0)) + '-03-31';
}

function getFiscalYearStartDate_(fiscalYear) {
  return String(Number(fiscalYear || 0)) + '-04-01';
}

function getAnnualFeeFiscalYearEndDate_(fiscalYear) {
  return String(Number(fiscalYear || 0) + 1) + '-03-31';
}

// v376.46: 会計年度ステータス判定の単一情報源 computeMemberFiscalStatus を
// src/shared/memberFiscalStatus.mjs から build 時に注入する（フロントと同一ロジック）。
// 下記マーカー間の stub は build（injectMemberFiscalStatusPlaceholders）で実体へ置換される。
// __MEMBER_FISCAL_STATUS_BUILD_INJECT_START__
function computeMemberFiscalStatus_(input, fiscalYear, currentFiscalYear) {
  throw new Error('computeMemberFiscalStatus_ is not injected — run build:gas (injectMemberFiscalStatusPlaceholders)');
}
// __MEMBER_FISCAL_STATUS_BUILD_INJECT_END__

function getMemberFiscalSnapshot_(memberRow, fiscalYear) {
  var normalizedYear = Number(fiscalYear || 0);
  var joinedIso = normalizeDateInput_(memberRow && memberRow['入会日']);
  var withdrawnIso = normalizeDateInput_(memberRow && memberRow['退会日']);
  var result = {
    eligible: false,
    memberStatus: 'OUT_OF_YEAR',
    joinedDate: joinedIso,
    withdrawnDate: withdrawnIso,
    fiscalYear: normalizedYear,
    reason: '',
  };
  if (!memberRow) {
    result.reason = 'NO_MEMBER';
    return result;
  }
  if (!isFinite(normalizedYear) || normalizedYear < 2000 || normalizedYear > 2100) {
    result.reason = 'INVALID_YEAR';
    return result;
  }
  // 単一情報源へ委譲（フロント getMemberStatusAtFiscalYear と同一ロジック）
  var r = computeMemberFiscalStatus_({
    status: String(memberRow['会員状態コード'] || 'ACTIVE'),
    joinedDate: joinedIso,
    withdrawnDate: withdrawnIso,
    deleted: toBoolean_(memberRow['削除フラグ']),
  }, normalizedYear, getCurrentFiscalYear_());
  result.eligible = r.includeInMailing;
  result.memberStatus = (r.status === 'NOT_IN_YEAR') ? 'OUT_OF_YEAR' : r.status;
  result.reason = r.status;
  return result;
}

function buildMemberAnnualFeeHistory_(memberRow, feeHistory, memberTypeFeeMap) {
  var history = Array.isArray(feeHistory) ? feeHistory.slice() : [];
  var currentFiscalYear = getCurrentFiscalYear_();
  var sortedActualHistory = history
    .sort(function(a, b) { return Number(b.year || 0) - Number(a.year || 0); });
  var actualByYear = {};
  for (var i = 0; i < sortedActualHistory.length; i += 1) {
    var record = sortedActualHistory[i];
    var year = Number(record && record.year || 0);
    if (!year || actualByYear[year]) continue;
    actualByYear[year] = record;
  }

  var prioritizedYears = [];
  var oldestDisplayYear = Math.max(2024, currentFiscalYear - 3);
  for (var displayYear = currentFiscalYear; displayYear >= oldestDisplayYear; displayYear -= 1) {
    if (isAnnualFeeEligibleMemberForYear_(memberRow, displayYear)) {
      prioritizedYears.push(displayYear);
    }
  }

  if (prioritizedYears.length === 0) {
    return sortedActualHistory.filter(function(record) {
      var actualYear = Number(record && record.year || 0);
      return actualYear >= 2024 && actualYear <= currentFiscalYear;
    }).slice(0, 4);
  }

  return prioritizedYears.map(function(year) {
    if (actualByYear[year]) return actualByYear[year];
    return {
      id: '',
      year: year,
      status: 'UNPAID',
      confirmedDate: '',
      amount: resolveAnnualFeeAmount_(memberRow, memberTypeFeeMap, 0),
      note: '',
      updatedAt: '',
    };
  });
}

function isAnnualFeeEligibleMemberForYear_(memberRow, fiscalYear) {
  return getMemberFiscalSnapshot_(memberRow, fiscalYear).eligible;
}

function buildAnnualFeeIneligibleMessage_(memberRow, fiscalYear) {
  var year = Number(fiscalYear || 0);
  var displayName = buildAnnualFeeDisplayName_(memberRow);
  var withdrawnDate = normalizeDateInput_(memberRow && memberRow['退会日']);
  var joinedDate = normalizeDateInput_(memberRow && memberRow['入会日']);
  var previousFiscalYearEnd = getAnnualFeeFiscalYearPreviousEndDate_(year);
  var fiscalYearEnd = getAnnualFeeFiscalYearEndDate_(year);

  if (withdrawnDate && withdrawnDate <= previousFiscalYearEnd) {
    return displayName + ' は対象年度 ' + year + ' の年会費対象外です。退会日 ' + withdrawnDate + ' が前年度末 ' + previousFiscalYearEnd + ' 以前です。';
  }
  if (!withdrawnDate && String(memberRow && memberRow['会員状態コード'] || 'ACTIVE') === 'WITHDRAWN') {
    return displayName + ' は対象年度 ' + year + ' の年会費対象外です。退会済みですが退会日が未設定です。';
  }
  if (joinedDate && joinedDate > fiscalYearEnd) {
    return displayName + ' は対象年度 ' + year + ' の年会費対象外です。入会日 ' + joinedDate + ' が年度末 ' + fiscalYearEnd + ' より後です。';
  }
  return displayName + ' は対象年度 ' + year + ' の年会費対象外です。';
}

function assertAnnualFeeEligibleMemberForYear_(memberRow, fiscalYear) {
  if (!isAnnualFeeEligibleMemberForYear_(memberRow, fiscalYear)) {
    throw new Error(buildAnnualFeeIneligibleMessage_(memberRow, fiscalYear));
  }
}

function createAnnualFeeAdminSummaryByType_(memberType) {
  return {
    memberType: memberType,
    eligibleCount: 0,
    paidCount: 0,
    unpaidCount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
  };
}

function buildAnnualFeeAdminSummary_(records) {
  var byType = {
    INDIVIDUAL: createAnnualFeeAdminSummaryByType_('INDIVIDUAL'),
    BUSINESS: createAnnualFeeAdminSummaryByType_('BUSINESS'),
    SUPPORT: createAnnualFeeAdminSummaryByType_('SUPPORT'),
  };
  var summary = {
    eligibleCount: 0,
    paidCount: 0,
    unpaidCount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    // v364: 前年度未納者数（前年度有効 かつ UNPAID/未記録）
    previousYearUnpaidCount: 0,
    memberTypeBreakdown: [
      byType.INDIVIDUAL,
      byType.BUSINESS,
      byType.SUPPORT,
    ],
  };

  for (var i = 0; i < (records || []).length; i += 1) {
    var record = records[i];
    var bucket = byType[String(record.memberType || 'INDIVIDUAL')] || byType.INDIVIDUAL;
    var amount = Number(record.amount || 0);
    var isPaid = String(record.status || 'UNPAID') === 'PAID';

    summary.eligibleCount += 1;
    bucket.eligibleCount += 1;

    if (isPaid) {
      summary.paidCount += 1;
      summary.paidAmount += amount;
      bucket.paidCount += 1;
      bucket.paidAmount += amount;
    } else {
      summary.unpaidCount += 1;
      summary.unpaidAmount += amount;
      bucket.unpaidCount += 1;
      bucket.unpaidAmount += amount;
    }

    // v364: 前年度未納集計
    if (record.previousYearEligible && record.previousYearStatus === 'UNPAID') {
      summary.previousYearUnpaidCount += 1;
    }
  }

  return summary;
}

function clearRecentAnnualFeeAdminCaches_() {
  var currentFiscalYear = getCurrentFiscalYear_();
  for (var year = currentFiscalYear - 2; year <= currentFiscalYear + 1; year += 1) {
    clearAnnualFeeAdminCache_(year);
  }
}

function resolveAnnualFeeSelectedYear_(ss, payload) {
  var requestedYear = Number(payload && payload.year || 0);
  if (isFinite(requestedYear) && requestedYear >= 2000 && requestedYear <= 2100) {
    return Math.floor(requestedYear);
  }
  // year未指定時は現在の会計年度を返す。
  // 旧実装ではDBの最新レコード年度を返していたが、新年度開始直後にレコードがない場合に
  // 前年度が表示されるバグが発生するため、常に getCurrentFiscalYear_() を基準とする。
  return getCurrentFiscalYear_();
}

function getAnnualFeeAdminData_(payload) {
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var selectedYear = resolveAnnualFeeSelectedYear_(ss, payload);
  var cache = CacheService.getScriptCache();
  var cacheKey = getAnnualFeeAdminCacheKey_(selectedYear);
  var cached = getChunkedCache_(cache, cacheKey);
  if (cached) return cached;

  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(r) {
    return isAnnualFeeEligibleMemberForYear_(r, selectedYear);
  });
  var feeRows = getRowsAsObjects_(ss, 'T_年会費納入履歴').filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });
  var auditRows = getLastRowsAsObjects_(ss, 'T_年会費更新履歴', 20);
  var amountMap = getAnnualFeeAmountMap_(ss);

  var memberMap = {};
  for (var i = 0; i < memberRows.length; i += 1) {
    var member = memberRows[i];
    memberMap[String(member['会員ID'] || '')] = member;
  }

  var currentFiscalYear = getCurrentFiscalYear_();
  var years = feeRows.map(function(row) { return Number(row['対象年度'] || 0); })
    .filter(function(year) { return !!year; })
    .filter(function(year, idx, arr) { return arr.indexOf(year) === idx; });
  if (years.indexOf(currentFiscalYear) === -1) years.push(currentFiscalYear);
  if (years.indexOf(selectedYear) === -1) years.push(selectedYear);
  years.sort(function(a, b) { return b - a; });

  var feeByMemberYear = {};
  // v364: 前年度（selectedYear - 1）の納入状況を判定するためのマップ
  var previousYear = selectedYear - 1;
  var prevFeeByMember = {};
  for (var feeIdx = 0; feeIdx < feeRows.length; feeIdx += 1) {
    var fee = feeRows[feeIdx];
    var feeYear = Number(fee['対象年度'] || 0);
    var feeMemberId = String(fee['会員ID'] || '');
    if (feeYear === selectedYear) feeByMemberYear[feeMemberId] = fee;
    else if (feeYear === previousYear) prevFeeByMember[feeMemberId] = fee;
  }

  // v364: 全 T_会員 から「前年度に有効だった人」を一度判定（memberRows は selectedYear で
  // フィルタ済のため、selectedYear=2026 / previousYear=2025 で 2026 入会者の前年判定が漏れない
  // よう、対象 selectedYear の memberRows をそのまま使う＝同一スキーマで eligibility 再判定）
  var records = memberRows.map(function(member) {
    var memberId = String(member['会員ID'] || '');
    var row = feeByMemberYear[memberId];
    var record = mapAnnualFeeAdminRecord_(row, member, selectedYear, amountMap);

    // 前年度ステータス判定: 有効でない → NOT_ELIGIBLE, 有効かつ PAID → PAID, それ以外 → UNPAID
    var prevEligible = isAnnualFeeEligibleMemberForYear_(member, previousYear);
    record.previousYear = previousYear;
    record.previousYearEligible = prevEligible;
    if (!prevEligible) {
      record.previousYearStatus = 'NOT_ELIGIBLE';
    } else {
      var prevFee = prevFeeByMember[memberId];
      var prevStatus = prevFee ? String(prevFee['会費納入状態コード'] || 'UNPAID') : 'UNPAID';
      record.previousYearStatus = prevStatus === 'PAID' ? 'PAID' : 'UNPAID';
    }
    return record;
  }).sort(function(a, b) {
    return String(a.displayName || '').localeCompare(String(b.displayName || ''));
  });

  var actorNameMap = buildActorDisplayNameMap_(ss, memberMap);
  var auditLogs = auditRows.map(function(row) {
    return mapAnnualFeeAuditLog_(row, memberMap[String(row['会員ID'] || '')], actorNameMap);
  }).sort(function(a, b) {
    return String(b.executedAt || '').localeCompare(String(a.executedAt || ''));
  }).slice(0, 20);

  var result = {
    selectedYear: selectedYear,
    records: records,
    years: years,
    auditLogs: auditLogs,
    summary: buildAnnualFeeAdminSummary_(records),
  };
  try {
    putChunkedCache_(cache, cacheKey, result, ANNUAL_FEE_CACHE_TTL_SECONDS);
  } catch (e) {
    Logger.log('getAnnualFeeData_ cache skipped: ' + e.message);
  }
  return result;
}

function saveAnnualFeeRecord_(payload) {
  var request = validateAnnualFeePayload_(payload);
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  var memberSheet = ss.getSheetByName('T_会員');
  var memberFound = findRowByColumnValue_(memberSheet, '会員ID', request.memberId);
  if (!memberFound || toBoolean_(memberFound.row[memberFound.columns['削除フラグ']])) {
    throw new Error('対象会員が見つかりません。');
  }
  var memberRowObj = annualFeeMemberObject_(memberFound.row, memberFound.columns);
  assertAnnualFeeEligibleMemberForYear_(memberRowObj, request.year);
  var amountMap = getAnnualFeeAmountMap_(ss);
  var resolvedAmount = resolveAnnualFeeAmount_(memberRowObj, amountMap, 0);
  var actorEmail = String(Session.getActiveUser().getEmail() || '').toLowerCase();

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var feeSheet = ss.getSheetByName('T_年会費納入履歴');
    if (!feeSheet) throw new Error('T_年会費納入履歴 シートが見つかりません。');
    var duplicate = findAnnualFeeRowByMemberYear_(feeSheet, request.memberId, request.year);
    var foundById = request.id ? findRowByColumnValue_(feeSheet, '年会費履歴ID', request.id) : null;

    if (request.id) {
      if (!foundById) {
        throw new Error('更新対象の年会費レコードが見つかりません。');
      }
      if (duplicate && duplicate.rowNumber !== foundById.rowNumber) {
        throw new Error('同じ会員・同じ年度の年会費レコードが既に存在します。');
      }
    } else if (duplicate) {
      throw new Error('同じ会員・同じ年度の年会費レコードが既に存在します。');
    }

    var target = foundById || duplicate;
    var cols = target ? target.columns : buildColumnIndex_(feeSheet);
    requireColumns_(cols, [
      '年会費履歴ID', '会員ID', '対象年度', '会費納入状態コード',
      '納入確認日', '金額', '備考', '作成日時', '更新日時', '削除フラグ'
    ]);

    var nowIso = new Date().toISOString();
    var beforeRecord = target ? annualFeeSheetRowToObject_(target.row, cols) : null;
    var recordId = target ? String(target.row[cols['年会費履歴ID']] || '') : Utilities.getUuid();
    var nextRow = target ? target.row.slice() : new Array(Object.keys(cols).length).fill('');

    nextRow[cols['年会費履歴ID']] = recordId;
    nextRow[cols['会員ID']] = request.memberId;
    nextRow[cols['対象年度']] = request.year;
    nextRow[cols['会費納入状態コード']] = request.status;
    nextRow[cols['納入確認日']] = request.status === 'PAID' ? request.confirmedDate : '';
    nextRow[cols['金額']] = resolvedAmount;
    nextRow[cols['備考']] = request.note;
    nextRow[cols['更新日時']] = nowIso;
    nextRow[cols['削除フラグ']] = false;
    if (cols['作成日時'] != null && !target) nextRow[cols['作成日時']] = nowIso;
    if (cols['作成日時'] != null && target && !String(nextRow[cols['作成日時']] || '')) nextRow[cols['作成日時']] = nowIso;

    if (target) {
      feeSheet.getRange(target.rowNumber, 1, 1, nextRow.length).setValues([nextRow]);
    } else {
      feeSheet.getRange(feeSheet.getLastRow() + 1, 1, 1, nextRow.length).setValues([nextRow]);
    }

    var afterRecord = annualFeeSheetRowToObject_(nextRow, cols);
    appendRowsByHeaders_(ss, 'T_年会費更新履歴', [{
      年会費更新履歴ID: Utilities.getUuid(),
      年会費履歴ID: recordId,
      会員ID: request.memberId,
      対象年度: request.year,
      操作種別: target ? 'UPDATE' : 'CREATE',
      更新前JSON: beforeRecord ? JSON.stringify(beforeRecord) : '',
      更新後JSON: JSON.stringify(afterRecord),
      実行者メール: actorEmail,
      実行日時: nowIso,
    }]);

    clearAnnualFeeAdminCache_(request.year);
    clearAllDataCache_();
    clearAdminDashboardCache_();
    clearTrainingManagementCache_();
    return mapAnnualFeeAdminRecord_(afterRecord, memberRowObj, request.year, amountMap);
  } finally {
    lock.releaseLock();
  }
}

function saveAnnualFeeRecordsBatch_(payload) {
  if (!payload || !Array.isArray(payload.records) || payload.records.length === 0) {
    throw new Error('保存対象のレコードがありません。');
  }
  if (payload.records.length > 100) {
    throw new Error('一括保存は最大100件までです。');
  }
  var requests = [];
  for (var i = 0; i < payload.records.length; i += 1) {
    requests.push(validateAnnualFeeBatchPayload_(payload.records[i]));
  }
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var memberSheet = ss.getSheetByName('T_会員');
  var amountMap = getAnnualFeeAmountMap_(ss);
  var actorEmail = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var feeSheet = ss.getSheetByName('T_年会費納入履歴');
    if (!feeSheet) throw new Error('T_年会費納入履歴 シートが見つかりません。');
    var cols = buildColumnIndex_(feeSheet);
    requireColumns_(cols, [
      '年会費履歴ID', '会員ID', '対象年度', '会費納入状態コード',
      '納入確認日', '金額', '備考', '作成日時', '更新日時', '削除フラグ'
    ]);
    var feeData = feeSheet.getLastRow() >= 2
      ? feeSheet.getRange(2, 1, feeSheet.getLastRow() - 1, feeSheet.getLastColumn()).getValues()
      : [];
    var nowIso = new Date().toISOString();
    var results = [];
    var withdrawnMemberIds = [];
    var auditRows = [];
    var updatedSheetRows = [];
    var appendRows = [];
    var pendingWithdrawals = [];
    for (var ri = 0; ri < requests.length; ri += 1) {
      var request = requests[ri];
      var memberFound = findRowByColumnValue_(memberSheet, '会員ID', request.memberId);
      if (!memberFound || toBoolean_(memberFound.row[memberFound.columns['削除フラグ']])) {
        throw new Error('対象会員 ' + request.memberId + ' が見つかりません。');
      }
      var memberRowObj = annualFeeMemberObject_(memberFound.row, memberFound.columns);
      assertAnnualFeeEligibleMemberForYear_(memberRowObj, request.year);
      var resolvedAmount = resolveAnnualFeeAmount_(memberRowObj, amountMap, 0);
      var target = null;
      for (var fi = 0; fi < feeData.length; fi += 1) {
        if (String(feeData[fi][cols['会員ID']] || '') === String(request.memberId) &&
            Number(feeData[fi][cols['対象年度']] || 0) === request.year) {
          target = { rowNumber: fi + 2, row: feeData[fi].slice(), columns: cols };
          break;
        }
      }
      if (request.id && !target) {
        for (var fi2 = 0; fi2 < feeData.length; fi2 += 1) {
          if (String(feeData[fi2][cols['年会費履歴ID']] || '') === request.id) {
            target = { rowNumber: fi2 + 2, row: feeData[fi2].slice(), columns: cols };
            break;
          }
        }
      }
      var beforeRecord = target ? annualFeeSheetRowToObject_(target.row, cols) : null;
      if (request.status === 'WITHDRAW') {
        var withdrawnDate = getAnnualFeeFiscalYearPreviousEndDate_(request.year);
        var withdrawalProcessDate = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
        // 2026-10-13: 退会の確定と認証の無効化は、全件の検証が通った後にまとめて行う。
        // 以前はループの中で即時に行っており、後続のレコードで例外になると「保存されていない」と
        // 見えるのに、先に処理した会員は退会済み・ログイン不可になっていた。
        pendingWithdrawals.push({ memberId: request.memberId, withdrawnDate: withdrawnDate, withdrawalProcessDate: withdrawalProcessDate });
        if (target) {
          var withdrawnRow = target.row.slice();
          withdrawnRow[cols['更新日時']] = nowIso;
          withdrawnRow[cols['削除フラグ']] = true;
          updatedSheetRows.push({ rowNumber: target.rowNumber, data: withdrawnRow });
          feeData[target.rowNumber - 2] = withdrawnRow;
        }
        auditRows.push({
          年会費更新履歴ID: Utilities.getUuid(),
          年会費履歴ID: target ? String(target.row[cols['年会費履歴ID']] || '') : '',
          会員ID: request.memberId,
          対象年度: request.year,
          操作種別: 'WITHDRAW',
          更新前JSON: beforeRecord ? JSON.stringify(beforeRecord) : '',
          更新後JSON: JSON.stringify({
            memberStatus: 'WITHDRAWN',
            withdrawnDate: withdrawnDate,
            withdrawalProcessDate: withdrawalProcessDate,
            annualFeeRecordDeleted: !!target,
          }),
          実行者メール: actorEmail,
          実行日時: nowIso,
        });
        withdrawnMemberIds.push(request.memberId);
        continue;
      }
      var recordId = target ? String(target.row[cols['年会費履歴ID']] || '') : Utilities.getUuid();
      var nextRow = target ? target.row.slice() : new Array(Object.keys(cols).length).fill('');
      nextRow[cols['年会費履歴ID']] = recordId;
      nextRow[cols['会員ID']] = request.memberId;
      nextRow[cols['対象年度']] = request.year;
      nextRow[cols['会費納入状態コード']] = request.status;
      nextRow[cols['納入確認日']] = request.status === 'PAID' ? request.confirmedDate : '';
      nextRow[cols['金額']] = resolvedAmount;
      nextRow[cols['備考']] = request.note;
      nextRow[cols['更新日時']] = nowIso;
      nextRow[cols['削除フラグ']] = false;
      if (cols['作成日時'] != null && !target) nextRow[cols['作成日時']] = nowIso;
      if (cols['作成日時'] != null && target && !String(nextRow[cols['作成日時']] || '')) nextRow[cols['作成日時']] = nowIso;
      if (target) {
        updatedSheetRows.push({ rowNumber: target.rowNumber, data: nextRow });
        feeData[target.rowNumber - 2] = nextRow;
      } else {
        appendRows.push(nextRow);
        feeData.push(nextRow);
      }
      var afterRecord = annualFeeSheetRowToObject_(nextRow, cols);
      auditRows.push({
        年会費更新履歴ID: Utilities.getUuid(),
        年会費履歴ID: recordId,
        会員ID: request.memberId,
        対象年度: request.year,
        操作種別: target ? 'UPDATE' : 'CREATE',
        更新前JSON: beforeRecord ? JSON.stringify(beforeRecord) : '',
        更新後JSON: JSON.stringify(afterRecord),
        実行者メール: actorEmail,
        実行日時: nowIso,
      });
      results.push(mapAnnualFeeAdminRecord_(afterRecord, memberRowObj, request.year, amountMap));
    }
    for (var pw = 0; pw < pendingWithdrawals.length; pw += 1) {
      var w = pendingWithdrawals[pw];
      updateMember_({
        id: w.memberId,
        status: 'WITHDRAWN',
        withdrawnDate: w.withdrawnDate,
        withdrawalProcessDate: w.withdrawalProcessDate,
        midYearWithdrawal: false,
      }, {
        skipAdminCheck: true,
        auditActor: actorEmail,
        ss: ss,
        skipCacheClear: true,
      });
      disableAuthAccountsByMemberId_(ss, w.memberId);
    }
    for (var ui = 0; ui < updatedSheetRows.length; ui += 1) {
      var u = updatedSheetRows[ui];
      feeSheet.getRange(u.rowNumber, 1, 1, u.data.length).setValues([u.data]);
    }
    if (appendRows.length > 0) {
      var startRow = feeSheet.getLastRow() + 1;
      feeSheet.getRange(startRow, 1, appendRows.length, appendRows[0].length).setValues(appendRows);
    }
    if (auditRows.length > 0) {
      appendRowsByHeaders_(ss, 'T_年会費更新履歴', auditRows);
    }
    var yearSet = {};
    for (var yi = 0; yi < requests.length; yi += 1) yearSet[requests[yi].year] = true;
    for (var yearKey in yearSet) {
      if (Object.prototype.hasOwnProperty.call(yearSet, yearKey)) clearAnnualFeeAdminCache_(yearKey);
    }
    clearAllDataCache_();
    clearAdminDashboardCache_();
    clearTrainingManagementCache_();
    return { savedRecords: results, withdrawnMemberIds: withdrawnMemberIds };
  } finally {
    lock.releaseLock();
  }
}

function validateAnnualFeePayload_(payload) {
  if (!payload) throw new Error('年会費データが空です。');
  var memberId = String(payload.memberId || '').trim();
  if (!memberId) throw new Error('会員IDが未指定です。');

  var year = Number(payload.year || 0);
  if (!isFinite(year) || year < 2000 || year > 2100) {
    throw new Error('対象年度は 2000〜2100 の範囲で入力してください。');
  }

  var status = String(payload.status || 'UNPAID');
  if (status !== 'PAID' && status !== 'UNPAID') {
    throw new Error('会費納入状態が不正です。');
  }

  var confirmedDate = normalizeDateInput_(payload.confirmedDate);
  if (status === 'PAID' && !confirmedDate) {
    throw new Error('納入済にする場合は納入確認日を入力してください。');
  }

  var note = String(payload.note || '');
  if (note.length > 2000) {
    throw new Error('備考は 2000 文字以内で入力してください。');
  }

  return {
    id: String(payload.id || '').trim(),
    memberId: memberId,
    year: Math.floor(year),
    status: status,
    confirmedDate: confirmedDate,
    note: note,
  };
}

function validateAnnualFeeBatchPayload_(payload) {
  if (!payload) throw new Error('年会費データが空です。');
  var memberId = String(payload.memberId || '').trim();
  if (!memberId) throw new Error('会員IDが未指定です。');

  var year = Number(payload.year || 0);
  if (!isFinite(year) || year < 2000 || year > 2100) {
    throw new Error('対象年度は 2000〜2100 の範囲で入力してください。');
  }

  var status = String(payload.status || 'UNPAID');
  if (status !== 'PAID' && status !== 'UNPAID' && status !== 'WITHDRAW') {
    throw new Error('会費納入状態が不正です。');
  }

  var confirmedDate = normalizeDateInput_(payload.confirmedDate);
  if (status === 'PAID' && !confirmedDate) {
    throw new Error('納入済にする場合は納入確認日を入力してください。');
  }

  var note = String(payload.note || '');
  if (note.length > 2000) {
    throw new Error('備考は 2000 文字以内で入力してください。');
  }

  return {
    id: String(payload.id || '').trim(),
    memberId: memberId,
    year: Math.floor(year),
    status: status,
    confirmedDate: status === 'PAID' ? confirmedDate : '',
    note: note,
  };
}

function buildColumnIndex_(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i += 1) cols[String(headers[i] || '')] = i;
  return cols;
}

function findAnnualFeeRowByMemberYear_(sheet, memberId, year) {
  if (!sheet || sheet.getLastRow() < 2) return null;
  var cols = buildColumnIndex_(sheet);
  requireColumns_(cols, ['会員ID', '対象年度']);
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  for (var i = 0; i < rows.length; i += 1) {
    var row = rows[i];
    if (String(row[cols['会員ID']] || '') !== String(memberId || '')) continue;
    if (Number(row[cols['対象年度']] || 0) !== Number(year || 0)) continue;
    return {
      rowNumber: i + 2,
      row: row,
      columns: cols,
    };
  }
  return null;
}

function annualFeeSheetRowToObject_(row, cols) {
  return {
    id: String(row[cols['年会費履歴ID']] || ''),
    memberId: String(row[cols['会員ID']] || ''),
    year: Number(row[cols['対象年度']] || 0),
    status: String(row[cols['会費納入状態コード']] || 'UNPAID'),
    confirmedDate: normalizeDateInput_(row[cols['納入確認日']]),
    amount: Number(row[cols['金額']] || 0),
    note: String(row[cols['備考']] || ''),
    updatedAt: String(row[cols['更新日時']] || ''),
  };
}

function annualFeeMemberObject_(row, cols) {
  var obj = {};
  for (var key in cols) {
    if (Object.prototype.hasOwnProperty.call(cols, key)) {
      obj[key] = row[cols[key]];
    }
  }
  return obj;
}

function buildAnnualFeeDisplayName_(memberRow) {
  if (!memberRow) return '(不明)';
  var type = String(memberRow['会員種別コード'] || 'INDIVIDUAL');
  if (type === 'BUSINESS') return String(memberRow['勤務先名'] || '').trim() || String(memberRow['会員ID'] || '');
  var fullName = (String(memberRow['姓'] || '') + ' ' + String(memberRow['名'] || '')).trim();
  return fullName || String(memberRow['会員ID'] || '');
}

function mapAnnualFeeAdminRecord_(rowObj, memberRow, selectedYear, amountMap) {
  var year = Number(selectedYear || rowObj && (rowObj.year || rowObj['対象年度']) || 0);
  var exists = !!rowObj;
  var memberId = exists ? String(rowObj.memberId || rowObj['会員ID'] || '') : String((memberRow && memberRow['会員ID']) || '');
  return {
    id: exists ? String(rowObj.id || rowObj['年会費履歴ID'] || '') : '',
    exists: exists,
    memberId: memberId,
    memberType: String((memberRow && memberRow['会員種別コード']) || 'INDIVIDUAL'),
    displayName: buildAnnualFeeDisplayName_(memberRow),
    // v362: フリガナ検索対応（T_会員 セイ + メイ）
    kana: ((String((memberRow && memberRow['セイ']) || '') + ' ' + String((memberRow && memberRow['メイ']) || '')).trim()),
    officeName: String((memberRow && memberRow['勤務先名']) || ''),
    year: year,
    status: String((rowObj && (rowObj.status || rowObj['会費納入状態コード'])) || 'UNPAID'),
    confirmedDate: normalizeDateInput_(rowObj && (rowObj.confirmedDate || rowObj['納入確認日'])),
    amount: resolveAnnualFeeAmount_(memberRow, amountMap, rowObj && (rowObj.amount || rowObj['金額'])),
    note: String((rowObj && (rowObj.note || rowObj['備考'])) || ''),
    updatedAt: String((rowObj && (rowObj.updatedAt || rowObj['更新日時'])) || ''),
  };
}

function mapAnnualFeeAuditLog_(rowObj, memberRow, actorNameMap) {
  var email = String(rowObj['実行者メール'] || '').toLowerCase();
  return {
    id: String(rowObj['年会費更新履歴ID'] || ''),
    annualFeeRecordId: String(rowObj['年会費履歴ID'] || ''),
    memberId: String(rowObj['会員ID'] || ''),
    displayName: buildAnnualFeeDisplayName_(memberRow),
    year: Number(rowObj['対象年度'] || 0),
    action: String(rowObj['操作種別'] || 'UPDATE'),
    actorEmail: email,
    actorDisplayName: (actorNameMap && actorNameMap[email]) || '',
    executedAt: String(rowObj['実行日時'] || ''),
    beforeJson: String(rowObj['更新前JSON'] || ''),
    afterJson: String(rowObj['更新後JSON'] || ''),
  };
}

function buildActorDisplayNameMap_(ss, memberMap) {
  var wlRows = getRowsAsObjects_(ss, 'T_管理者Googleホワイトリスト').filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });
  var result = {};
  for (var i = 0; i < wlRows.length; i += 1) {
    var wl = wlRows[i];
    var email = String(wl['Googleメール'] || '').toLowerCase();
    if (!email) continue;
    var memberId = String(wl['紐付け会員ID'] || '');
    var member = memberId ? memberMap[memberId] : null;
    if (member) {
      var fullName = (String(member['姓'] || '') + ' ' + String(member['名'] || '')).trim();
      if (fullName) {
        result[email] = fullName;
        continue;
      }
    }
    result[email] = email;
  }
  return result;
}

function getAnnualFeeAmountMap_(ss) {
  var rows = getRowsAsObjects_(ss, 'M_会員種別');
  var result = {};
  for (var i = 0; i < rows.length; i += 1) {
    var row = rows[i];
    var code = String(row['コード'] || '');
    if (!code) continue;
    result[code] = Number(row['年会費金額'] || 0);
  }
  return result;
}

// v376.67: 会員種別の【単一情報源】。ラベル・年会費既定値・整形関数を
// src/shared/memberTypes.mjs から build 時に注入する（フロントと同一ロジック）。
// 下記マーカー間の stub は build（injectMemberTypesPlaceholders）で実体へ置換される。
// 表示ラベルの最終正本は DB の M_会員種別.名称。memberTypeLabel_(code, overrides) の
// overrides にマスタ由来のラベルを渡すことでマスタが優先される。
// __MEMBER_TYPES_BUILD_INJECT_START__
var MEMBER_TYPE_CODES = [];
var MEMBER_TYPE_LABELS = {};
var MEMBER_TYPE_ANNUAL_FEE_DEFAULTS = {};
function memberTypeLabel_(code, overrides) {
  throw new Error('memberTypeLabel_ is not injected — run build:gas (injectMemberTypesPlaceholders)');
}
function formatAnnualFee_(rawAmount) {
  throw new Error('formatAnnualFee_ is not injected — run build:gas (injectMemberTypesPlaceholders)');
}
// __MEMBER_TYPES_BUILD_INJECT_END__

// v376.64: 会費設定の既定値（金額の既定は MEMBER_TYPE_ANNUAL_FEE_DEFAULTS）
var MEMBERSHIP_FEE_DEFAULTS = {
  publicVisible: true,
  note: '',
};

// 会員種別ごとの年会費を、公開・管理どちらでも同じ形（コード→金額）で返す。
function annualFeesByMemberType_(memberTypes) {
  var result = {};
  memberTypes.forEach(function(t) { result[t.code] = t.annualFee; });
  return result;
}

function resolveAnnualFeeAmount_(memberRow, amountMap, fallbackAmount) {
  var memberType = String((memberRow && memberRow['会員種別コード']) || 'INDIVIDUAL');
  var configured = Number((amountMap && amountMap[memberType]) || 0);
  if (isFinite(configured) && configured > 0) return Math.floor(configured);
  var fallback = Number(fallbackAmount || 0);
  return isFinite(fallback) && fallback > 0 ? Math.floor(fallback) : 0;
}

function getAnnualFeeAdminCacheKey_(year) {
  // v362: kana 列追加 / v364: previousYear 列追加のためキャッシュ key を bump
  return 'annualFeeAdminData:' + DB_SCHEMA_VERSION + ':v364-prev:' + String(year || '');
}

function clearAnnualFeeAdminCache_(year) {
  removeChunkedCache_(CacheService.getScriptCache(), getAnnualFeeAdminCacheKey_(year));
}
