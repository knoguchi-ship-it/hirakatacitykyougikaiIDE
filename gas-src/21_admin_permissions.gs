// gas-src/21_admin_permissions.gs — 管理者権限・ロール。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

function getAdminPermissionData_(callerSession) {
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var callerEmail = '';
  var callerPermLevel = 'ADMIN';
  if (callerSession) {
    callerEmail = String(callerSession.loginId || '');
    callerPermLevel = String(callerSession.adminPermissionLevel || 'ADMIN');
  } else {
    callerEmail = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  }
  // docs/246 Phase 2-A: roles + menuRegistry も同梱（フロントの一括取得用、後方互換のため追加フィールド）
  var rolesData = listRoles_({ __adminSession: callerSession });
  return {
    entries: getAdminPermissionEntries_(ss),
    identityOptions: getAdminPermissionIdentityOptions_(ss),
    currentSessionEmail: callerEmail,
    currentSessionPermissionLevel: callerPermLevel,
    // 追加フィールド（既存 UI は無視可、Phase 2-B 以降で利用）
    roles: rolesData.roles,
    menuRegistry: rolesData.menuRegistry,
  };
}

function saveAdminPermission_(payload) {
  if (!payload) throw new Error('権限データが空です。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);

  // 呼出元セッション情報
  var callerSession = payload.__adminSession || null;
  var callerEmail = callerSession ? String(callerSession.loginId || '') : String(Session.getActiveUser().getEmail() || '').toLowerCase();
  var callerPerm = callerSession ? String(callerSession.adminPermissionLevel || 'ADMIN') : 'ADMIN';

  var normalizedEmail = String(payload.googleEmail || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Googleメールアドレスの形式が不正です。');
  }

  var linkedAuthId = String(payload.linkedAuthId || '').trim();
  if (!linkedAuthId) throw new Error('紐付け認証IDは必須です。');

  // 権限コード検証
  var permissionLevel = String(payload.permissionLevel || 'ADMIN').trim();
  if (!isKnownMasterCode_(ss, 'M_管理者権限', permissionLevel)) {
    throw new Error('無効な権限コードです: ' + permissionLevel);
  }

  // docs/246 Phase 2-A: roleId が指定されていれば validate（後方互換: 未指定なら legacy code から導出）
  var assignedRoleId = String(payload.roleId || '').trim();
  if (assignedRoleId) {
    var role = getRoleByIdCached_(ss, assignedRoleId);
    if (!role) throw new Error('無効な roleId です: ' + assignedRoleId);
  } else {
    // legacy permissionLevel から initial role id へ自動マップ（ある場合のみ）
    assignedRoleId = LEGACY_CODE_TO_INITIAL_ROLE_ID[permissionLevel] || '';
  }

  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet) throw new Error('T_認証アカウント シートが見つかりません。');
  var linkedAuth = findRowByColumnValue_(authSheet, '認証ID', linkedAuthId);
  if (!linkedAuth || toBoolean_(linkedAuth.row[linkedAuth.columns['削除フラグ']])) {
    throw new Error('紐付け認証ID が見つかりません。');
  }
  if (!toBoolean_(linkedAuth.row[linkedAuth.columns['アカウント有効フラグ']])) {
    throw new Error('紐付け先の認証アカウントが無効です。');
  }

  var linkedMemberId = String(linkedAuth.row[linkedAuth.columns['会員ID']] || '').trim();
  if (!linkedMemberId) throw new Error('紐付け先の認証アカウントに会員IDがありません。');

  var sheet = ss.getSheetByName('T_管理者Googleホワイトリスト');
  if (!sheet) throw new Error('T_管理者Googleホワイトリスト シートが見つかりません。');
  var id = String(payload.id || '').trim();
  var existing = id ? findRowByColumnValue_(sheet, 'ホワイトリストID', id) : null;

  var rows = getRowsAsObjects_(ss, 'T_管理者Googleホワイトリスト').filter(function(row) {
    return !toBoolean_(row['削除フラグ']);
  });

  // メール重複チェック
  for (var i = 0; i < rows.length; i += 1) {
    var rowId = String(rows[i]['ホワイトリストID'] || '');
    var rowEmail = String(rows[i]['Googleメール'] || '').trim().toLowerCase();
    if (rowEmail && rowEmail === normalizedEmail && rowId !== id) {
      throw new Error('同じ Googleメールアドレスは既に登録されています。');
    }
  }

  // 権限制約チェック
  if (existing) {
    var existingPerm = String(existing.row[existing.columns['権限コード']] || '') || 'ADMIN';
    // ADMIN は MASTER レコードを編集できない
    if (callerPerm === 'ADMIN' && existingPerm === 'MASTER') {
      throw new Error('管理者権限ではマスター権限のレコードを編集できません。');
    }
    // ADMIN は自分の権限を変更できない
    var existingEmail = String(existing.row[existing.columns['Googleメール']] || '').toLowerCase();
    if (callerPerm === 'ADMIN' && callerEmail === existingEmail && permissionLevel !== existingPerm) {
      throw new Error('管理者権限では自分の権限レベルを変更できません。');
    }
  }

  // 最後のマスター保護
  if (existing) {
    var existingPermForMaster = String(existing.row[existing.columns['権限コード']] || '') || 'ADMIN';
    if (existingPermForMaster === 'MASTER' && permissionLevel !== 'MASTER') {
      var masterCount = 0;
      for (var m = 0; m < rows.length; m += 1) {
        if (String(rows[m]['権限コード'] || '') === 'MASTER' && toBoolean_(rows[m]['有効フラグ'])) {
          masterCount += 1;
        }
      }
      if (masterCount <= 1) {
        throw new Error('最後のマスター権限者の権限を変更することはできません。');
      }
    }
  }

  var nowIso = new Date().toISOString();
  var nextRow = {
    ホワイトリストID: id || ('WL-' + Utilities.getUuid().slice(0, 8)),
    Googleメール: normalizedEmail,
    紐付け認証ID: linkedAuthId,
    紐付け会員ID: linkedMemberId,
    権限コード: permissionLevel, // 後方互換のため保持（rollback 用）
    ロールID: assignedRoleId,    // docs/246 Phase 2-A: authoritative
    有効フラグ: payload.enabled !== false,
    変更者メール: callerEmail,
    変更日時: nowIso,
    作成日時: existing ? String(existing.row[existing.columns['作成日時']] || nowIso) : nowIso,
    更新日時: nowIso,
    削除フラグ: false,
  };

  if (existing) {
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var updatedRow = existing.row.slice();
    for (var h = 0; h < headers.length; h += 1) {
      if (Object.prototype.hasOwnProperty.call(nextRow, headers[h])) {
        updatedRow[h] = nextRow[headers[h]];
      }
    }
    sheet.getRange(existing.rowNumber, 1, 1, updatedRow.length).setValues([updatedRow]);
  } else {
    appendRowsByHeaders_(ss, 'T_管理者Googleホワイトリスト', [nextRow]);
  }

  // ホワイトリスト変更時は権限解決キャッシュを両方無効化する
  clearAdminPermissionCaches_();
  return { saved: true, id: nextRow['ホワイトリストID'] };
}

