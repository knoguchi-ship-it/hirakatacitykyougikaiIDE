// gas-src/70_officers_claims.gs — 役員・口座・支払い・請求。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

// ============================================================
// v295: 役員管理 — マスタ管理 / 役員割当て / 口座 / 支払い
// ============================================================

// ---------- 役員マスタデータ一括取得 ----------

function getOfficerMasterData_() {
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var orgs = getRowsAsObjects_(ss, 'M_組織マスタ').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var roles = getRowsAsObjects_(ss, 'M_役職マスタ').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var paymentTypes = getRowsAsObjects_(ss, 'M_支払い種別マスタ').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var workCategories = getRowsAsObjects_(ss, 'M_業務分類').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  return { organizations: orgs, roles: roles, paymentTypes: paymentTypes, workCategories: workCategories };
}

// ---------- M_組織マスタ CRUD ----------

function saveOrganization_(payload) {
  var id           = String(payload.organizationCode || '').trim().toUpperCase();
  var name         = String(payload.organizationName || '').trim();
  var type         = String(payload.organizationType || '').trim();
  var displayOrder = Number(payload.displayOrder || 0);
  var allOfficerVisible = toBoolean_(payload.allOfficerVisible);
  if (!id)   throw new Error('組織コードは必須です。');
  if (!name) throw new Error('組織名は必須です。');

  var ss     = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var sheet  = ss.getSheetByName('M_組織マスタ');
  if (!sheet) throw new Error('M_組織マスタ が見つかりません。');
  var found  = findRowByColumnValue_(sheet, '組織コード', id);
  var nowIso = new Date().toISOString();

  if (found) {
    var row = found.row.slice();
    row[found.columns['組織名']]    = name;
    row[found.columns['組織種別']]  = type;
    row[found.columns['表示順']]    = displayOrder;
    if (found.columns['全役員表示フラグ'] != null) row[found.columns['全役員表示フラグ']] = allOfficerVisible;
    row[found.columns['有効フラグ']] = toBoolean_(payload.enabled !== false);
    row[found.columns['更新日時']]  = nowIso;
    sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  } else {
    appendRowsByHeaders_(ss, 'M_組織マスタ', [{
      '組織コード': id, '組織名': name, '組織種別': type,
      '表示順': displayOrder, '全役員表示フラグ': allOfficerVisible, '有効フラグ': true,
      '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso,
    }]);
  }
  invalidateMasterOptionsCache_();
  return { organizationCode: id };
}

function deleteOrganization_(payload) {
  var id = String(payload.organizationCode || '').trim();
  if (!id) throw new Error('組織コードは必須です。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  var roles = getRowsAsObjects_(ss, 'M_役職マスタ').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['組織コード'] || '') === id;
  });
  if (roles.length > 0) throw new Error('この組織に役職が登録されています。先に役職を削除してください。');
  var workCategories = getRowsAsObjects_(ss, 'M_業務分類').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['組織コード'] || '') === id;
  });
  if (workCategories.length > 0) throw new Error('この組織に業務分類が登録されています。先に業務分類を削除してください。');

  var sheet = ss.getSheetByName('M_組織マスタ');
  var found = findRowByColumnValue_(sheet, '組織コード', id);
  if (!found) throw new Error('削除対象の組織が見つかりません。');

  var row = found.row.slice();
  row[found.columns['有効フラグ']] = false;
  row[found.columns['削除フラグ']] = true;
  row[found.columns['更新日時']]   = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  invalidateMasterOptionsCache_();
  return { deleted: true, organizationCode: id };
}

// ---------- M_役職マスタ CRUD ----------

function saveOfficerRole_(payload) {
  var id      = String(payload.roleCode         || '').trim().toUpperCase();
  var name    = String(payload.roleName         || '').trim();
  var orgCode = String(payload.organizationCode || '').trim();
  var isChair = toBoolean_(payload.isChairman);
  var displayOrder = Number(payload.displayOrder || 0);
  if (!id)      throw new Error('役職コードは必須です。');
  if (!name)    throw new Error('役職名は必須です。');
  if (!orgCode) throw new Error('組織コードは必須です。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  var org = findRowByColumnValue_(ss.getSheetByName('M_組織マスタ'), '組織コード', orgCode);
  if (!org || toBoolean_(org.row[org.columns['削除フラグ']])) throw new Error('指定された組織が見つかりません。');

  var sheet  = ss.getSheetByName('M_役職マスタ');
  if (!sheet) throw new Error('M_役職マスタ が見つかりません。');
  var found  = findRowByColumnValue_(sheet, '役職コード', id);
  var nowIso = new Date().toISOString();

  if (found) {
    var row = found.row.slice();
    row[found.columns['役職名']]     = name;
    row[found.columns['組織コード']] = orgCode;
    row[found.columns['委員長フラグ']] = isChair;
    row[found.columns['表示順']]     = displayOrder;
    row[found.columns['有効フラグ']] = toBoolean_(payload.enabled !== false);
    row[found.columns['更新日時']]   = nowIso;
    sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  } else {
    appendRowsByHeaders_(ss, 'M_役職マスタ', [{
      '役職コード': id, '役職名': name, '組織コード': orgCode,
      '委員長フラグ': isChair, '表示順': displayOrder, '有効フラグ': true,
      '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso,
    }]);
  }
  invalidateMasterOptionsCache_();
  return { roleCode: id };
}

function deleteOfficerRole_(payload) {
  var id = String(payload.roleCode || '').trim();
  if (!id) throw new Error('役職コードは必須です。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  var officers = getRowsAsObjects_(ss, 'T_役員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['役職コード'] || '') === id;
  });
  if (officers.length > 0) throw new Error('この役職に役員が登録されています。先に役員割当てを解除してください。');

  var sheet = ss.getSheetByName('M_役職マスタ');
  var found = findRowByColumnValue_(sheet, '役職コード', id);
  if (!found) throw new Error('削除対象の役職が見つかりません。');

  var row = found.row.slice();
  row[found.columns['有効フラグ']] = false;
  row[found.columns['削除フラグ']] = true;
  row[found.columns['更新日時']]   = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  invalidateMasterOptionsCache_();
  return { deleted: true, roleCode: id };
}

// ---------- M_支払い種別マスタ CRUD ----------

function savePaymentType_(payload) {
  var id           = String(payload.typeCode     || '').trim().toUpperCase();
  var name         = String(payload.typeName     || '').trim();
  var scope        = String(payload.scope        || '両方').trim();
  var displayOrder = Number(payload.displayOrder || 0);
  if (!id)   throw new Error('種別コードは必須です。');
  if (!name) throw new Error('種別名は必須です。');

  var ss     = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var sheet  = ss.getSheetByName('M_支払い種別マスタ');
  if (!sheet) throw new Error('M_支払い種別マスタ が見つかりません。');
  var found  = findRowByColumnValue_(sheet, '種別コード', id);
  var nowIso = new Date().toISOString();

  if (found) {
    var row = found.row.slice();
    row[found.columns['種別名']]    = name;
    row[found.columns['対象区分']]  = scope;
    row[found.columns['表示順']]    = displayOrder;
    row[found.columns['有効フラグ']] = toBoolean_(payload.enabled !== false);
    row[found.columns['更新日時']]  = nowIso;
    sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  } else {
    appendRowsByHeaders_(ss, 'M_支払い種別マスタ', [{
      '種別コード': id, '種別名': name, '対象区分': scope,
      '表示順': displayOrder, '有効フラグ': true,
      '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso,
    }]);
  }
  invalidateMasterOptionsCache_();
  return { typeCode: id };
}

function deletePaymentType_(payload) {
  var id = String(payload.typeCode || '').trim();
  if (!id) throw new Error('種別コードは必須です。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  var lines  = getRowsAsObjects_(ss, 'T_支払い明細').filter(function(r) { return !toBoolean_(r['削除フラグ']) && String(r['種別コード'] || '') === id; });
  var claims = getRowsAsObjects_(ss, 'T_請求').filter(function(r) { return !toBoolean_(r['削除フラグ']) && String(r['種別コード'] || '') === id; });
  if (lines.length > 0 || claims.length > 0) throw new Error('この種別は使用中のため削除できません。');

  var sheet = ss.getSheetByName('M_支払い種別マスタ');
  var found = findRowByColumnValue_(sheet, '種別コード', id);
  if (!found) throw new Error('削除対象の支払い種別が見つかりません。');

  var row = found.row.slice();
  row[found.columns['有効フラグ']] = false;
  row[found.columns['削除フラグ']] = true;
  row[found.columns['更新日時']]   = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  invalidateMasterOptionsCache_();
  return { deleted: true, typeCode: id };
}

// ---------- M_業務分類 CRUD ----------

function saveWorkCategory_(payload) {
  var id           = String(payload.categoryCode || '').trim().toUpperCase();
  var name         = String(payload.categoryName || '').trim();
  var orgCode      = String(payload.organizationCode || '').trim();
  var unitPrice    = Number(payload.unitPrice || 0);
  var displayOrder = Number(payload.displayOrder || 0);
  if (!id)      throw new Error('業務分類コードは必須です。');
  if (!name)    throw new Error('業務分類名は必須です。');
  if (!orgCode) throw new Error('組織は必須です。');
  if (unitPrice < 0 || !isFinite(unitPrice)) throw new Error('単価は0円以上の数値で入力してください。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var org = findRowByColumnValue_(ss.getSheetByName('M_組織マスタ'), '組織コード', orgCode);
  if (!org || toBoolean_(org.row[org.columns['削除フラグ']])) throw new Error('指定された組織が見つかりません。');

  var sheet = ss.getSheetByName('M_業務分類');
  if (!sheet) throw new Error('M_業務分類 が見つかりません。');
  var found = findRowByColumnValue_(sheet, '業務分類コード', id);
  var nowIso = new Date().toISOString();

  if (found) {
    var row = found.row.slice();
    row[found.columns['業務分類名']] = name;
    row[found.columns['組織コード']] = orgCode;
    row[found.columns['単価']] = unitPrice;
    row[found.columns['表示順']] = displayOrder;
    row[found.columns['有効フラグ']] = toBoolean_(payload.enabled !== false);
    row[found.columns['更新日時']] = nowIso;
    sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  } else {
    appendRowsByHeaders_(ss, 'M_業務分類', [{
      '業務分類コード': id,
      '業務分類名': name,
      '組織コード': orgCode,
      '単価': unitPrice,
      '表示順': displayOrder,
      '有効フラグ': true,
      '削除フラグ': false,
      '作成日時': nowIso,
      '更新日時': nowIso,
    }]);
  }
  invalidateMasterOptionsCache_();
  return { categoryCode: id };
}

function deleteWorkCategory_(payload) {
  var id = String(payload.categoryCode || '').trim();
  if (!id) throw new Error('業務分類コードは必須です。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  var claims = getRowsAsObjects_(ss, 'T_請求').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['業務分類コード'] || '') === id;
  });
  if (claims.length > 0) throw new Error('この業務分類は請求で使用中のため削除できません。');

  var sheet = ss.getSheetByName('M_業務分類');
  var found = findRowByColumnValue_(sheet, '業務分類コード', id);
  if (!found) throw new Error('削除対象の業務分類が見つかりません。');

  var row = found.row.slice();
  row[found.columns['有効フラグ']] = false;
  row[found.columns['削除フラグ']] = true;
  row[found.columns['更新日時']] = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  invalidateMasterOptionsCache_();
  return { deleted: true, categoryCode: id };
}

// ---------- 役員ステータス確認ヘルパー ----------

// 役員まわりで人物（会員ID か 職員ID）を参照する表。紐づけ変更・人物の統合はこの 4 表をまとめて付け替える。
var OFFICER_PERSON_TABLES_ = ['T_役員', 'T_振込口座', 'T_請求', 'T_支払い'];

// 2026-10-25: 役員まわり（T_役員・T_振込口座・T_請求・T_支払い）の人物の参照を 1 か所で決める。
// 個人・賛助会員は会員ID、事業所職員は職員ID だけで人を指す（XOR）。事業所職員のセッションは会員ID に
// 事業所の会員ID も持つが、人を決めるのは職員ID。以前は約 20 の関数がこの判定を個別に書き、
// 支払いだけ職員を扱えなかった（docs/307 F31）。判定はここを通す（test:officer-person が直書きを落とす）。
function officerPersonRef_(memberId, staffId) {
  var sid = String(staffId || '').trim();
  if (sid) return { memberId: '', staffId: sid };
  return { memberId: String(memberId || '').trim(), staffId: '' };
}

function officerPersonKey_(memberId, staffId) {
  var ref = officerPersonRef_(memberId, staffId);
  if (ref.staffId) return 'staff:' + ref.staffId;
  return ref.memberId ? 'member:' + ref.memberId : '';
}

// 行（会員ID・職員ID 列を持つ）がこの人物のものか
function rowBelongsToOfficerPerson_(row, memberId, staffId) {
  var key = officerPersonKey_(memberId, staffId);
  return !!key && officerPersonKey_(row['会員ID'], row['職員ID']) === key;
}

// シートの見出しでの列の位置（無ければ -1）
function getSheetHeaderIndex_(ss, tableName, header) {
  var sheet = ss.getSheetByName(tableName);
  if (!sheet || sheet.getLastColumn() < 1) return -1;
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].indexOf(header);
}

// findRowByColumnValue_ の結果（row 配列 + columns）がこの人物の請求か
function claimRowBelongsTo_(found, memberId, staffId) {
  var cols = found.columns;
  return rowBelongsToOfficerPerson_({
    '会員ID': cols['会員ID'] != null ? found.row[cols['会員ID']] : '',
    '職員ID': cols['職員ID'] != null ? found.row[cols['職員ID']] : '',
  }, memberId, staffId);
}

// 人物の表示名と所属（会員・職員の行から引く）
function officerPersonDisplay_(ref, memberMap, staffMap) {
  if (ref.staffId) {
    var st = staffMap[ref.staffId] || {};
    var office = memberMap[String(st['会員ID'] || '')] || {};
    return {
      displayName: String(st['氏名'] || (String(st['姓'] || '') + ' ' + String(st['名'] || '')).trim() || ref.staffId),
      officeName: String(office['勤務先名'] || ''),
    };
  }
  var m = memberMap[ref.memberId] || {};
  return {
    displayName: (String(m['姓'] || '') + ' ' + String(m['名'] || '')).trim() || ref.memberId,
    officeName: String(m['勤務先名'] || ''),
  };
}

// v297: memberId（個人/賛助）または staffId（事業所職員）のいずれかでチェック
function isActiveOfficer_(memberId, staffId, ss) {
  var officers = getRowsAsObjects_(ss, 'T_役員').filter(function(r) {
    if (toBoolean_(r['削除フラグ'])) return false;
    if (r['退任日'] && String(r['退任日'] || '') !== '') return false;
    return rowBelongsToOfficerPerson_(r, memberId, staffId);
  });
  return officers.length > 0;
}

// ---------- T_役員 管理 ----------

function getOfficerManagementData_() {
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  var orgs     = getRowsAsObjects_(ss, 'M_組織マスタ').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var roles    = getRowsAsObjects_(ss, 'M_役職マスタ').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var officers = getRowsAsObjects_(ss, 'T_役員').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var members  = getRowsAsObjects_(ss, 'T_会員').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) { return !toBoolean_(r['削除フラグ']); });

  var memberMap = {};
  members.forEach(function(m) { memberMap[String(m['会員ID'] || '')] = m; });
  var staffMap = {};
  staffRows.forEach(function(s) { staffMap[String(s['職員ID'] || '')] = s; });

  var candidates = [];
  members.forEach(function(m) {
    var memberStatus = String(m['会員状態コード'] || 'ACTIVE');
    if (memberStatus !== 'ACTIVE' && memberStatus !== 'WITHDRAWAL_SCHEDULED') return;
    var memberType = String(m['会員種別コード'] || '');
    if (memberType === 'BUSINESS') return;
    var memberIdForCandidate = String(m['会員ID'] || '');
    var memberDisplayName = (String(m['姓'] || '') + ' ' + String(m['名'] || '')).trim() || memberIdForCandidate;
    var memberOfficeName = String(m['勤務先名'] || '');
    candidates.push({
      key: 'member-' + memberIdForCandidate,
      memberId: memberIdForCandidate,
      staffId: '',
      displayName: memberDisplayName,
      officeName: memberOfficeName,
      label: memberDisplayName + '（' + memberIdForCandidate + '）' + (memberOfficeName ? ' ' + memberOfficeName : ''),
    });
  });
  staffRows.forEach(function(s) {
    if (String(s['職員状態コード'] || 'ENROLLED') !== 'ENROLLED') return;
    var staffIdForCandidate = String(s['職員ID'] || '');
    var parentBiz = memberMap[String(s['会員ID'] || '')] || {};
    var staffDisplayName = String(s['氏名'] || (String(s['姓'] || '') + ' ' + String(s['名'] || '')).trim() || staffIdForCandidate);
    var staffOfficeName = String(parentBiz['勤務先名'] || '');
    candidates.push({
      key: 'staff-' + staffIdForCandidate,
      memberId: '',
      staffId: staffIdForCandidate,
      displayName: staffDisplayName,
      officeName: staffOfficeName,
      label: staffDisplayName + '（' + staffOfficeName + '）',
    });
  });

  var enriched = officers.map(function(o) {
    var ref = officerPersonRef_(o['会員ID'], o['職員ID']);
    var shown = officerPersonDisplay_(ref, memberMap, staffMap);
    var memberType = ref.staffId ? 'BUSINESS_STAFF' : String((memberMap[ref.memberId] || {})['会員種別コード'] || '');
    var displayName = shown.displayName;
    var officeName = shown.officeName;

    return {
      役員ID: o['役員ID'],
      会員ID: ref.memberId,
      職員ID: ref.staffId,
      人物キー: officerPersonKey_(ref.memberId, ref.staffId), // 役職を 2 つ持つ人も 1 人として数えるためのキー
      表示名: displayName,
      所属名: officeName,
      会員種別コード: memberType,
      役職コード: o['役職コード'], 組織コード: o['組織コード'],
      就任日: normalizeDateInput_(o['就任日']), 退任日: normalizeDateInput_(o['退任日']), 備考: o['備考'],
      作成日時: o['作成日時'], 更新日時: o['更新日時'],
    };
  });
  return { organizations: orgs, roles: roles, officers: enriched, candidates: candidates };
}