function deleteAdminPermission_(payload) {
  var id = String(payload && payload.id || '').trim();
  if (!id) throw new Error('ホワイトリストID が未指定です。');

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var sheet = ss.getSheetByName('T_管理者Googleホワイトリスト');
  if (!sheet) throw new Error('T_管理者Googleホワイトリスト シートが見つかりません。');
  var found = findRowByColumnValue_(sheet, 'ホワイトリストID', id);
  if (!found) throw new Error('削除対象の管理者権限が見つかりません。');

  // 最後のマスター保護
  var targetPerm = String(found.row[found.columns['権限コード']] || '') || 'ADMIN';
  if (targetPerm === 'MASTER') {
    var allRows = getRowsAsObjects_(ss, 'T_管理者Googleホワイトリスト').filter(function(r) {
      return !toBoolean_(r['削除フラグ']) && toBoolean_(r['有効フラグ']);
    });
    var masterCount = 0;
    for (var i = 0; i < allRows.length; i += 1) {
      if (String(allRows[i]['権限コード'] || '') === 'MASTER') masterCount += 1;
    }
    if (masterCount <= 1) {
      throw new Error('最後のマスター権限者を削除することはできません。');
    }
  }

  // 呼出元セッション情報で変更ログを記録
  var callerSession = payload.__adminSession || null;
  var callerEmail = callerSession ? String(callerSession.loginId || '') : String(Session.getActiveUser().getEmail() || '').toLowerCase();
  var nowIso = new Date().toISOString();

  var row = found.row.slice();
  row[found.columns['有効フラグ']] = false;
  row[found.columns['更新日時']] = nowIso;
  row[found.columns['削除フラグ']] = true;
  if (found.columns['変更者メール'] != null) row[found.columns['変更者メール']] = callerEmail;
  if (found.columns['変更日時'] != null) row[found.columns['変更日時']] = nowIso;
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  // ホワイトリスト変更時は権限解決キャッシュを両方無効化する
  clearAdminPermissionCaches_();
  return { deleted: true, id: id };
}