function assignOfficer_(payload) {
  var memberId      = String(payload.memberId      || '').trim();
  var staffId       = String(payload.staffId       || '').trim();
  var roleCode      = String(payload.roleCode      || '').trim();
  var appointedDate = String(payload.appointedDate || '').trim();
  var note          = String(payload.note          || '').trim();

  // XOR バリデーション
  if (!memberId && !staffId) throw new Error('会員IDまたは職員IDのいずれかが必要です。');
  if (memberId && staffId)   throw new Error('会員IDと職員IDは同時に指定できません。');
  if (!roleCode) throw new Error('役職コードは必須です。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  // 存在確認
  if (memberId) {
    var member = findRowByColumnValue_(ss.getSheetByName('T_会員'), '会員ID', memberId);
    if (!member || toBoolean_(member.row[member.columns['削除フラグ']])) throw new Error('対象会員が見つかりません。');
  } else {
    var staffRec = findRowByColumnValue_(ss.getSheetByName('T_事業所職員'), '職員ID', staffId);
    if (!staffRec || toBoolean_(staffRec.row[staffRec.columns['削除フラグ']])) throw new Error('対象職員が見つかりません。');
    if (String(staffRec.row[staffRec.columns['職員状態コード']] || '') === 'LEFT') throw new Error('退職済みの職員は役員に就任できません。');
  }

  var roleSheet = ss.getSheetByName('M_役職マスタ');
  var role = findRowByColumnValue_(roleSheet, '役職コード', roleCode);
  if (!role || toBoolean_(role.row[role.columns['削除フラグ']])) throw new Error('役職が見つかりません。');
  var orgCode = String(role.row[role.columns['組織コード']] || '');

  // 現職二重就任チェック
  var dup = getRowsAsObjects_(ss, 'T_役員').filter(function(r) {
    if (toBoolean_(r['削除フラグ'])) return false;
    if (r['退任日'] && String(r['退任日'] || '') !== '') return false;
    if (String(r['役職コード'] || '') !== roleCode) return false;
    return rowBelongsToOfficerPerson_(r, memberId, staffId);
  });
  if (dup.length > 0) throw new Error('すでに同じ役職に就任中です。');

  var nowIso = new Date().toISOString();
  var officerId = Utilities.getUuid();
  appendRowsByHeaders_(ss, 'T_役員', [{
    '役員ID': officerId, '会員ID': memberId, '職員ID': staffId,
    '役職コード': roleCode, '組織コード': orgCode,
    '就任日': appointedDate, '退任日': '', '備考': note,
    '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso,
  }]);
  clearAllDataCache_();
  return { officerId: officerId };
}

function resignOfficer_(payload) {
  var officerId       = String(payload.officerId       || '').trim();
  var resignationDate = String(payload.resignationDate || '').trim();
  if (!officerId) throw new Error('役員IDは必須です。');

  var ss    = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var sheet = ss.getSheetByName('T_役員');
  var found = findRowByColumnValue_(sheet, '役員ID', officerId);
  if (!found || toBoolean_(found.row[found.columns['削除フラグ']])) throw new Error('役員レコードが見つかりません。');

  var row = found.row.slice();
  row[found.columns['退任日']]  = resignationDate || new Date().toISOString().substring(0, 10);
  row[found.columns['更新日時']] = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  clearAllDataCache_();
  return { resigned: true, officerId: officerId };
}

function updateOfficerRecord_(payload) {
  var officerId = String(payload.officerId || '').trim();
  if (!officerId) throw new Error('役員IDは必須です。');

  var roleCode = String(payload.roleCode || '').trim();
  var appointedDate = String(payload.appointedDate || '').trim();
  var resignationDate = String(payload.resignationDate || '').trim();
  var note = String(payload.note || '').trim();

  function assertDateString_(value, label, allowBlank) {
    if (!value) {
      if (allowBlank) return;
      throw new Error(label + 'は必須です。');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || isNaN(new Date(value + 'T00:00:00+09:00').getTime())) {
      throw new Error(label + 'は YYYY-MM-DD 形式で指定してください。');
    }
  }

  assertDateString_(appointedDate, '就任日', true);
  assertDateString_(resignationDate, '退任日', true);
  if (appointedDate && resignationDate && resignationDate < appointedDate) {
    throw new Error('退任日は就任日以降の日付を指定してください。');
  }

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var sheet = ss.getSheetByName('T_役員');
  var found = findRowByColumnValue_(sheet, '役員ID', officerId);
  if (!found || toBoolean_(found.row[found.columns['削除フラグ']])) throw new Error('役員レコードが見つかりません。');

  var row = found.row.slice();
  if (roleCode) {
    var roleSheet = ss.getSheetByName('M_役職マスタ');
    var role = findRowByColumnValue_(roleSheet, '役職コード', roleCode);
    if (!role || toBoolean_(role.row[role.columns['削除フラグ']])) throw new Error('役職が見つかりません。');
    row[found.columns['役職コード']] = roleCode;
    row[found.columns['組織コード']] = String(role.row[role.columns['組織コード']] || '');
  }
  var nextRoleCode = String(row[found.columns['役職コード']] || '');
  var nextMemberId = String(row[found.columns['会員ID']] || '');
  var nextStaffId = String(row[found.columns['職員ID']] || '');
  if (!resignationDate) {
    var activeDup = getRowsAsObjects_(ss, 'T_役員').filter(function(r) {
      if (toBoolean_(r['削除フラグ'])) return false;
      if (String(r['役員ID'] || '') === officerId) return false;
      if (String(r['役職コード'] || '') !== nextRoleCode) return false;
      if (String(r['退任日'] || '')) return false;
      return rowBelongsToOfficerPerson_(r, nextMemberId, nextStaffId);
    });
    if (activeDup.length > 0) throw new Error('同じ担当者が同じ役職で現職になっているレコードが既にあります。');
  }
  if (found.columns['就任日'] != null) row[found.columns['就任日']] = appointedDate;
  if (found.columns['退任日'] != null) row[found.columns['退任日']] = resignationDate;
  if (found.columns['備考'] != null) row[found.columns['備考']] = note;
  row[found.columns['更新日時']] = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  clearAllDataCache_();
  return { updated: true, officerId: officerId };
}

// ---------- T_振込口座 管理 ----------

function getBankAccount_(payload) {
  var memberId = String(payload.memberId || '').trim();
  var staffId  = String(payload.staffId  || '').trim();
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var rows = getRowsAsObjects_(ss, 'T_振込口座').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && rowBelongsToOfficerPerson_(r, memberId, staffId);
  });
  return rows.length > 0 ? rows[0] : null;
}

function saveBankAccount_(payload) {
  var memberId = String(payload.memberId || '').trim();
  var staffId  = String(payload.staffId  || '').trim();
  if (!memberId && !staffId) throw new Error('会員IDまたは職員IDが必要です。');
  // 画面（OfficerManagement）と同じ形を確かめる。画面の検査だけを防御にしない（AGENTS §6）
  if (!/^\d{4}$/.test(String(payload.bankCode || '').trim())) throw new Error('金融機関コードは4桁の数字で入力してください。');
  if (!/^\d{3}$/.test(String(payload.branchCode || '').trim())) throw new Error('支店コードは3桁の数字で入力してください。');
  if (!/^\d{1,7}$/.test(String(payload.accountNumber || '').trim())) throw new Error('口座番号は1〜7桁の数字で入力してください。');

  var ss    = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var sheet = ss.getSheetByName('T_振込口座');
  if (!sheet) throw new Error('T_振込口座 が見つかりません。');

  var existing = getRowsAsObjects_(ss, 'T_振込口座');
  var found = null;
  for (var i = 0; i < existing.length; i += 1) {
    if (toBoolean_(existing[i]['削除フラグ'])) continue;
    if (rowBelongsToOfficerPerson_(existing[i], memberId, staffId)) { found = findRowByColumnValue_(sheet, '口座ID', existing[i]['口座ID']); break; }
  }
  var person = officerPersonRef_(memberId, staffId);

  var nowIso    = new Date().toISOString();
  var accountId = found ? String(found.row[found.columns['口座ID']] || '') : Utilities.getUuid();
  var newData   = {
    '口座ID': accountId, '会員ID': person.memberId, '職員ID': person.staffId,
    '金融機関名':   String(payload.bankName          || '').trim(),
    '金融機関コード': String(payload.bankCode        || '').trim(),
    '支店名':       String(payload.branchName        || '').trim(),
    '支店コード':   String(payload.branchCode        || '').trim(),
    '口座種別':     String(payload.accountType       || '普通').trim(),
    '口座番号':     String(payload.accountNumber     || '').trim(),
    '口座名義カナ': String(payload.accountHolderKana || '').trim(),
    '備考':         String(payload.note              || '').trim(),
    '削除フラグ': false,
    '作成日時': found ? String(found.row[found.columns['作成日時']] || nowIso) : nowIso,
    '更新日時': nowIso,
  };

  if (found) {
    var row = found.row.slice();
    var cols = found.columns;
    Object.keys(newData).forEach(function(key) { if (cols[key] != null) row[cols[key]] = newData[key]; });
    sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  } else {
    appendRowsByHeaders_(ss, 'T_振込口座', [newData]);
  }
  return { accountId: accountId };
}

function deleteBankAccount_(payload) {
  var memberId = String(payload.memberId || '').trim();
  var staffId  = String(payload.staffId  || '').trim();

  var ss    = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var sheet = ss.getSheetByName('T_振込口座');
  var rows  = getRowsAsObjects_(ss, 'T_振込口座');
  var found = null;
  if (!officerPersonKey_(memberId, staffId)) throw new Error('会員IDまたは職員IDが必要です。');
  for (var i = 0; i < rows.length; i += 1) {
    if (toBoolean_(rows[i]['削除フラグ'])) continue;
    if (rowBelongsToOfficerPerson_(rows[i], memberId, staffId)) { found = findRowByColumnValue_(sheet, '口座ID', rows[i]['口座ID']); break; }
  }
  if (!found) throw new Error('口座情報が見つかりません。');

  var row = found.row.slice();
  row[found.columns['削除フラグ']] = true;
  row[found.columns['更新日時']]   = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  return { deleted: true };
}