// ─── docs/246 Phase 2-A: ロール CRUD ─────────────────────────────────

/**
 * T_監査ログ にロール CRUD を追記する。
 * appendAdminAuditLog_ は T_会員 専用なので別関数とする。
 */
// 監査ログ（T_監査ログ）への書き込みの唯一の出口。まとめて 1 回で書く。
// entries: [{ operatorEmail, operation, tableName, recordId, fieldName, oldValue, newValue }]
// 監査ログのシートが無い（スキーマ未整備）ときは何もしない。
function appendAuditLogEntries_(entries) {
  if (!entries || entries.length === 0) return 0;
  var sheet = getLogSs_().getSheetByName('T_監査ログ');
  if (!sheet) return 0;
  var now = new Date().toISOString();
  var text = function(v) { return v === null || v === undefined ? '' : String(v); };
  var rows = entries.map(function(e) {
    return [Utilities.getUuid(), now, text(e.operatorEmail), text(e.operation), text(e.tableName),
      text(e.recordId), text(e.fieldName), text(e.oldValue), text(e.newValue)];
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  return rows.length;
}

function appendRoleAuditLog_(adminEmail, roleId, op, fieldName, oldValue, newValue) {
  try {
    // op: 'ROLE_CREATE' / 'ROLE_UPDATE' / 'ROLE_DELETE' / 'ROLE_DUPLICATE'
    appendAuditLogEntries_([{ operatorEmail: adminEmail, operation: op, tableName: 'T_権限ロール',
      recordId: roleId, fieldName: fieldName, oldValue: oldValue, newValue: newValue }]);
  } catch (e) { /* schema 未整備時は silent skip */ }
}

/**
 * T_権限ロール 全件 + メニュー定義 + 各ロールの assignedCount を返す。
 * Caller: 任意の admin（system-permissions menu アクセス権者）。
 */
function listRoles_(payload) {
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var roleRows = getRowsAsObjects_(ss, 'T_権限ロール').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  var wlRows = getRowsAsObjects_(ss, 'T_管理者Googleホワイトリスト').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && toBoolean_(r['有効フラグ']);
  });
  var assignedCountByRoleId = {};
  for (var i = 0; i < wlRows.length; i += 1) {
    var rid = String(wlRows[i]['ロールID'] || '');
    if (!rid) continue;
    assignedCountByRoleId[rid] = (assignedCountByRoleId[rid] || 0) + 1;
  }
  var roles = roleRows.map(function(r) {
    var rid = String(r['ロールID'] || '');
    var allowedMenus = [];
    try { var p = JSON.parse(String(r['許可メニューJSON'] || '[]')); if (Array.isArray(p)) allowedMenus = p.map(String); } catch (e) {}
    return {
      roleId: rid,
      roleName: String(r['ロール名'] || ''),
      description: String(r['説明'] || ''),
      allowedMenus: allowedMenus,
      trainingEditScope: String(r['研修編集スコープ'] || 'ALL').toUpperCase(),
      isBuiltIn: toBoolean_(r['組込フラグ']),
      isMaster: toBoolean_(r['マスターフラグ']),
      sortOrder: Number(r['表示順'] || 0),
      assignedCount: assignedCountByRoleId[rid] || 0,
    };
  }).sort(function(a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0); });
  return { roles: roles, menuRegistry: MENU_REGISTRY };
}