// 会員自身の役員ステータス + 口座取得（会員ポータル用）
// processApiRequest で sessionToken 検証済み → memberId・staffId が確定済み
function getMemberOfficerStatus_(payload) {
  var memberId = String(payload.memberId || '').trim();
  var staffId  = String(payload.staffId  || '').trim();
  if (!memberId && !staffId) throw new Error('セッション情報が無効です。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var isOfficer  = isActiveOfficer_(memberId, staffId, ss);
  var activeRoles = [];

  if (isOfficer) {
    var officers = getRowsAsObjects_(ss, 'T_役員').filter(function(r) {
      if (toBoolean_(r['削除フラグ'])) return false;
      if (r['退任日'] && String(r['退任日'] || '') !== '') return false;
      return rowBelongsToOfficerPerson_(r, memberId, staffId);
    });
    var roleMap = {};
    getRowsAsObjects_(ss, 'M_役職マスタ').forEach(function(r) { roleMap[String(r['役職コード'] || '')] = r; });
    var orgMap = {};
    getRowsAsObjects_(ss, 'M_組織マスタ').forEach(function(o) { orgMap[String(o['組織コード'] || '')] = o; });

    activeRoles = officers.map(function(o) {
      var role = roleMap[String(o['役職コード'] || '')] || {};
      var org  = orgMap[String(o['組織コード']  || '')] || {};
      return {
        officerId:        o['役員ID'],
        roleCode:         o['役職コード'],
        roleName:         String(role['役職名'] || ''),
        organizationCode: o['組織コード'],
        organizationName: String(org['組織名']  || ''),
        appointedDate:    o['就任日'],
      };
    });
  }

  var bankAccount = isOfficer ? getBankAccount_(officerPersonRef_(memberId, staffId)) : null;
  return { isOfficer: isOfficer, activeRoles: activeRoles, bankAccount: bankAccount };
}

function getOfficerSelectableOrganizationCodes_(memberId, staffId, ss) {
  var codes = {};
  getRowsAsObjects_(ss, 'T_役員').forEach(function(r) {
    if (toBoolean_(r['削除フラグ'])) return;
    if (r['退任日'] && String(r['退任日'] || '') !== '') return;
    if (rowBelongsToOfficerPerson_(r, memberId, staffId) && r['組織コード']) codes[String(r['組織コード'])] = true;
  });
  getRowsAsObjects_(ss, 'M_組織マスタ').forEach(function(o) {
    if (toBoolean_(o['削除フラグ']) || !toBoolean_(o['有効フラグ'])) return;
    if (toBoolean_(o['全役員表示フラグ'])) codes[String(o['組織コード'])] = true;
  });
  return codes;
}

function normalizeClaimRecord_(record) {
  var out = Object.assign({}, record);
  if (!String(out['請求種別'] || '').trim()) out['請求種別'] = 'EXPENSE_CLAIM';
  if (!String(out['数量'] || '').trim()) out['数量'] = 1;
  if (!String(out['単価'] || '').trim()) out['単価'] = Number(out['請求金額'] || 0);
  if (!String(out['業務分類コード'] || '').trim()) out['業務分類コード'] = '';
  return out;
}

function saveMemberBankAccount_(payload) {
  var memberId = String(payload.memberId || '').trim();
  var staffId  = String(payload.staffId  || '').trim();
  if (!memberId && !staffId) throw new Error('セッション情報が無効です。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  if (!isActiveOfficer_(memberId, staffId, ss)) throw new Error('役員のみ口座情報を登録できます。');
  return saveBankAccount_(Object.assign({}, payload, officerPersonRef_(memberId, staffId)));
}

// ---------- T_支払い / T_支払い明細 / T_請求 管理 ----------

function getPaymentHistory_(payload) {
  var ss       = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var filterPersonKey = payload ? officerPersonKey_(payload.memberId, payload.staffId) : '';

  var payments = getRowsAsObjects_(ss, 'T_支払い').filter(function(r) {
    if (toBoolean_(r['削除フラグ'])) return false;
    if (filterPersonKey && officerPersonKey_(r['会員ID'], r['職員ID']) !== filterPersonKey) return false;
    return true;
  });
  var lines = getRowsAsObjects_(ss, 'T_支払い明細').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var lineMap = {};
  lines.forEach(function(l) {
    var pid = String(l['支払いID'] || '');
    if (!lineMap[pid]) lineMap[pid] = [];
    lineMap[pid].push(l);
  });

  var memberMap = {};
  getRowsAsObjects_(ss, 'T_会員').forEach(function(m) { memberMap[String(m['会員ID'] || '')] = m; });
  var staffMap = {};
  getRowsAsObjects_(ss, 'T_事業所職員').forEach(function(st) { staffMap[String(st['職員ID'] || '')] = st; });

  return payments.map(function(p) {
    var ref = officerPersonRef_(p['会員ID'], p['職員ID']);
    var shown = officerPersonDisplay_(ref, memberMap, staffMap);
    var displayName = shown.displayName + (ref.staffId && shown.officeName ? '（' + shown.officeName + '）' : '');
    return Object.assign({}, p, { 職員ID: ref.staffId, 表示名: displayName, 明細: lineMap[String(p['支払いID'] || '')] || [] });
  });
}

function savePayment_(payload) {
  // 2026-10-25: 受取人は役員本人（operator 決定）。事業所職員の役員は職員ID で受け取る。
  // 以前は会員ID しか持てず、職員の役員（本番の現役役員の多く）に支払いを記録できなかった（docs/307 F31）。
  var payee = officerPersonRef_(payload.memberId, payload.staffId);
  if (!payee.memberId && !payee.staffId) throw new Error('受取人（役員）は必須です。');

  var lines = payload.lines || [];
  if (!lines.length) throw new Error('支払い明細は1件以上必要です。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  if (payee.staffId) {
    var staffRec = findRowByColumnValue_(ss.getSheetByName('T_事業所職員'), '職員ID', payee.staffId);
    if (!staffRec || toBoolean_(staffRec.row[staffRec.columns['削除フラグ']])) throw new Error('対象職員が見つかりません。');
  } else {
    var member = findRowByColumnValue_(ss.getSheetByName('T_会員'), '会員ID', payee.memberId);
    if (!member || toBoolean_(member.row[member.columns['削除フラグ']])) throw new Error('対象会員が見つかりません。');
  }
  // 職員ID を持たない古い表へ書くと、職員ID が黙って落ちて受取人の無い支払いになる
  if (payee.staffId && getSheetHeaderIndex_(ss, 'T_支払い', '職員ID') < 0) {
    throw new Error('T_支払い に「職員ID」の列がありません。スキーマ整備の完了後に登録してください。');
  }

  var lineTotal = lines.reduce(function(sum, l) { return sum + Number(l.amount || 0); }, 0);
  if (Number(payload.totalAmount || 0) !== lineTotal) {
    throw new Error('合計金額（' + payload.totalAmount + '）と明細合計（' + lineTotal + '）が一致しません。');
  }

  var bankAccount  = getBankAccount_(payee);
  var bankSnapshot = bankAccount ? JSON.stringify({
    金融機関名: bankAccount['金融機関名'], 金融機関コード: bankAccount['金融機関コード'],
    支店名: bankAccount['支店名'], 支店コード: bankAccount['支店コード'],
    口座種別: bankAccount['口座種別'], 口座番号: bankAccount['口座番号'],
    口座名義カナ: bankAccount['口座名義カナ'],
  }) : '';

  var nowIso     = new Date().toISOString();
  var paymentId  = Utilities.getUuid();
  var actorEmail = String(Session.getActiveUser().getEmail() || '').toLowerCase();

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    appendRowsByHeaders_(ss, 'T_支払い', [{
      '支払いID': paymentId, '会員ID': payee.memberId, '職員ID': payee.staffId,
      '支払い日':   String(payload.paymentDate   || '').trim(),
      '支払い方法': String(payload.paymentMethod || '振込').trim(),
      '合計金額':   lineTotal,
      '振込先口座JSON': bankSnapshot,
      '登録者メール': actorEmail,
      '備考': String(payload.note || '').trim(),
      '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso,
    }]);

    var claimsToUpdate = [];
    lines.forEach(function(l) {
      var claimId = String(l.claimId || '').trim();
      appendRowsByHeaders_(ss, 'T_支払い明細', [{
        '明細ID': Utilities.getUuid(), '支払いID': paymentId, '請求ID': claimId,
        '役職コード':   String(l.roleCode         || '').trim(),
        '組織コード':   String(l.organizationCode  || '').trim(),
        '種別コード':   String(l.typeCode          || '').trim(),
        '金額':         Number(l.amount            || 0),
        '対象期間FROM': String(l.periodFrom        || '').trim(),
        '対象期間TO':   String(l.periodTo          || '').trim(),
        '摘要':         String(l.note             || '').trim(),
        '削除フラグ': false, '作成日時': nowIso, '更新日時': nowIso,
      }]);
      if (claimId) claimsToUpdate.push(claimId);
    });

    if (claimsToUpdate.length > 0) {
      var claimSheet = ss.getSheetByName('T_請求');
      if (claimSheet) {
        claimsToUpdate.forEach(function(claimId) {
          var cf = findRowByColumnValue_(claimSheet, '請求ID', claimId);
          if (cf && !toBoolean_(cf.row[cf.columns['削除フラグ']])) {
            var cr = cf.row.slice();
            cr[cf.columns['請求状態']] = '支払い済み';
            cr[cf.columns['更新日時']] = nowIso;
            claimSheet.getRange(cf.rowNumber, 1, 1, cr.length).setValues([cr]);
          }
        });
      }
    }

    clearAllDataCache_();
    return { paymentId: paymentId, totalAmount: lineTotal };
  } finally {
    lock.releaseLock();
  }
}

function deletePayment_(payload) {
  var paymentId = String(payload.paymentId || '').trim();
  if (!paymentId) throw new Error('支払いIDは必須です。');

  var ss     = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var nowIso = new Date().toISOString();

  var paymentSheet = ss.getSheetByName('T_支払い');
  var pFound = findRowByColumnValue_(paymentSheet, '支払いID', paymentId);
  if (!pFound || toBoolean_(pFound.row[pFound.columns['削除フラグ']])) throw new Error('支払いレコードが見つかりません。');

  var pRow = pFound.row.slice();
  pRow[pFound.columns['削除フラグ']] = true;
  pRow[pFound.columns['更新日時']]   = nowIso;
  paymentSheet.getRange(pFound.rowNumber, 1, 1, pRow.length).setValues([pRow]);

  var lineSheet  = ss.getSheetByName('T_支払い明細');
  var claimSheet = ss.getSheetByName('T_請求');
  if (lineSheet) {
    var lines = getRowsAsObjects_(ss, 'T_支払い明細').filter(function(r) {
      return !toBoolean_(r['削除フラグ']) && String(r['支払いID'] || '') === paymentId;
    });
    lines.forEach(function(l) {
      var lf = findRowByColumnValue_(lineSheet, '明細ID', l['明細ID']);
      if (lf) {
        var lr = lf.row.slice();
        lr[lf.columns['削除フラグ']] = true;
        lr[lf.columns['更新日時']]   = nowIso;
        lineSheet.getRange(lf.rowNumber, 1, 1, lr.length).setValues([lr]);
      }
      var claimId = String(l['請求ID'] || '');
      if (claimId && claimSheet) {
        var cf = findRowByColumnValue_(claimSheet, '請求ID', claimId);
        if (cf && !toBoolean_(cf.row[cf.columns['削除フラグ']])) {
          var cr = cf.row.slice();
          cr[cf.columns['請求状態']] = '承認済み';
          cr[cf.columns['更新日時']] = nowIso;
          claimSheet.getRange(cf.rowNumber, 1, 1, cr.length).setValues([cr]);
        }
      }
    });
  }

  clearAllDataCache_();
  return { deleted: true, paymentId: paymentId };
}

// ============================================================
// v296: 請求管理 — Drive フォルダ / 請求 CRUD / ファイル管理
// ============================================================

var CLAIM_ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png'];
var CLAIM_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// ---------- Drive フォルダ ----------

function getOrCreateClaimAttachmentFolder_(ss) {
  var storedId = ss ? getSystemSettingValue_(ss, 'CLAIM_ATTACHMENT_FOLDER_ID') : '';
  if (storedId && String(storedId).trim()) {
    try { return DriveApp.getFolderById(String(storedId).trim()); } catch (e) {
      Logger.log('getOrCreateClaimAttachmentFolder_: stored ID invalid, recreating. ' + e.message);
    }
  }
  var newFolder = DriveApp.getRootFolder().createFolder('請求添付ファイル');
  newFolder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  var newFolderId = newFolder.getId();
  PropertiesService.getScriptProperties().setProperty('CLAIM_ATTACHMENT_FOLDER_ID', newFolderId);
  try {
    batchUpsertSystemSettings_(ss, [{ key: 'CLAIM_ATTACHMENT_FOLDER_ID', value: newFolderId, description: '請求添付ファイル保存先 Google Drive フォルダ ID' }]);
  } catch (e) { Logger.log('getOrCreateClaimAttachmentFolder_: batchUpsert failed: ' + e.message); }
  Logger.log('getOrCreateClaimAttachmentFolder_: created ' + newFolderId);
  return newFolder;
}

// ---------- 請求 CRUD ----------

function saveClaim_(payload) {
  var memberId = String((payload.__memberSession && payload.__memberSession.memberId) ? payload.__memberSession.memberId : (payload.memberId || '')).trim();
  var staffId  = String((payload.__memberSession && payload.__memberSession.staffId)  ? payload.__memberSession.staffId  : (payload.staffId  || '')).trim();
  if (!memberId && !staffId) throw new Error('セッション情報が無効です。');

  var claimId  = String(payload.claimId  || '').trim();
  var claimType = String(payload.claimType || payload['請求種別'] || 'EXPENSE_CLAIM').trim();
  if (claimType !== 'ACTIVITY_REPORT' && claimType !== 'EXPENSE_CLAIM') claimType = 'EXPENSE_CLAIM';
  var roleCode = String(payload.roleCode || '').trim();
  var orgCode  = String(payload.organizationCode || '').trim();
  var typeCode = String(payload.typeCode || '').trim();
  var categoryCode = String(payload.workCategoryCode || payload.categoryCode || '').trim();
  var amount   = Number(payload.amount   || 0);
  var unitPrice = Number(payload.unitPrice || 0);
  var quantity = 1;
  var actDate  = String(payload.activityDate        || '').trim();
  var actDesc  = String(payload.activityDescription || '').trim();
  var attachmentsJson = payload.attachmentsJson ? JSON.stringify(payload.attachmentsJson) : '';
  var attachmentCount = 0;
  if (payload.attachmentsJson && Array.isArray(payload.attachmentsJson)) attachmentCount = payload.attachmentsJson.length;

  if (!orgCode)              throw new Error('活動部（組織）は必須です。');
  if (!actDate)              throw new Error('活動日は必須です。');
  if (claimType === 'EXPENSE_CLAIM') {
    if (amount <= 0) throw new Error('請求金額は1円以上を入力してください。');
    if (!actDesc || actDesc.length < 5) throw new Error('請求内容は5文字以上入力してください。');
    if (attachmentCount <= 0) throw new Error('経費請求には領収書等の添付ファイルが必要です。');
  }

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  // 役員チェック
  if (!isActiveOfficer_(memberId, staffId, ss)) throw new Error('役員のみ請求を提出できます。');
  var selectableOrgs = getOfficerSelectableOrganizationCodes_(memberId, staffId, ss);
  if (!selectableOrgs[orgCode]) throw new Error('選択できない活動部です。');

  // 2026-10-02: 役職コードを payload のまま T_請求 へ書いていた（docs/294 §2-6）。
  if (roleCode && !isKnownMasterCode_(ss, 'M_役職マスタ', roleCode)) {
    throw new Error('指定された役職が見つかりません。');
  }

  // 2026-10-02: 添付は件数しか見ておらず、アップロード済みのファイルに対応しているか
  // 確かめていなかった（docs/294 §2-5）。BR-09 は「保存時にサーバー側でも添付の有無を
  // 検証する」と定めており、件数だけでは成立しない。実体を引けるかどうかで判定する。
  if (claimType === 'EXPENSE_CLAIM') {
    var declared = (payload.attachmentsJson && Array.isArray(payload.attachmentsJson))
      ? payload.attachmentsJson : [];
    // 2026-10-13: 存在するかだけでなく、請求の添付フォルダにあるファイルかを確かめる。
    // 以前は画面から送られた任意の fileId（他人の領収書・無関係なファイル）を付けられた。
    var claimFolderId = declared.length > 0 ? getOrCreateClaimAttachmentFolder_(getOrCreateDatabase_()).getId() : '';
    var verifiedAttachments = [];
    for (var ai = 0; ai < declared.length; ai += 1) {
      var fileId = String((declared[ai] && declared[ai].fileId) || '').trim();
      if (!fileId) throw new Error('添付ファイルの情報が不正です。アップロードし直してください。');
      var inClaimFolder = false;
      var claimFile = null;
      try {
        claimFile = DriveApp.getFileById(fileId);
        var parents = claimFile.getParents();
        while (parents.hasNext()) { if (parents.next().getId() === claimFolderId) { inClaimFolder = true; break; } }
      } catch (attachErr) {
        throw new Error('添付ファイルが見つかりません。アップロードし直してください。');
      }
      if (!inClaimFolder) throw new Error('添付ファイルが見つかりません。アップロードし直してください。');
      // URL・形式は画面の値ではなく Drive の実体から取る（任意の URL を保存させない）
      verifiedAttachments.push({
        name: String(declared[ai].name || claimFile.getName()),
        url: claimFile.getUrl(),
        fileId: fileId,
        mimeType: claimFile.getMimeType(),
        uploadedAt: String(declared[ai].uploadedAt || ''),
      });
    }
    attachmentsJson = verifiedAttachments.length > 0 ? JSON.stringify(verifiedAttachments) : '';
  }

  if (claimType === 'ACTIVITY_REPORT') {
    if (!categoryCode) throw new Error('業務分類は必須です。');
    var category = findRowByColumnValue_(ss.getSheetByName('M_業務分類'), '業務分類コード', categoryCode);
    if (!category || toBoolean_(category.row[category.columns['削除フラグ']]) || !toBoolean_(category.row[category.columns['有効フラグ']])) {
      throw new Error('指定された業務分類が見つかりません。');
    }
    var categoryOrg = String(category.row[category.columns['組織コード']] || '');
    if (categoryOrg !== orgCode) throw new Error('活動部と業務分類の組み合わせが正しくありません。');
    unitPrice = Number(category.row[category.columns['単価']] || 0);
    amount = unitPrice;
    typeCode = '';
    actDesc = String(category.row[category.columns['業務分類名']] || '');
    attachmentsJson = '';
  } else {
    unitPrice = amount;
    categoryCode = '';
  }

  var sheet = ss.getSheetByName('T_請求');
  if (!sheet) throw new Error('T_請求 が見つかりません。');
  var nowIso = new Date().toISOString();

  if (claimId) {
    // 更新（申請中のみ可）
    var found = findRowByColumnValue_(sheet, '請求ID', claimId);
    if (!found || toBoolean_(found.row[found.columns['削除フラグ']])) throw new Error('請求が見つかりません。');
    // 所有者チェック（会員IDまたは職員IDで照合）
    if (!claimRowBelongsTo_(found, memberId, staffId)) throw new Error('他の会員の請求は編集できません。');
    var status = String(found.row[found.columns['請求状態']] || '');
    if (status !== '申請中') throw new Error('申請中以外の請求は編集できません。');

    var row = found.row.slice();
    row[found.columns['役職コード']]  = roleCode;
    row[found.columns['組織コード']]  = orgCode;
    row[found.columns['種別コード']]  = typeCode;
    if (found.columns['請求種別'] != null) row[found.columns['請求種別']] = claimType;
    if (found.columns['業務分類コード'] != null) row[found.columns['業務分類コード']] = categoryCode;
    if (found.columns['単価'] != null) row[found.columns['単価']] = unitPrice;
    if (found.columns['数量'] != null) row[found.columns['数量']] = quantity;
    row[found.columns['請求金額']]    = amount;
    row[found.columns['活動日']]      = actDate;
    row[found.columns['活動内容']]    = actDesc;
    if (attachmentsJson) row[found.columns['添付ファイルURL']] = attachmentsJson;
    row[found.columns['更新日時']]    = nowIso;
    sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  } else {
    // 新規作成
    claimId = Utilities.getUuid();
    appendRowsByHeaders_(ss, 'T_請求', [{
      '請求ID':       claimId,
      '会員ID':       officerPersonRef_(memberId, staffId).memberId,
      '職員ID':       officerPersonRef_(memberId, staffId).staffId,
      '役職コード':   roleCode,
      '組織コード':   orgCode,
      '種別コード':   typeCode,
      '請求種別':     claimType,
      '業務分類コード': categoryCode,
      '単価':         unitPrice,
      '数量':         quantity,
      '請求金額':     amount,
      '活動日':       actDate,
      '活動内容':     actDesc,
      '添付ファイルURL': attachmentsJson,
      '請求状態':     '申請中',
      '却下理由':     '',
      '承認者メール': '',
      '承認日時':     '',
      '削除フラグ':   false,
      '作成日時':     nowIso,
      '更新日時':     nowIso,
    }]);
  }
  clearAllDataCache_();
  return { claimId: claimId };
}

function getMyClaims_(payload) {
  var memberId = String((payload.__memberSession && payload.__memberSession.memberId) ? payload.__memberSession.memberId : '').trim();
  var staffId  = String((payload.__memberSession && payload.__memberSession.staffId)  ? payload.__memberSession.staffId  : '').trim();
  if (!memberId && !staffId) throw new Error('セッション情報が無効です。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  var claims = getRowsAsObjects_(ss, 'T_請求').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && rowBelongsToOfficerPerson_(r, memberId, staffId);
  });
  return claims.map(normalizeClaimRecord_).sort(function(a, b) { return (b['作成日時'] || '').localeCompare(a['作成日時'] || ''); });
}