function validateRolePayload_(payload, isUpdate) {
  var roleName = String((payload && payload.roleName) || '').trim();
  if (!roleName) throw new Error('ロール名は必須です。');
  if (roleName === 'MASTER') throw new Error('"MASTER" は予約語のため使用できません。');
  if (roleName.length > 50) throw new Error('ロール名は50文字以内にしてください。');
  var description = String((payload && payload.description) || '').trim();
  var allowedMenus = Array.isArray(payload && payload.allowedMenus) ? payload.allowedMenus.map(String) : [];
  // 未知 menu id は拒否
  var validIds = {};
  for (var i = 0; i < MENU_REGISTRY.length; i += 1) validIds[MENU_REGISTRY[i].id] = MENU_REGISTRY[i];
  var masterOnlyHit = [];
  for (var j = 0; j < allowedMenus.length; j += 1) {
    var menu = validIds[allowedMenus[j]];
    if (!menu) throw new Error('未知のメニューid: ' + allowedMenus[j]);
    if (menu.masterOnly) masterOnlyHit.push(allowedMenus[j]);
  }
  if (masterOnlyHit.length > 0) {
    throw new Error('masterOnly メニューはカスタムロールに付与できません: ' + masterOnlyHit.join(', '));
  }
  var scope = String((payload && payload.trainingEditScope) || 'ALL').toUpperCase();
  if (scope !== 'ALL' && scope !== 'OWN') throw new Error('研修編集スコープは ALL または OWN のみ。');
  return { roleName: roleName, description: description, allowedMenus: allowedMenus, trainingEditScope: scope };
}

function requireMasterForRoleWrite_(payload) {
  var session = payload && payload.__adminSession;
  if (!session) throw new Error('管理者セッションが無効です。');
  // 二重防御: server-side で MASTER 限定（特権昇格防止 — docs/246 §7）
  if (!session.isMaster && String(session.adminPermissionLevel || '') !== 'MASTER') {
    throw new Error('ロールの作成・編集・削除はマスター権限者のみ実行できます。');
  }
  return String(session.loginId || '');
}