function getClaims_(payload) {
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  var filterStatus   = payload && payload.status   ? String(payload.status).trim()   : '';
  // 2026-10-25: 以前は会員ID だけで絞り込み、職員の役員の請求は絞り込めなかった
  var filterPersonKey = payload ? officerPersonKey_(payload.memberId, payload.staffId) : '';

  var claims = getRowsAsObjects_(ss, 'T_請求').filter(function(r) {
    if (toBoolean_(r['削除フラグ'])) return false;
    if (filterStatus   && String(r['請求状態'] || '') !== filterStatus)   return false;
    if (filterPersonKey && officerPersonKey_(r['会員ID'], r['職員ID']) !== filterPersonKey) return false;
    return true;
  });

  var memberMap = {};
  getRowsAsObjects_(ss, 'T_会員').forEach(function(m) { memberMap[String(m['会員ID'] || '')] = m; });

  // 2026-10-13: 職員の役員が出した請求は会員IDが空で、請求者名が空欄になっていた。職員から名前を引く。
  var staffMap = {};
  getRowsAsObjects_(ss, 'T_事業所職員').forEach(function(st) { staffMap[String(st['職員ID'] || '')] = st; });

  return claims.map(function(c) {
    c = normalizeClaimRecord_(c);
    var ref = officerPersonRef_(c['会員ID'], c['職員ID']);
    var shown = officerPersonDisplay_(ref, memberMap, staffMap);
    var displayName = shown.displayName + (ref.staffId && shown.officeName ? '（' + shown.officeName + '）' : '');
    return Object.assign({}, c, { 表示名: displayName });
  }).sort(function(a, b) { return (b['作成日時'] || '').localeCompare(a['作成日時'] || ''); });
}

function approveClaim_(payload) {
  var claimId = String(payload.claimId || '').trim();
  if (!claimId) throw new Error('請求IDは必須です。');

  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_請求');
  var found = findRowByColumnValue_(sheet, '請求ID', claimId);
  if (!found || toBoolean_(found.row[found.columns['削除フラグ']])) throw new Error('請求が見つかりません。');
  if (String(found.row[found.columns['請求状態']] || '') === '支払い済み') throw new Error('支払い済みの請求は状態を変更できません。');

  var nowIso = new Date().toISOString();
  var row = found.row.slice();
  row[found.columns['請求状態']]    = '承認済み';
  row[found.columns['承認者メール']] = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  row[found.columns['承認日時']]     = nowIso;
  row[found.columns['却下理由']]     = '';
  row[found.columns['更新日時']]     = nowIso;
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  clearAllDataCache_();
  return { approved: true, claimId: claimId };
}

function rejectClaim_(payload) {
  var claimId = String(payload.claimId || '').trim();
  var reason  = String(payload.reason  || '').trim();
  if (!claimId)         throw new Error('請求IDは必須です。');
  if (reason.length < 5) throw new Error('却下理由は5文字以上入力してください。');

  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_請求');
  var found = findRowByColumnValue_(sheet, '請求ID', claimId);
  if (!found || toBoolean_(found.row[found.columns['削除フラグ']])) throw new Error('請求が見つかりません。');
  if (String(found.row[found.columns['請求状態']] || '') === '支払い済み') throw new Error('支払い済みの請求は却下できません。');

  var nowIso = new Date().toISOString();
  var row = found.row.slice();
  row[found.columns['請求状態']]    = '却下';
  row[found.columns['却下理由']]    = reason;
  row[found.columns['承認者メール']] = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  row[found.columns['承認日時']]    = nowIso;
  row[found.columns['更新日時']]    = nowIso;
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  clearAllDataCache_();
  return { rejected: true, claimId: claimId };
}

function deleteMyClaim_(payload) {
  var memberId = String((payload.__memberSession && payload.__memberSession.memberId) ? payload.__memberSession.memberId : '').trim();
  var staffId  = String((payload.__memberSession && payload.__memberSession.staffId)  ? payload.__memberSession.staffId  : '').trim();
  var claimId  = String(payload.claimId || '').trim();
  if (!memberId && !staffId) throw new Error('セッション情報が無効です。');
  if (!claimId)  throw new Error('請求IDは必須です。');

  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_請求');
  var found = findRowByColumnValue_(sheet, '請求ID', claimId);
  if (!found || toBoolean_(found.row[found.columns['削除フラグ']])) throw new Error('請求が見つかりません。');
  if (!claimRowBelongsTo_(found, memberId, staffId)) throw new Error('他の会員の請求は削除できません。');
  if (String(found.row[found.columns['請求状態']] || '') !== '申請中') throw new Error('申請中の請求のみ取り下げできます。');

  var row = found.row.slice();
  row[found.columns['削除フラグ']] = true;
  row[found.columns['更新日時']]   = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  clearAllDataCache_();
  return { deleted: true, claimId: claimId };
}

function adminDeleteClaim_(payload) {
  var claimId = String(payload.claimId || '').trim();
  if (!claimId) throw new Error('請求IDは必須です。');

  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_請求');
  var found = findRowByColumnValue_(sheet, '請求ID', claimId);
  if (!found || toBoolean_(found.row[found.columns['削除フラグ']])) throw new Error('請求が見つかりません。');

  var row = found.row.slice();
  row[found.columns['削除フラグ']] = true;
  row[found.columns['更新日時']]   = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  clearAllDataCache_();
  return { deleted: true, claimId: claimId };
}

// ---------- 添付ファイル管理 ----------

function uploadClaimAttachment_(payload) {
  var memberId = String((payload.__memberSession && payload.__memberSession.memberId) ? payload.__memberSession.memberId : '').trim();
  var staffId  = String((payload.__memberSession && payload.__memberSession.staffId)  ? payload.__memberSession.staffId  : '').trim();
  var claimId  = String(payload.claimId  || '').trim();
  var base64   = String(payload.base64   || '').replace(/^data:[^;]+;base64,/, '');
  var filename = String(payload.filename || 'attachment');
  var mimeType = String(payload.mimeType || 'application/octet-stream');

  // MIMEタイプ検証
  if (CLAIM_ALLOWED_MIMES.indexOf(mimeType) === -1) {
    throw new Error('許可されていないファイル形式です。PDF・JPG・PNG のみアップロードできます。');
  }
  // サイズ検証
  var bytes = Utilities.base64Decode(base64);
  if (bytes.length > CLAIM_MAX_BYTES) {
    throw new Error('ファイルサイズが 10MB を超えています。');
  }

  // 2026-10-13: 役員かどうか・請求の所有者かどうかを、ファイルを作る前に確かめる。
  // 以前は役員の検査が無く（ログインできる会員なら誰でも公開リンクのファイルを置けた）、
  // 所有者の確認もファイルを作った後だった。
  if (!memberId && !staffId) throw new Error('ログインが必要です。');
  var ss = getOrCreateDatabase_();
  if (!isActiveOfficer_(memberId, staffId, ss)) throw new Error('役員のみ添付ファイルをアップロードできます。');
  var claimSheet = null;
  var claimFound = null;
  if (claimId) {
    claimSheet = ss.getSheetByName('T_請求');
    claimFound = claimSheet ? findRowByColumnValue_(claimSheet, '請求ID', claimId) : null;
    if (!claimFound || toBoolean_(claimFound.row[claimFound.columns['削除フラグ']])) throw new Error('請求が見つかりません。');
    if (!claimRowBelongsTo_(claimFound, memberId, staffId)) throw new Error('他の会員の請求にはファイルを追加できません。');
    if (String(claimFound.row[claimFound.columns['請求状態']] || '') !== '申請中') throw new Error('申請中以外の請求にはファイルを追加できません。');
  }

  var blob = Utilities.newBlob(bytes, mimeType, filename);
  var folder = getOrCreateClaimAttachmentFolder_(ss);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var attachment = {
    name: filename,
    url: file.getUrl(),
    fileId: file.getId(),
    mimeType: mimeType,
    uploadedAt: new Date().toISOString(),
  };

  // 既存請求への紐づけ更新（所有者の確認は上で済ませた）
  if (claimFound) {
    var sheet = claimSheet;
    var found = claimFound;
    {
      var existingJson = String(found.row[found.columns['添付ファイルURL']] || '');
      var attachments = [];
      if (existingJson) { try { attachments = JSON.parse(existingJson); } catch (e) { attachments = []; } }
      attachments.push(attachment);
      var row = found.row.slice();
      row[found.columns['添付ファイルURL']] = JSON.stringify(attachments);
      row[found.columns['更新日時']]         = new Date().toISOString();
      sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
    }
  }

  return attachment;
}