function saveRole_(payload) {
  var callerEmail = requireMasterForRoleWrite_(payload);
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var sheet = ss.getSheetByName('T_権限ロール');
  if (!sheet) throw new Error('T_権限ロール シートが見つかりません。');

  var existingRoleId = String((payload && payload.roleId) || '').trim();
  var isUpdate = !!existingRoleId;
  var v = validateRolePayload_(payload, isUpdate);

  // ロール名重複チェック（自分以外）
  var existingRows = getRowsAsObjects_(ss, 'T_権限ロール').filter(function(r) { return !toBoolean_(r['削除フラグ']); });
  for (var i = 0; i < existingRows.length; i += 1) {
    if (String(existingRows[i]['ロール名'] || '').trim() === v.roleName && String(existingRows[i]['ロールID'] || '') !== existingRoleId) {
      throw new Error('同名のロールが既に存在します: ' + v.roleName);
    }
  }

  var nowIso = new Date().toISOString();
  if (isUpdate) {
    var found = findRowByColumnValue_(sheet, 'ロールID', existingRoleId);
    if (!found) throw new Error('編集対象のロールが見つかりません: ' + existingRoleId);
    if (toBoolean_(found.row[found.columns['組込フラグ']])) {
      throw new Error('組込ロール（MASTER）は編集できません。');
    }
    var row = found.row.slice();
    var oldName = String(row[found.columns['ロール名']] || '');
    var oldDesc = String(row[found.columns['説明']] || '');
    var oldMenus = String(row[found.columns['許可メニューJSON']] || '');
    var oldScope = String(row[found.columns['研修編集スコープ']] || '');
    row[found.columns['ロール名']] = v.roleName;
    row[found.columns['説明']] = v.description;
    row[found.columns['許可メニューJSON']] = JSON.stringify(v.allowedMenus);
    row[found.columns['研修編集スコープ']] = v.trainingEditScope;
    row[found.columns['更新日時']] = nowIso;
    sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
    // 監査
    if (oldName !== v.roleName) appendRoleAuditLog_(callerEmail, existingRoleId, 'ROLE_UPDATE', 'ロール名', oldName, v.roleName);
    if (oldDesc !== v.description) appendRoleAuditLog_(callerEmail, existingRoleId, 'ROLE_UPDATE', '説明', oldDesc, v.description);
    if (oldMenus !== JSON.stringify(v.allowedMenus)) appendRoleAuditLog_(callerEmail, existingRoleId, 'ROLE_UPDATE', '許可メニューJSON', oldMenus, JSON.stringify(v.allowedMenus));
    if (oldScope !== v.trainingEditScope) appendRoleAuditLog_(callerEmail, existingRoleId, 'ROLE_UPDATE', '研修編集スコープ', oldScope, v.trainingEditScope);
    clearAdminPermissionCaches_();
    return { saved: true, roleId: existingRoleId, isNew: false };
  } else {
    // 新規作成
    var newRoleId = 'role-' + Utilities.getUuid().slice(0, 8) + '-custom';
    var maxSort = 0;
    for (var s = 0; s < existingRows.length; s += 1) {
      var so = Number(existingRows[s]['表示順'] || 0);
      if (so > maxSort) maxSort = so;
    }
    appendRowsByHeaders_(ss, 'T_権限ロール', [{
      'ロールID': newRoleId,
      'ロール名': v.roleName,
      '説明': v.description,
      '許可メニューJSON': JSON.stringify(v.allowedMenus),
      '研修編集スコープ': v.trainingEditScope,
      '組込フラグ': false,
      'マスターフラグ': false,
      '表示順': maxSort + 10,
      '作成日時': nowIso,
      '更新日時': nowIso,
      '削除フラグ': false,
    }]);
    appendRoleAuditLog_(callerEmail, newRoleId, 'ROLE_CREATE', '新規ロール', '', v.roleName);
    clearAdminPermissionCaches_();
    return { saved: true, roleId: newRoleId, isNew: true };
  }
}

function deleteRole_(payload) {
  var callerEmail = requireMasterForRoleWrite_(payload);
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var roleId = String((payload && payload.roleId) || '').trim();
  if (!roleId) throw new Error('roleId は必須です。');
  var sheet = ss.getSheetByName('T_権限ロール');
  if (!sheet) throw new Error('T_権限ロール シートが見つかりません。');
  var found = findRowByColumnValue_(sheet, 'ロールID', roleId);
  if (!found) throw new Error('削除対象のロールが見つかりません: ' + roleId);
  if (toBoolean_(found.row[found.columns['組込フラグ']])) {
    throw new Error('組込ロール（MASTER）は削除できません。');
  }
  // 使用中チェック
  var wlRows = getRowsAsObjects_(ss, 'T_管理者Googleホワイトリスト').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && toBoolean_(r['有効フラグ']);
  });
  var assigned = 0;
  for (var i = 0; i < wlRows.length; i += 1) {
    if (String(wlRows[i]['ロールID'] || '') === roleId) assigned += 1;
  }
  if (assigned > 0) {
    throw new Error('このロールは ' + assigned + ' 件のアカウントに割当中のため削除できません。先に再割当を行ってください。');
  }
  var row = found.row.slice();
  var oldName = String(row[found.columns['ロール名']] || '');
  row[found.columns['削除フラグ']] = true;
  row[found.columns['更新日時']] = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  appendRoleAuditLog_(callerEmail, roleId, 'ROLE_DELETE', 'ロール名', oldName, '(削除)');
  clearAdminPermissionCaches_();
  return { deleted: true, roleId: roleId };
}