function removeClaimAttachment_(payload) {
  var memberId = String((payload.__memberSession && payload.__memberSession.memberId) ? payload.__memberSession.memberId : '').trim();
  var staffId  = String((payload.__memberSession && payload.__memberSession.staffId)  ? payload.__memberSession.staffId  : '').trim();
  var claimId  = String(payload.claimId  || '').trim();
  var fileId   = String(payload.fileId   || '').trim();
  if (!claimId || !fileId) throw new Error('claimId と fileId は必須です。');

  var ss    = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_請求');
  var found = findRowByColumnValue_(sheet, '請求ID', claimId);
  if (!found || toBoolean_(found.row[found.columns['削除フラグ']])) throw new Error('請求が見つかりません。');

  // 2026-10-13: 会員セッションが無いときに所有確認を飛ばしていた（if (memberId || staffId)）。
  // この関数は会員マイページからしか呼ばれないので、セッションが無ければ拒否する。
  if (!memberId && !staffId) throw new Error('ログインが必要です。');
  if (!claimRowBelongsTo_(found, memberId, staffId)) throw new Error('他の会員の請求からはファイルを削除できません。');
  if (String(found.row[found.columns['請求状態']] || '') !== '申請中') throw new Error('申請中以外の請求からはファイルを削除できません。');

  // 添付JSON から除去
  var existingJson = String(found.row[found.columns['添付ファイルURL']] || '');
  var attachments = [];
  if (existingJson) { try { attachments = JSON.parse(existingJson); } catch (e) { attachments = []; } }
  // 2026-10-13: 以前は fileId がこの請求の添付かを確かめる前に Drive のファイルをゴミ箱へ移していた。
  // 会員側はデプロイした人の権限（Drive 全権限）で動くため、任意のファイル（DB を含む）を消せた。
  // この請求の添付一覧にある fileId だけを消す。
  var isOwnAttachment = attachments.some(function(a) { return a && a.fileId === fileId; });
  if (!isOwnAttachment) throw new Error('この請求の添付ファイルではありません。');
  try { DriveApp.getFileById(fileId).setTrashed(true); } catch (e) { Logger.log('removeClaimAttachment_: Drive file not found: ' + fileId); }
  attachments = attachments.filter(function(a) { return a.fileId !== fileId; });

  var row = found.row.slice();
  row[found.columns['添付ファイルURL']] = attachments.length > 0 ? JSON.stringify(attachments) : '';
  row[found.columns['更新日時']]         = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  return { removed: true, fileId: fileId };
}

// ============================================================
// v297: 役員紐づけ変更 / 退職自動退任
// ============================================================

/**
 * 役員の紐づけを変更する（個人会員↔事業所職員の双方向対応）。
 * 2026-10-25: 人単位で、役員まわり 4 表（役職・振込口座・請求・支払い）をまとめて付け替える。
 * 以前は T_請求 を元の紐づけのまま残していたが、それでは本人のマイページに過去の請求が出ず、
 * 古い会員を削除すると請求も一緒にアーカイブへ移った。人物の統合（migratePersonOwnedReferences_）と同じ扱いにする。
 */
function updateOfficerLinkage_(payload) {
  var officerId    = String(payload.officerId    || '').trim();
  var newMemberId  = String(payload.newMemberId  || '').trim();
  var newStaffId   = String(payload.newStaffId   || '').trim();
  if (!officerId)                    throw new Error('役員IDは必須です。');
  if (!newMemberId && !newStaffId)   throw new Error('新しい会員IDまたは職員IDが必要です。');
  if (newMemberId && newStaffId)     throw new Error('会員IDと職員IDは同時に指定できません。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  var officerSheet = ss.getSheetByName('T_役員');
  var oFound = findRowByColumnValue_(officerSheet, '役員ID', officerId);
  if (!oFound || toBoolean_(oFound.row[oFound.columns['削除フラグ']])) throw new Error('役員レコードが見つかりません。');

  // 新しい人物の存在確認
  if (newMemberId) {
    var memCheck = findRowByColumnValue_(ss.getSheetByName('T_会員'), '会員ID', newMemberId);
    if (!memCheck || toBoolean_(memCheck.row[memCheck.columns['削除フラグ']])) throw new Error('指定した会員が見つかりません。');
  } else {
    var stfCheck = findRowByColumnValue_(ss.getSheetByName('T_事業所職員'), '職員ID', newStaffId);
    if (!stfCheck || toBoolean_(stfCheck.row[stfCheck.columns['削除フラグ']])) throw new Error('指定した職員が見つかりません。');
    if (String(stfCheck.row[stfCheck.columns['職員状態コード']] || '') === 'LEFT') throw new Error('退職済みの職員には紐づけ変更できません。');
  }

  // 2026-10-25: 紐づけ変更は「人」の付け替え。以前はこの役職の 1 行だけを変え、同じ人の他の役職は古い ID のまま、
  // 振込口座だけ新しい ID へ移っていた（役職を 2 つ持つ人で食い違う）。役員まわり 4 表のこの人の行をまとめて付け替える。
  var oldPerson = officerPersonRef_(oFound.row[oFound.columns['会員ID']], oFound.columns['職員ID'] != null ? oFound.row[oFound.columns['職員ID']] : '');
  var newPerson = officerPersonRef_(newMemberId, newStaffId);
  if (officerPersonKey_(oldPerson.memberId, oldPerson.staffId) === officerPersonKey_(newPerson.memberId, newPerson.staffId)) {
    throw new Error('今と同じ人物です。');
  }

  // 書き込む前に止める: 付け替えると同じ人が同じ役職で 2 つ現職になる・口座が 2 つになる
  var officerRows = getRowsAsObjects_(ss, 'T_役員').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var isCurrent = function(r) { return !String(r['退任日'] || ''); };
  var newPersonRoles = {};
  officerRows.forEach(function(r) {
    if (isCurrent(r) && rowBelongsToOfficerPerson_(r, newPerson.memberId, newPerson.staffId)) newPersonRoles[String(r['役職コード'] || '')] = true;
  });
  var clash = officerRows.filter(function(r) {
    return isCurrent(r) && rowBelongsToOfficerPerson_(r, oldPerson.memberId, oldPerson.staffId) && newPersonRoles[String(r['役職コード'] || '')];
  });
  if (clash.length > 0) throw new Error('付け替え先の人物は、同じ役職にすでに就任しています。先にどちらかを退任にしてください。');
  if (getBankAccount_(oldPerson) && getBankAccount_(newPerson)) {
    throw new Error('付け替え先の人物にも振込口座が登録されています。先にどちらかの口座を削除してください。');
  }

  var nowIso = new Date().toISOString();
  var counts = {};
  OFFICER_PERSON_TABLES_.forEach(function(tableName) {
    counts[tableName] = rebindPersonReferenceTable_(ss, tableName, oldPerson.memberId, oldPerson.staffId, newPerson.memberId, newPerson.staffId, nowIso);
  });

  clearAllDataCache_();
  return { updated: true, officerId: officerId, counts: counts };
}

/**
 * 職員が退職（LEFT）になった時に現職の役員レコードを自動退任させる。
 * updateStaff_ から呼び出される。
 */
function autoRetireOfficerByStaffId_(ss, staffId, nowIso) {
  var officerSheet = ss.getSheetByName('T_役員');
  if (!officerSheet) return;
  var activeOfficers = getRowsAsObjects_(ss, 'T_役員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) &&
      rowBelongsToOfficerPerson_(r, '', staffId) &&
      (!r['退任日'] || String(r['退任日'] || '') === '');
  });
  activeOfficers.forEach(function(o) {
    var found = findRowByColumnValue_(officerSheet, '役員ID', o['役員ID']);
    if (found) {
      var row = found.row.slice();
      row[found.columns['退任日']]  = nowIso.substring(0, 10);
      row[found.columns['更新日時']] = nowIso;
      officerSheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
    }
  });
}