function duplicateRole_(payload) {
  var callerEmail = requireMasterForRoleWrite_(payload);
  var sourceRoleId = String((payload && payload.sourceRoleId) || '').trim();
  if (!sourceRoleId) throw new Error('sourceRoleId は必須です。');
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_権限ロール');
  if (!sheet) throw new Error('T_権限ロール シートが見つかりません。');
  var found = findRowByColumnValue_(sheet, 'ロールID', sourceRoleId);
  if (!found) throw new Error('複製元ロールが見つかりません: ' + sourceRoleId);
  var srcName = String(found.row[found.columns['ロール名']] || '');
  var srcDesc = String(found.row[found.columns['説明']] || '');
  var srcMenus = [];
  try { var p = JSON.parse(String(found.row[found.columns['許可メニューJSON']] || '[]')); if (Array.isArray(p)) srcMenus = p.map(String); } catch (e) {}
  var srcScope = String(found.row[found.columns['研修編集スコープ']] || 'ALL').toUpperCase();
  var newName = String((payload && payload.newRoleName) || (srcName + ' (コピー)')).trim();
  // saveRole_ を再利用 — masterOnly 等の検証を共通化
  var result = saveRole_({
    __adminSession: payload.__adminSession,
    roleName: newName,
    description: srcDesc,
    allowedMenus: srcMenus,
    trainingEditScope: srcScope,
  });
  appendRoleAuditLog_(callerEmail, result.roleId, 'ROLE_DUPLICATE', '複製元', sourceRoleId, result.roleId);
  return result;
}

function getAdminPermissionEntries_(ss) {
  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(row) { return !toBoolean_(row['削除フラグ']); });
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(row) { return !toBoolean_(row['削除フラグ']); });
  var authRows = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(row) { return !toBoolean_(row['削除フラグ']); });
  var memberMap = {};
  var staffMap = {};
  var authMap = {};
  for (var i = 0; i < memberRows.length; i += 1) {
    memberMap[String(memberRows[i]['会員ID'] || '')] = memberRows[i];
  }
  for (var j = 0; j < staffRows.length; j += 1) {
    staffMap[String(staffRows[j]['職員ID'] || '')] = staffRows[j];
  }
  for (var k = 0; k < authRows.length; k += 1) {
    authMap[String(authRows[k]['認証ID'] || '')] = authRows[k];
  }

  return getRowsAsObjects_(ss, 'T_管理者Googleホワイトリスト')
    .filter(function(row) { return !toBoolean_(row['削除フラグ']); })
    .map(function(row) {
      var linkedAuthId = String(row['紐付け認証ID'] || '');
      var linkedAuth = authMap[linkedAuthId];
      var linkedMemberId = String(row['紐付け会員ID'] || (linkedAuth && linkedAuth['会員ID']) || '');
      var linkedStaffId = String((linkedAuth && linkedAuth['職員ID']) || '');
      var permLevel = String(row['権限コード'] || '') || 'ADMIN';
      // 表示名を会員名/職員名 + 権限ラベルから自動導出
      var memberRow = memberMap[linkedMemberId];
      var staffRow = staffMap[linkedStaffId];
      var personName = '';
      if (memberRow) {
        personName = (String(memberRow['姓'] || '') + ' ' + String(memberRow['名'] || '')).trim();
      }
      if (!personName && staffRow) {
        personName = String(staffRow['氏名'] || '').trim();
        if (!personName) {
          personName = (String(staffRow['姓'] || '') + ' ' + String(staffRow['名'] || '')).trim();
        }
      }
      var derivedDisplayName = personName ? personName + '（' + masterLabel_(ss, 'M_管理者権限', permLevel) + '）' : masterLabel_(ss, 'M_管理者権限', permLevel);
      return {
        id: String(row['ホワイトリストID'] || ''),
        googleEmail: String(row['Googleメール'] || '').trim().toLowerCase(),
        displayName: derivedDisplayName,
        linkedAuthId: linkedAuthId,
        linkedMemberId: linkedMemberId,
        linkedStaffId: linkedStaffId,
        linkedRoleCode: String((linkedAuth && linkedAuth['システムロールコード']) || ''),
        linkedIdentityLabel: buildAdminPermissionIdentityLabel_(ss, memberMap[linkedMemberId], staffMap[linkedStaffId], linkedAuth),
        permissionLevel: permLevel,
        roleId: String(row['ロールID'] || ''), // docs/246 Phase 2-A 追加
        enabled: toBoolean_(row['有効フラグ']),
        updatedAt: String(row['更新日時'] || ''),
        updatedByEmail: String(row['変更者メール'] || ''),
        updatedByAt: String(row['変更日時'] || ''),
      };
    })
    .sort(function(a, b) {
      return String(a.googleEmail || '').localeCompare(String(b.googleEmail || ''));
    });
}

function getAdminPermissionIdentityOptions_(ss) {
  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(row) { return !toBoolean_(row['削除フラグ']); });
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(row) { return !toBoolean_(row['削除フラグ']); });
  var authRows = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(row) {
    return !toBoolean_(row['削除フラグ']) && toBoolean_(row['アカウント有効フラグ']);
  });
  var memberMap = {};
  var staffMap = {};
  for (var i = 0; i < memberRows.length; i += 1) {
    memberMap[String(memberRows[i]['会員ID'] || '')] = memberRows[i];
  }
  for (var j = 0; j < staffRows.length; j += 1) {
    staffMap[String(staffRows[j]['職員ID'] || '')] = staffRows[j];
  }

  var options = [];
  for (var k = 0; k < authRows.length; k += 1) {
    var authRow = authRows[k];
    var optionMemberId = String(authRow['会員ID'] || '').trim();
    if (!optionMemberId) continue;
    var optionStaffId = String(authRow['職員ID'] || '').trim();
    options.push({
      authId: String(authRow['認証ID'] || ''),
      authMethod: String(authRow['認証方式'] || 'PASSWORD'),
      loginId: String(authRow['ログインID'] || ''),
      memberId: optionMemberId,
      staffId: optionStaffId,
      roleCode: String(authRow['システムロールコード'] || ''),
      label: buildAdminPermissionIdentityLabel_(ss, memberMap[optionMemberId], staffMap[optionStaffId], authRow),
    });
  }
  options.sort(function(a, b) {
    return String(a.label || '').localeCompare(String(b.label || ''));
  });
  return options;
}

function buildAdminPermissionIdentityLabel_(ss, memberRow, staffRow, authRow) {
  if (!authRow) return '紐付け先不明';
  var base = buildAnnualFeeDisplayName_(memberRow);
  if (staffRow) {
    base = base + ' - ' + String(staffRow['氏名'] || '');
  }
  var suffix = [];
  var roleCode = String(authRow['システムロールコード'] || '');
  if (roleCode) suffix.push(masterLabel_(ss, 'M_システムロール', roleCode));
  var loginId = String(authRow['ログインID'] || '');
  if (loginId) suffix.push('ログインID: ' + loginId);
  return suffix.length ? base + ' (' + suffix.join(' / ') + ')' : base;
}
