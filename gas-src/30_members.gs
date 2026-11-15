// gas-src/30_members.gs — 会員・職員・入会・退会・会員種別の変更。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

// v235: loginId をセッションアンカーとして受け取り、T_認証アカウントから現在の memberId/staffId を解決する。
// ロール変換後にフロントエンドのセッションが古い memberId を持っていても自動補正される。
// 後方互換: loginId のみ指定時は T_認証アカウントから解決。memberId のみ指定（旧形式）も引き続き動作。
function getMemberPortalData_(payload) {
  var ss = getOrCreateDatabase_();
  // 必要なシートを 1 回ずつだけ読む。以前は T_認証アカウント を 2 回、研修申込の妥当性検査で
  // T_会員・T_研修・T_事業所職員をもう 1 回ずつ読んでいた（このデータはキャッシュされず毎回読む）。
  var portalRowsBySheet = getRowsAsObjectsBatch_(ss, [
    'T_認証アカウント',
    'T_会員',
    'T_事業所職員',
    'T_研修',
    'T_研修申込',
    'T_年会費納入履歴',
    'T_外部申込者',
  ]);
  var memberId = '';
  var staffId = '';
  var resolvedByLoginId = false;

  var loginId = String(payload && payload.loginId || '').trim();
  if (loginId) {
    // loginId から現在の有効な認証アカウントを解決する（セッションアンカー方式）
    var authRows = portalRowsBySheet['T_認証アカウント'].filter(function(r) {
      return !toBoolean_(r['削除フラグ'])
        && toBoolean_(r['アカウント有効フラグ'])
        && String(r['ログインID'] || '').trim() === loginId
        && String(r['認証方式'] || '') === 'PASSWORD';
    });
    if (!authRows.length) {
      throw new Error('認証アカウントが見つかりません（loginId: ' + loginId + '）。再ログインしてください。');
    }
    memberId = String(authRows[0]['会員ID'] || '').trim();
    staffId = String(authRows[0]['職員ID'] || '').trim();
    resolvedByLoginId = true;
  } else {
    // 後方互換: memberId 直接指定（管理者が代理参照する場合など）
    memberId = String(payload && payload.memberId || '').trim();
  }

  if (!memberId) {
    throw new Error('loginId または memberId が未指定です。');
  }

  var memberRows = portalRowsBySheet['T_会員'].filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === memberId;
  });
  if (!memberRows.length) {
    throw new Error('対象会員が見つかりません（memberId: ' + memberId + '）。');
  }
  var staffRows = portalRowsBySheet['T_事業所職員'].filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === memberId;
  });
  var memberAuthRows = portalRowsBySheet['T_認証アカウント'].filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === memberId;
  });
  var visibleStaff = limitPortalStaffToCaller_(staffRows, memberAuthRows, staffId);
  staffRows = visibleStaff.staffRows;
  memberAuthRows = visibleStaff.authRows;
  var applicationRows = getTrainingApplicationRows_(ss, {
    appliedOnly: true,
    memberId: memberId,
    rows: portalRowsBySheet['T_研修申込'],
    context: buildTrainingApplicationRelationContextFromRows_(portalRowsBySheet),
  });
  // B-01: 申し込み済み研修IDセットを事前構築し、全件スキャンを回避する
  var appliedIdSet = {};
  for (var ai = 0; ai < applicationRows.length; ai++) {
    appliedIdSet[String(applicationRows[ai]['研修ID'] || '')] = true;
  }
  var nowTs = Date.now();
  var trainingRows = portalRowsBySheet['T_研修'].filter(function(r) {
    if (toBoolean_(r['削除フラグ'])) return false;
    // 申し込み済みは必ず含める（履歴表示のため）
    if (appliedIdSet[String(r['研修ID'] || '')]) return true;
    var availability = computeTrainingAvailability_(r, { now: new Date(nowTs) });
    if (availability.lifecycleStatus !== 'PUBLISHED') return false;
    if (availability.isApplicationOpen || availability.applicationStatus === 'NOT_STARTED') return true;
    return false;
  });
  var feeRows = portalRowsBySheet['T_年会費納入履歴'].filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === memberId;
  });
  var memberTypeFeeMap = getAnnualFeeAmountMap_(ss);

  var result = {
    members: mapMembersForApi_(ss, memberRows, staffRows, memberAuthRows, applicationRows, feeRows, memberTypeFeeMap),
    trainings: mapTrainingRowsForApi_(trainingRows),
    // 会員マイページの選択肢・名称（公開と同じ許可リストの表だけ・属性なし）
    masters: masterOptionsForClient_(ss, 'PUBLIC'),
  };

  // loginId 解決時は現在の memberId/staffId をレスポンスに含め、フロントエンドがセッションを自動補正できるようにする
  if (resolvedByLoginId) {
    result.resolvedMemberId = memberId;
    result.resolvedStaffId = staffId;
  }

  return result;
}

// B-15（2026-10-23）: 事業所の一般職員には同僚の行（氏名・メール・CM 番号＝ログイン ID）を返さない。
// docs/03 §3.5「STAFF は自分の情報のみ閲覧」。以前は全員分を返し、画面にも出ていた。
// 代表者・管理者は職員を管理するので全員分。それ以外の権限・自分の行が無いときは自分だけ（閉じる側に倒す）。
// 保存は updateMemberSelf_ が送られなかった職員を DB の値のまま残すので、自分の行だけで足りる。
function limitPortalStaffToCaller_(staffRows, authRows, callerStaffId) {
  var ownId = String(callerStaffId || '').trim();
  if (!ownId) return { staffRows: staffRows, authRows: authRows }; // 個人・賛助会員
  var own = staffRows.filter(function(r) { return String(r['職員ID'] || '').trim() === ownId; });
  var role = own.length ? String(own[0]['職員権限コード'] || '').trim() : '';
  if (role === 'REPRESENTATIVE' || role === 'ADMIN') return { staffRows: staffRows, authRows: authRows };
  return {
    staffRows: own,
    authRows: authRows.filter(function(r) { return String(r['職員ID'] || '').trim() === ownId; }),
  };
}

function mapMembersForApi_(ss, memberRows, staffRows, authRows, applicationRows, feeRows, memberTypeFeeMap, options) {
  var includeAdminStatusNote = options && options.includeAdminStatusNote === true;
  var memberMap = {};
  for (var memberIdx = 0; memberIdx < memberRows.length; memberIdx += 1) {
    memberMap[String(memberRows[memberIdx]['会員ID'] || '')] = memberRows[memberIdx];
  }

  var loginByMemberId = {};
  var loginByStaffId = {};
  for (var i = 0; i < authRows.length; i += 1) {
    var a = authRows[i];
    if (String(a['認証方式'] || '') !== 'PASSWORD') continue;
    if (!toBoolean_(a['アカウント有効フラグ'])) continue;
    var authMemberId = String(a['会員ID'] || '');
    var staffId = String(a['職員ID'] || '');
    if (staffId) {
      loginByStaffId[staffId] = String(a['ログインID'] || '');
    } else if (authMemberId) {
      loginByMemberId[authMemberId] = String(a['ログインID'] || '');
    }
  }

  var applicationsByMember = {};
  var applicationsByStaff = {};
  for (var j = 0; j < applicationRows.length; j += 1) {
    var app = applicationRows[j];
    var trainingId = String(app['研修ID'] || '');
    var appMemberId = getMemberIdFromApplication_(app);
    var appStaffId = String(app['職員ID'] || '');
    if (appStaffId) {
      if (!applicationsByStaff[appStaffId]) applicationsByStaff[appStaffId] = [];
      applicationsByStaff[appStaffId].push(trainingId);
    } else if (appMemberId) {
      if (!applicationsByMember[appMemberId]) applicationsByMember[appMemberId] = [];
      applicationsByMember[appMemberId].push(trainingId);
    }
  }

  var feeByMember = {};
  var annualFeeTransferAccount = getAnnualFeeTransferAccountSetting_(ss);
  for (var k = 0; k < feeRows.length; k += 1) {
    var f = feeRows[k];
    var feeMemberId = String(f['会員ID'] || '');
    if (!feeByMember[feeMemberId]) feeByMember[feeMemberId] = [];
    var feeItem = {
      id: String(f['年会費履歴ID'] || ''),
      year: Number(f['対象年度'] || 0),
      status: String(f['会費納入状態コード'] || 'UNPAID'),
      confirmedDate: normalizeDateInput_(f['納入確認日']),
      amount: resolveAnnualFeeAmount_(memberMap[feeMemberId], memberTypeFeeMap, Number(f['金額'] || 0)),
      note: String(f['備考'] || ''),
      updatedAt: String(f['更新日時'] || ''),
    };
    if (feeItem.status === 'UNPAID') {
      feeItem.transferAccount = parseTransferAccount_(f['備考'], annualFeeTransferAccount);
    }
    feeByMember[feeMemberId].push(feeItem);
  }

  // v106: 退職者の年度フィルタ — 翌年度（4/1〜）から非表示
  var currentFiscalYearStart = getFiscalYearStart_(new Date());
  var staffByMember = {};
  for (var s = 0; s < staffRows.length; s += 1) {
    var st = staffRows[s];
    var staffNameFields = normalizeStaffNameFields_(st);
    var stStatus = String(st['職員状態コード'] || 'ENROLLED') === 'LEFT' ? 'LEFT' : 'ENROLLED';
    // v106: 退職済み職員で退職日が今年度開始より前なら非表示（データは保持）
    if (stStatus === 'LEFT') {
      var stWithdrawn = normalizeDateInput_(st['退会日']);
      if (stWithdrawn && new Date(stWithdrawn + 'T00:00:00+09:00') < currentFiscalYearStart) {
        continue;
      }
    }
    var stMemberId = String(st['会員ID'] || '');
    if (!staffByMember[stMemberId]) staffByMember[stMemberId] = [];
    var stId = String(st['職員ID'] || '');
    staffByMember[stMemberId].push({
      id: stId,
      loginId: loginByStaffId[stId] || '',
      lastName: staffNameFields.lastName,
      firstName: staffNameFields.firstName,
      lastKana: staffNameFields.lastKana,
      firstKana: staffNameFields.firstKana,
      name: staffNameFields.name,
      kana: staffNameFields.kana,
      email: String(st['メールアドレス'] || ''),
      careManagerNumber: String(st['介護支援専門員番号'] || ''),
      role: String(st['職員権限コード'] || 'STAFF'),
      status: stStatus,
      joinedDate: normalizeDateInput_(st['入会日']),
      withdrawnDate: normalizeDateInput_(st['退会日']),
      mailingPreference: String(st['メール配信希望コード'] || 'YES'),
      midYearWithdrawal: false,
      participatedTrainingIds: uniqueStrings_(applicationsByStaff[stId] || []),
    });
  }

  return memberRows.map(function(m) {
    var id = String(m['会員ID'] || '');
    var type = String(m['会員種別コード'] || 'INDIVIDUAL');
    var history = buildMemberAnnualFeeHistory_(m, feeByMember[id] || [], memberTypeFeeMap);
    var mappedMember = {
      id: id,
      loginId: loginByMemberId[id] || '',
      careManagerNumber: String(m['介護支援専門員番号'] || loginByMemberId[id] || ''),
      lastName: String(m['姓'] || ''),
      firstName: String(m['名'] || ''),
      lastKana: String(m['セイ'] || ''),
      firstKana: String(m['メイ'] || ''),
      type: type,
      staff: type === 'BUSINESS' ? (staffByMember[id] || []) : undefined,
      officeName: String(m['勤務先名'] || ''),
      officeNumber: String(m['事業所番号'] || ''),
      officePostCode: String(m['勤務先郵便番号'] || ''),
      officePrefecture: String(m['勤務先都道府県'] || ''),
      officeCity: String(m['勤務先市区町村'] || ''),
      officeAddressLine: String(m['勤務先住所'] || ''),
      officeAddressLine2: String(m['勤務先住所2'] || ''),
      phone: String(m['勤務先電話番号'] || ''),
      fax: String(m['勤務先FAX番号'] || ''),
      homePostCode: String(m['自宅郵便番号'] || ''),
      homePrefecture: String(m['自宅都道府県'] || ''),
      homeCity: String(m['自宅市区町村'] || ''),
      homeAddressLine: String(m['自宅住所'] || ''),
      homeAddressLine2: String(m['自宅住所2'] || ''),
      mobilePhone: String(m['携帯電話番号'] || ''),
      mailingPreference: String(m['発送方法コード'] || 'EMAIL'),
      preferredMailDestination: String(m['郵送先区分コード'] || 'OFFICE'),
      staffLimit: (function() {
        var n = Number(m['職員数上限']);
        return isFinite(n) && n >= 1 ? Math.floor(n) : undefined;
      })(),
      email: String(m['代表メールアドレス'] || ''),
      status: (function() {
        var s = String(m['会員状態コード'] || 'ACTIVE');
        if (s === 'WITHDRAWN') return 'WITHDRAWN';
        if (s === 'WITHDRAWAL_SCHEDULED') return 'WITHDRAWAL_SCHEDULED';
        return 'ACTIVE';
      })(),
      joinedDate: normalizeDateInput_(m['入会日']),
      withdrawnDate: normalizeDateInput_(m['退会日']),
      withdrawalProcessDate: normalizeDateInput_(m['退会処理日']),
      midYearWithdrawal: false,
      annualFeeHistory: history,
      participatedTrainingIds: type === 'BUSINESS' ? [] : uniqueStrings_(applicationsByMember[id] || []),
    };
    if (includeAdminStatusNote) {
      mappedMember.statusNote = String(m['ステータスメモ'] || '');
    }
    return mappedMember;
  });
}

function getAnyPasswordLoginIdByMemberId_(ss, memberId) {
  var rows = getRowsAsObjects_(ss, 'T_認証アカウント');
  for (var i = 0; i < rows.length; i += 1) {
    var r = rows[i];
    if (toBoolean_(r['削除フラグ'])) continue;
    if (String(r['認証方式'] || '') !== 'PASSWORD') continue;
    if (!toBoolean_(r['アカウント有効フラグ'])) continue;
    if (String(r['会員ID'] || '') !== String(memberId || '')) continue;
    var loginId = String(r['ログインID'] || '');
    if (loginId) return loginId;
  }
  return '';
}

function clearUnusedIndividualApplicationAddressDefaults_(payload, memberTypeCode) {
  if (!payload || memberTypeCode !== 'INDIVIDUAL') return payload;

  function trimValue(value) {
    return String(value || '').trim();
  }

  var defaultPostCode = '573-';
  var defaultPrefecture = '大阪府';
  var defaultCity = '枚方市';

  var hasOfficeInput =
    !!trimValue(payload.officeName) ||
    !!trimValue(payload.officeAddressLine) ||
    !!trimValue(payload.phone) ||
    !!trimValue(payload.fax) ||
    (trimValue(payload.officePostCode) && trimValue(payload.officePostCode) !== defaultPostCode) ||
    (trimValue(payload.officePrefecture) && trimValue(payload.officePrefecture) !== defaultPrefecture) ||
    (trimValue(payload.officeCity) && trimValue(payload.officeCity) !== defaultCity);

  var hasHomeInput =
    !!trimValue(payload.homeAddressLine) ||
    !!trimValue(payload.mobilePhone) ||
    (trimValue(payload.homePostCode) && trimValue(payload.homePostCode) !== defaultPostCode) ||
    (trimValue(payload.homePrefecture) && trimValue(payload.homePrefecture) !== defaultPrefecture) ||
    (trimValue(payload.homeCity) && trimValue(payload.homeCity) !== defaultCity);

  if (!hasOfficeInput) {
    payload.officePostCode = '';
    payload.officePrefecture = '';
    payload.officeCity = '';
  }

  if (!hasHomeInput) {
    payload.homePostCode = '';
    payload.homePrefecture = '';
    payload.homeCity = '';
  }

  return payload;
}

// ── 入会処理 ──────────────────────────────────────────
function createMember_(payload) {
  if (!payload) throw new Error('ペイロードが空です。');
  var memberTypeCode = String(payload.type || 'INDIVIDUAL');
  var ss = getOrCreateDatabase_();
  if (!isKnownMasterCode_(ss, 'M_会員種別', memberTypeCode)) {
    throw new Error('会員種別が不正です: ' + memberTypeCode);
  }
  payload = clearUnusedIndividualApplicationAddressDefaults_(payload, memberTypeCode);
  validateMemberPayload_(payload, memberTypeCode);
  if (memberTypeCode !== 'BUSINESS') assertMemberMailingCodes_(ss, payload.mailingPreference, payload.preferredMailDestination);

  var sheet = ss.getSheetByName('T_会員');
  if (!sheet) throw new Error('T_会員 シートが見つかりません。');

  // 8桁会員ID生成（UUID先頭8桁の数値化）
  var memberId = payload.id || generateMemberId_();
  // 重複チェック
  if (findRowByColumnValue_(sheet, '会員ID', memberId)) {
    throw new Error('会員ID ' + memberId + ' は既に使用されています。');
  }

  var now = new Date().toISOString();
  var joinedDate = normalizeDateInput_(payload.joinedDate) || Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  var columns = テーブル定義.T_会員;
  var newRow = columns.map(function(col) {
    switch (col) {
      case '会員ID': return memberId;
      case '会員種別コード': return memberTypeCode;
      case '会員状態コード': return 'ACTIVE';
      case '入会日': return joinedDate;
      case '退会日': return '';
      case '姓': return String(payload.lastName || '');
      case '名': return String(payload.firstName || '');
      // v376: kana 列を全角カタカナへ正規化
      case 'セイ': return normalizeAndValidateKana_(payload.lastKana || '', '個人会員のセイ');
      case 'メイ': return normalizeAndValidateKana_(payload.firstKana || '', '個人会員のメイ');
      case '代表メールアドレス': return String(payload.email || '');
      case '携帯電話番号': return String(payload.mobilePhone || '');
      case '勤務先名': return String(payload.officeName || '');
      case '勤務先郵便番号': return String(payload.officePostCode || '');
      case '勤務先都道府県': return String(payload.officePrefecture || '');
      case '勤務先市区町村': return String(payload.officeCity || '');
      case '勤務先住所': return String(payload.officeAddressLine || '');
      case '勤務先住所2': return String(payload.officeAddressLine2 || '');
      case '勤務先電話番号': return String(payload.phone || '');
      case '勤務先FAX番号': return String(payload.fax || '');
      case '自宅郵便番号': return String(payload.homePostCode || '');
      case '自宅都道府県': return String(payload.homePrefecture || '');
      case '自宅市区町村': return String(payload.homeCity || '');
      case '自宅住所': return String(payload.homeAddressLine || '');
      case '自宅住所2': return String(payload.homeAddressLine2 || '');
      case '発送方法コード': return String(payload.mailingPreference || 'EMAIL');
      case '郵送先区分コード': return String(payload.preferredMailDestination || 'OFFICE');
      case '職員数上限': return memberTypeCode === 'BUSINESS' ? (Number(payload.staffLimit) || 10) : '';
      case '作成日時': return now;
      case '更新日時': return now;
      case '削除フラグ': return false;
      case '介護支援専門員番号': return String(payload.careManagerNumber || '');
      case '事業所番号': return String(payload.officeNumber || '');
      default: return '';
    }
  });
  sheet.appendRow(newRow);

  // パスワード認証レコード作成
  var loginId = String(payload.careManagerNumber || '').trim() || memberId;
  var defaultPassword = generateRandomPassword_();
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (authSheet) {
    var salt = generateSalt_();
    var hashed = hashPasswordCurrent_(defaultPassword, salt);
    var authColumns = テーブル定義.T_認証アカウント;
    var authRow = authColumns.map(function(col) {
      switch (col) {
        case '認証ID': return Utilities.getUuid();
        case '認証方式': return 'PASSWORD';
        case 'ログインID': return loginId;
        case 'パスワードハッシュ': return hashed;
        case 'パスワードソルト': return salt;
        case 'GoogleユーザーID': return '';
        case 'Googleメール': return '';
        case 'システムロールコード': return 'MEMBER';
        case '会員ID': return memberId;
        case '職員ID': return '';
        case '最終ログイン日時': return '';
        case 'パスワード更新日時': return now;
        case 'アカウント有効フラグ': return true;
        case 'ログイン失敗回数': return 0;
        case 'ロック状態': return false;
        case '作成日時': return now;
        case '更新日時': return now;
        case '削除フラグ': return false;
        default: return '';
      }
    });
    authSheet.appendRow(authRow);
  }

  // 事業所会員の場合、初期職員レコード作成
  if (memberTypeCode === 'BUSINESS' && payload.staff && payload.staff.length > 0) {
    syncBusinessStaffRows_(ss, memberId, memberTypeCode, payload.staff);
  }

  clearAllDataCache_();
  clearAdminDashboardCache_();
  return {
    created: true,
    memberId: memberId,
    loginId: loginId,
    defaultPassword: defaultPassword,
  };
}

// v376.73: 入会申込のサーバ側検証。公開ポータル（認証不要）から届く値を信用しない。
// 検証パターンは各関数内ローカルに置く方針（build pruner の regex 罠。AGENTS.md §3 の
// 正本レジストリ「GAS 側は各関数内ローカル」に従う）。src/shared/validators.ts と
// 同じ規則なので、片方を変えたらもう片方も同時に直すこと。
function validateMemberApplicationPayload_(payload, memberType) {
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var cmRe = /^[0-9]{8}$/;

  function requireEmail(value, label) {
    if (!emailRe.test(String(value || '').trim())) throw new Error(label + 'の形式が正しくありません。');
  }

  if (memberType === 'BUSINESS') {
    var staff = Array.isArray(payload.staff) ? payload.staff : [];
    if (staff.length === 0) throw new Error('事業所会員は最低1名の職員が必要です。');
    for (var i = 0; i < staff.length; i++) {
      var s = staff[i] || {};
      var label = '職員 ' + (i + 1);
      if (!String(s.lastName || '').trim() || !String(s.firstName || '').trim()) {
        throw new Error(label + ' の氏名が未入力です。');
      }
      if (!cmRe.test(String(s.careManagerNumber || '').trim())) {
        throw new Error(label + ' の介護支援専門員番号は半角数字8桁で入力してください。');
      }
      requireEmail(s.email, label + ' のメールアドレス');
      // 保存形式（全角カタカナ）へ正規化できない文字は、ここで弾く
      normalizeAndValidateKana_(s.lastKana || '', label + ' のセイ', { required: true });
      normalizeAndValidateKana_(s.firstKana || '', label + ' のメイ', { required: true });
    }
    return;
  }

  if (!String(payload.lastName || '').trim() || !String(payload.firstName || '').trim()) {
    throw new Error('氏名が未入力です。');
  }
  normalizeAndValidateKana_(payload.lastKana || '', 'セイ', { required: true });
  normalizeAndValidateKana_(payload.firstKana || '', 'メイ', { required: true });
  requireEmail(payload.email, 'メールアドレス');
  // 介護支援専門員番号は個人会員のみ必須（賛助会員は任意。RD BR-01）
  var cm = String(payload.careManagerNumber || '').trim();
  if (memberType === 'INDIVIDUAL') {
    if (!cmRe.test(cm)) throw new Error('介護支援専門員番号は半角数字8桁で入力してください。');
  } else if (cm && !cmRe.test(cm)) {
    throw new Error('介護支援専門員番号は半角数字8桁で入力してください。');
  }
}

// ── 入会申込処理（統合フォーム用）──────────────────────────
function enqueueMemberApplicationChangeRequest_(payload) {
  payload = payload || {};
  var memberType = String(payload.memberType || '').trim();
  var ss = getOrCreateDatabase_();
  if (!isKnownMasterCode_(ss, 'M_会員種別', memberType)) {
    throw new Error('会員種別が不正です。');
  }
  // 受付確認・承認・却下の連絡先は、事業所会員では代表者を正本とする。
  // 職員配列の先頭を使うと、入力順によって一般メンバーへ誤送信されるため禁止する。
  var contactEmail = memberType === 'BUSINESS'
    ? resolveBusinessApplicationRepresentativeEmail_(payload.staff)
    : String(payload.email || '').trim();
  if (!contactEmail) throw new Error('連絡先メールアドレスが必要です。');
  consumePublicSubmissionQuota_('APPLICATION', contactEmail);

  // v376.73: 申込時のサーバ側検証。
  // これまで検証は承認時が最初で、公開エンドポイント（認証不要）は種別と連絡先しか見ていなかった。
  // 画面の検証は入力の手助けであって単独の防御にしない（AGENTS.md §6）。
  // ここでは「保存できない値を申請として溜めない」ことだけを担保し、
  // 重複判定など DB 状態に依存する検査は従来どおり承認時に行う。
  validateMemberApplicationPayload_(payload, memberType);

  var applicantName = memberType === 'BUSINESS'
    ? String(payload.officeName || '事業所会員申込').trim()
    : joinHumanNameParts_(payload.lastName, payload.firstName).trim();
  var requestId = 'CR' + Date.now() + '_' + generatePublicActionToken_().slice(0, 8);
  var now = new Date().toISOString();
  if (!ss.getSheetByName('T_変更申請')) {
    var newSheet = getOrCreateSheet_(ss, 'T_変更申請');
    writeSheetHeaders_(newSheet, テーブル定義['T_変更申請']);
  }
  appendRowsByHeaders_(ss, 'T_変更申請', [{
    申請ID: requestId,
    会員ID: '',
    会員種別コード: memberType,
    申請種別コード: 'MEMBER_APPLICATION',
    申請状態コード: 'PENDING',
    申請内容JSON: JSON.stringify({ applicationPayload: payload }),
    連絡先メールアドレス: contactEmail,
    申請者表示名: applicantName,
    申請日時: now,
    処理日時: '',
    処理者メールアドレス: '',
    処理備考: '',
    作成日時: now,
    更新日時: now,
    削除フラグ: false,
  }]);
  // v368: 申込受付メールをテンプレ化（システム設定で件名・本文を編集可能）
  sendApplicationReceiptMail_(ss, {
    contactEmail: contactEmail,
    applicantName: applicantName,
    requestId: requestId,
    requestType: 'MEMBER_APPLICATION',
    memberTypeLabel: memberTypeLabel_(memberType),
  });
  notifyMembershipChatSafely_(ss, 'REQUEST', {
    '手続種別': chatMembershipRequestTypeLabel_('MEMBER_APPLICATION'),
    '会員名': applicantName,
    '会員種別': memberTypeLabel_(memberType),
    '会員ID': '',
    '申請ID': requestId,
    '日時': now,
    '変更内容': '',
    '異常内容': '',
  });
  return { queued: true, success: true, requestId: requestId };
}

function submitMemberApplication_(payload) {
  assertPublicPortalIntakeOpen_(getOrCreateDatabase_(), 'MEMBERSHIP');
  return enqueueMemberApplicationChangeRequest_(payload);
}

// v376.73: 入会承認の本体。呼び出し側（approveAdminChangeRequest_）は 1 度に 1 件しか
// 処理しないが、事務局が複数人で同時に承認すると会員ID・ログインIDの採番が競合するため
// ScriptLock で直列化する（管理画面の資格情報発行 adminIssueMemberCredential_ と同じ扱い）。
function createMemberApplicationDirectLocked_(payload) {
  if (!payload) throw new Error('ペイロードが空です。');
  var memberTypeCode = String(payload.memberType || '');
  var ss = getOrCreateDatabase_();
  if (!isKnownMasterCode_(ss, 'M_会員種別', memberTypeCode)) {
    throw new Error('会員種別が不正です: ' + memberTypeCode);
  }
  payload = clearUnusedIndividualApplicationAddressDefaults_(payload, memberTypeCode);
  if (memberTypeCode !== 'BUSINESS') assertMemberMailingCodes_(ss, payload.mailingPreference, payload.preferredMailDestination);

  var now = new Date().toISOString();
  var joinedDate = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  var memberId = generateMemberId_();

  // v209: 認証情報メール設定を一度だけ読み込む
  var credEmailEnabledRaw = getSystemSettingValue_(ss, 'CREDENTIAL_EMAIL_ENABLED');
  var credEmailEnabled = credEmailEnabledRaw === '' || credEmailEnabledRaw === null
    ? true
    : String(credEmailEnabledRaw) !== 'false';
  // v219: 会員種別ラベル・年会費をマージタグ用に解決
  var memberTypeLabelForEmail = memberTypeCode;
  var annualFeeForEmail = 0;
  try {
    var memberTypeMasterRows = getRowsAsObjects_(ss, 'M_会員種別');
    var mtRow = null;
    for (var i = 0; i < memberTypeMasterRows.length; i++) {
      if (String(memberTypeMasterRows[i]['コード'] || '') === memberTypeCode) {
        mtRow = memberTypeMasterRows[i];
        break;
      }
    }
    if (mtRow) {
      memberTypeLabelForEmail = String(mtRow['名称'] || memberTypeCode);
      annualFeeForEmail = parseInt(String(mtRow['年会費金額'] || '0'), 10) || 0;
    }
  } catch (e) {
    // マスタ取得失敗はメール送信を止めない
  }
  var credEmailOpts = {
    from: String(getSystemSettingValue_(ss, 'CREDENTIAL_EMAIL_FROM') || '').trim(),
    subject: String(getSystemSettingValue_(ss, 'CREDENTIAL_EMAIL_SUBJECT') || ''),
    body: String(getSystemSettingValue_(ss, 'CREDENTIAL_EMAIL_BODY') || ''),
    memberTypeLabel: memberTypeLabelForEmail,
    annualFee: annualFeeForEmail,
  };

  var memberSheet = ss.getSheetByName('T_会員');
  if (!memberSheet) throw new Error('T_会員 シートが見つかりません。');
  var registrationIndex = buildMemberApplicationRegistrationIndex_(ss);
  var transitionSummary = [];
  var isBusiness = memberTypeCode === 'BUSINESS';
  // v376.73: 採番の重複回避に使う。この関数の中で払い出すたび push して、
  // 同一申込内（事業所の複数職員）での衝突も防ぐ。
  var existingLoginIds = collectExistingLoginIds_(ss);
  var businessStaffLimit = resolveDefaultBusinessStaffLimit_(ss);

  // 番号の重なりは、会員行を書き込む前に申込全体で確かめる（承認で止める）。
  // 重なった相手（氏名・会員ID）を承認者に示す。2026-10-14 の本番確認で、個人の申込は下の分岐が先に
  // 相手を示さない文言で止めていたのが分かったので、この検査を前に置いた。
  var applicationCareManagerNumbers = isBusiness
    ? (Array.isArray(payload.staff) ? payload.staff.map(function(st) { return st && st.careManagerNumber; }) : [])
    : [payload.careManagerNumber];
  var careManagerConflicts = findCareManagerRegistrationConflicts_(registrationIndex, applicationCareManagerNumbers);
  if (careManagerConflicts.length > 0) {
    throw new Error(careManagerConflicts.join('\n') + '\n' + CARE_MANAGER_CONFLICT_GUIDANCE_);
  }

  if (!isBusiness) {
    var applicantCareManagerNumber = String(payload.careManagerNumber || '').trim();
    if (applicantCareManagerNumber) {
      var duplicateIndividual = getSingleRegistrationCandidate_(
        registrationIndex.activeMembersByCareManager[applicantCareManagerNumber],
        '同じ介護支援専門員番号の会員が複数登録されています。事務局へお問い合わせください。'
      );
      if (duplicateIndividual) {
        throw new Error('この介護支援専門員番号は既に登録済みです。同じ人物の二重登録はできません。');
      }

      var sourceStaff = getSingleRegistrationCandidate_(
        registrationIndex.activeStaffByCareManager[applicantCareManagerNumber],
        '同じ介護支援専門員番号の事業所会員メンバーが複数登録されています。事務局へお問い合わせください。'
      );
      if (sourceStaff) {
        // 2026-10-13: 以前はここで既存の職員を個人会員へ自動で切り替えていた（承認で止める方針で廃止）。
        throw new Error('この介護支援専門員番号は既存の事業所職員として登録済みです。' + CARE_MANAGER_CONFLICT_GUIDANCE_);
      }
    }
  }

  if (isBusiness) {
    var officeNumber = String(payload.officeNumber || '').trim();
    if (!officeNumber) throw new Error('事業所番号が未入力です。');
    if (!/^[A-Za-z0-9]{10}$/.test(officeNumber)) {
      throw new Error('事業所番号は半角英数字10文字で入力してください。');
    }
    var duplicateOffice = getSingleRegistrationCandidate_(
      registrationIndex.activeBusinessByOfficeNumber[officeNumber],
      '同じ事業所番号の事業所会員が複数登録されています。事務局へお問い合わせください。'
    );
    if (duplicateOffice) {
      throw new Error('この事業所番号は既に登録済みです。同じ事業所の二重登録はできません。');
    }
  }

  if (findRowByColumnValue_(memberSheet, '会員ID', memberId)) {
    memberId = generateMemberId_(); // retry once
  }

  // T_会員 レコード作成
  var memberColumns = テーブル定義.T_会員;
  var newMemberRow = memberColumns.map(function(col) {
    switch (col) {
      case '会員ID': return memberId;
      case '会員種別コード': return memberTypeCode;
      case '会員状態コード': return 'ACTIVE';
      case '入会日': return joinedDate;
      case '退会日': return '';
      case '姓': return isBusiness ? '' : String(payload.lastName || '');
      case '名': return isBusiness ? '' : String(payload.firstName || '');
      // v376: kana 列を全角カタカナへ正規化（事業所会員は空のまま）
      case 'セイ': return isBusiness ? '' : normalizeAndValidateKana_(payload.lastKana || '', '個人会員のセイ');
      case 'メイ': return isBusiness ? '' : normalizeAndValidateKana_(payload.firstKana || '', '個人会員のメイ');
      case '代表メールアドレス': return isBusiness ? '' : String(payload.email || '');
      case '携帯電話番号': return String(payload.mobilePhone || '');
      case '勤務先名': return String(payload.officeName || '');
      case '勤務先郵便番号': return String(payload.officePostCode || '');
      case '勤務先都道府県': return String(payload.officePrefecture || '');
      case '勤務先市区町村': return String(payload.officeCity || '');
      case '勤務先住所': return String(payload.officeAddressLine || '');
      case '勤務先住所2': return String(payload.officeAddressLine2 || '');
      case '勤務先電話番号': return String(payload.phone || '');
      case '勤務先FAX番号': return String(payload.fax || '');
      case '自宅郵便番号': return String(payload.homePostCode || '');
      case '自宅都道府県': return String(payload.homePrefecture || '');
      case '自宅市区町村': return String(payload.homeCity || '');
      case '自宅住所': return String(payload.homeAddressLine || '');
      case '自宅住所2': return String(payload.homeAddressLine2 || '');
      case '発送方法コード': return isBusiness ? '' : String(payload.mailingPreference || 'EMAIL');
      case '郵送先区分コード': return isBusiness ? 'OFFICE' : String(payload.preferredMailDestination || 'OFFICE');
      // v376.73: システム設定 DEFAULT_BUSINESS_STAFF_LIMIT を正本にする（従来は 10 のリテラル）
      case '職員数上限': return isBusiness ? businessStaffLimit : '';
      case '作成日時': return now;
      case '更新日時': return now;
      case '削除フラグ': return false;
      case '介護支援専門員番号': return isBusiness ? '' : String(payload.careManagerNumber || '');
      case '事業所番号': return String(payload.officeNumber || '');
      default: return '';
    }
  });
  memberSheet.appendRow(newMemberRow);

  var result = {
    created: true,
    memberId: memberId,
    loginId: null,
    staffCredentials: null,
    // docs/307 S11（2026-10-24）: 送ったものだけを数える。以前は配信停止で抑止されたものも「送信済み」に数えた。
    emailsSent: 0,
    emailsSuppressed: 0,
    transitionSummary: transitionSummary,
  };
  var countMailOutcome = function(outcome) {
    if (outcome && outcome.sent) result.emailsSent++;
    else result.emailsSuppressed++;
  };

  if (isBusiness) {
    // 事業所会員: 職員ごとに認証レコード作成 + メール送信（v265: 代表者/メンバー別テンプレート）
    var bizOfficeName = String(payload.officeName || '').trim();
    var bizEmailSettings = getBizEmailSettings_(ss);
    var staffList = Array.isArray(payload.staff) ? payload.staff.filter(function(staff) {
      if (!staff || typeof staff !== 'object') return false;
      return [
        staff.lastName,
        staff.firstName,
        staff.lastKana,
        staff.firstKana,
        staff.careManagerNumber,
        staff.email,
      ].some(function(value) {
        return String(value || '').trim() !== '';
      });
    }) : [];
    if (staffList.length === 0) throw new Error('事業所会員は最低1名の職員が必要です。');

    var repCount = 0;
    for (var r = 0; r < staffList.length; r++) {
      if (String(staffList[r].role || '') === 'REPRESENTATIVE') repCount++;
    }
    if (repCount === 0) throw new Error('代表者は必ず1名登録してください。');
    if (repCount > 1) throw new Error('代表者は1名のみです。');

    // v376.73: 職員数の上限を承認時にも検証する。
    // 申込フォームには人数制限が無く、承認側にも検査が無かったため、上限を超える事業所を
    // 作れてしまっていた（作成後は T_会員.職員数上限 と矛盾した状態になる）。
    if (staffList.length > businessStaffLimit) {
      throw new Error('登録できる職員数の上限（' + businessStaffLimit + '名）を超えています。申込内容を確認してください。');
    }

    // v376.73: **書き込む前に全職員を検証する**。
    // 以前はループの中で検証と appendRow を交互に行っていたため、3 人目で弾かれると
    // 会員レコードと 1〜2 人目だけが残り、申請は PENDING のままという壊れた状態になった
    // （再承認するとその事業所がもう 1 件できる）。スプレッドシートにトランザクションは無いので、
    // 「落ちる条件を先に出し切る」ことで部分書き込みの窓を最小化する。
    var seenCareManagerNumbers = {};
    for (var v = 0; v < staffList.length; v++) {
      var vs = staffList[v];
      var vCm = String(vs.careManagerNumber || '').trim();
      var vEmail = String(vs.email || '').trim();
      if (!vCm) throw new Error('職員 ' + (v + 1) + ' の介護支援専門員番号が未入力です。');
      if (!vEmail) throw new Error('職員 ' + (v + 1) + ' のメールアドレスが未入力です。');
      if (seenCareManagerNumbers[vCm]) {
        throw new Error('同じ介護支援専門員番号の職員が重複しています。職員 ' + (v + 1) + ' を確認してください。');
      }
      seenCareManagerNumbers[vCm] = true;
      // カナは保存形式（全角カタカナ）に正規化できることをここで確認する。
      // 不正文字を含む行を書き込むと、読み取り側 normalizeStaffNameFields_ が例外を投げ、
      // 管理画面の会員一覧が丸ごと開けなくなる（v376.73 以前は公開フォームの検証のみが防いでいた）。
      normalizeAndValidateKana_(vs.lastKana || '', '職員 ' + (v + 1) + ' のセイ');
      normalizeAndValidateKana_(vs.firstKana || '', '職員 ' + (v + 1) + ' のメイ');
    }

    var staffCredentials = [];
    var staffSheet = ss.getSheetByName('T_事業所職員');
    var authSheet = ss.getSheetByName('T_認証アカウント');

    for (var i = 0; i < staffList.length; i++) {
      var s = staffList[i];
      var cmNumber = String(s.careManagerNumber || '').trim();
      var staffEmail = String(s.email || '').trim();
      var staffRole = String(s.role || 'STAFF');
      if (!hasMasterOption_(ss, 'M_職員権限', staffRole)) staffRole = 'STAFF';

      // 未入力・リスト内重複・カナの検査は上の事前検証で済んでいる（書き込み前に落とすため）

      var duplicateMember = getSingleRegistrationCandidate_(
        registrationIndex.activeMembersByCareManager[cmNumber],
        '同じ介護支援専門員番号の会員が複数登録されています。事務局へお問い合わせください。'
      );
      if (duplicateMember) {
        // 2026-10-13: 以前は既存の個人会員を自動で退会させて職員にしていた（承認で止める方針で廃止）。
        throw new Error('職員 ' + (i + 1) + ' の介護支援専門員番号は既存の会員として登録済みです。' + CARE_MANAGER_CONFLICT_GUIDANCE_);
      }

      var duplicateStaff = getSingleRegistrationCandidate_(
        registrationIndex.activeStaffByCareManager[cmNumber],
        '同じ介護支援専門員番号の事業所会員メンバーが複数登録されています。事務局へお問い合わせください。'
      );
      if (duplicateStaff) {
        // 2026-10-13: 以前は他事業所の職員を自動で移籍させていた（承認で止める方針で廃止）。
        throw new Error('職員 ' + (i + 1) + ' の介護支援専門員番号は既存の事業所職員として登録済みです。' + CARE_MANAGER_CONFLICT_GUIDANCE_);
      }

      var staffId = Utilities.getUuid().substring(0, 8);
      var staffName = joinHumanNameParts_(s.lastName, s.firstName);
      // v376.73: フリガナ列も正規化後の値から作る（セイ/メイ と表記が食い違わないように）
      var staffKana = joinHumanNameParts_(
        normalizeAndValidateKana_(s.lastKana || '', '職員のセイ'),
        normalizeAndValidateKana_(s.firstKana || '', '職員のメイ'));

      // T_事業所職員に挿入
      if (staffSheet) {
        var staffColumns = テーブル定義.T_事業所職員;
        var staffRow = staffColumns.map(function(col) {
          switch (col) {
            case '職員ID': return staffId;
            case '会員ID': return memberId;
            case '姓': return String(s.lastName || '').trim();
            case '名': return String(s.firstName || '').trim();
            // v376.73: 個人会員と同じく全角カタカナへ正規化して保存する。
            // ここだけ素通しだったため、他経路（公開の職員追加・会員マイページ・管理画面）と
            // 保存形式が揃わず、不正文字が入ると読み取り側で例外になる状態だった。
            case 'セイ': return normalizeAndValidateKana_(s.lastKana || '', '職員のセイ');
            case 'メイ': return normalizeAndValidateKana_(s.firstKana || '', '職員のメイ');
            case '氏名': return staffName.trim();
            case 'フリガナ': return staffKana.trim();
            case 'メールアドレス': return staffEmail;
            case '職員権限コード': return staffRole;
            case '職員状態コード': return 'ENROLLED';
            case '入会日': return joinedDate;
            case '退会日': return '';
            case '介護支援専門員番号': return cmNumber;
            // 2026-10-13: 申込の「メール配信を受け取る」を反映する。以前は 'YES' 固定で、
            // 配信を断った職員にも一斉メールが届いていた。未指定（古い画面）は従来どおり YES。
            case 'メール配信希望コード': return s.receiveEmail === false ? 'NO' : 'YES';
            case '作成日時': return now;
            case '更新日時': return now;
            case '削除フラグ': return false;
            default: return '';
          }
        });
        staffSheet.appendRow(staffRow);
      }

      // T_認証アカウントに挿入。
      // v376.73: 以前は `var loginId = cmNumber;` と直書きしており、既存ログインIDとの
      // 重複を検査していなかった。退会者の認証行はログインIDを保持したまま残るため
      // （退会は有効フラグを false にするだけ）、同じ番号で再入会すると重複行が生まれ、
      // findRowByColumnValue_ が古い無効行を先に返して新会員がログインできなくなっていた。
      // 管理画面の資格情報発行と同じ generateCmBasedLoginId_ を通して採番する。
      var loginId = generateCmBasedLoginId_(cmNumber, existingLoginIds);
      existingLoginIds.push(loginId);
      var defaultPassword = generateRandomPassword_();
      if (authSheet) {
        var salt = generateSalt_();
        var hashed = hashPasswordCurrent_(defaultPassword, salt);
        var authColumns = テーブル定義.T_認証アカウント;
        var authRow = authColumns.map(function(col) {
          switch (col) {
            case '認証ID': return Utilities.getUuid();
            case '認証方式': return 'PASSWORD';
            case 'ログインID': return loginId;
            case 'パスワードハッシュ': return hashed;
            case 'パスワードソルト': return salt;
            case 'GoogleユーザーID': return '';
            case 'Googleメール': return '';
            case 'システムロールコード': return 'MEMBER';
            case '会員ID': return memberId;
            case '職員ID': return staffId;
            case '最終ログイン日時': return '';
            case 'パスワード更新日時': return now;
            case 'アカウント有効フラグ': return true;
            case 'ログイン失敗回数': return 0;
            case 'ロック状態': return false;
            case '作成日時': return now;
            case '更新日時': return now;
            case '削除フラグ': return false;
            default: return '';
          }
        });
        authSheet.appendRow(authRow);
      }

      // v265: 事業所メール送信 — 全体フラグ最優先、代表者/メンバー別テンプレート
      if (credEmailEnabled) {
        // v376.66: 事業所メールにも 会員種別 / 年会費 を差し込む。
        // 従来は個人/賛助の認証情報メール（sendCredentialEmail_）だけが対応しており、
        // 事業所メールの本文に {{会員種別}} {{年会費}} を書くとタグのまま会員へ届いていた。
        var bizVars = {
          氏名: staffName.trim(),
          ログインID: loginId,
          パスワード: defaultPassword,
          会員マイページURL: MEMBER_PORTAL_URL,
          事業所名: bizOfficeName,
          会員種別: credEmailOpts.memberTypeLabel || '',
          年会費: formatAnnualFee_(credEmailOpts.annualFee),
        };
        var fromAddr = credEmailOpts.from || '';
        try {
          if (staffRole === 'REPRESENTATIVE') {
            if (bizEmailSettings.bizRepEmailEnabled) {
              var repBody = renderMergeTags_(bizEmailSettings.bizRepEmailBody, bizVars);
              countMailOutcome(deliverMail_('BIZ_REP_EMAIL', staffEmail, bizEmailSettings.bizRepEmailSubject, repBody, { from: fromAddr }));
            }
          } else {
            if (bizEmailSettings.bizStaffEmailEnabled) {
              var memberBody = renderMergeTags_(bizEmailSettings.bizStaffEmailBody, bizVars);
              countMailOutcome(deliverMail_('BIZ_STAFF_EMAIL', staffEmail, bizEmailSettings.bizStaffEmailSubject, memberBody, { from: fromAddr }));
            }
          }
        } catch (e) {
          Logger.log('biz email send failed for ' + staffEmail + ' (' + staffRole + '): ' + e.message);
        }
      }

      staffCredentials.push({
        name: staffName.trim(),
        loginId: loginId,
        email: staffEmail,
      });
    }
    result.staffCredentials = staffCredentials;

  } else {
    // 個人 / 賛助: 会員単体の認証レコード作成
    // v376.73: 採番を管理画面の資格情報発行（adminIssueMemberCredential_）と同じ関数に集約した。
    //   - 個人会員: 介護支援専門員番号（8 桁）。既存と重複する場合は先頭に 1〜9 を付けて回避
    //   - 賛助会員: 番号を持たないことが多く、その場合は「9 + 8 桁」で採番（RD BR-01）
    // 以前は賛助会員に会員ID（8 桁数字）をそのまま使っており、仕様と食い違ううえ、
    // 個人会員のログインID（＝ 8 桁の専門員番号）と同じ値空間で衝突しても検出できなかった。
    var loginId = generateCmBasedLoginId_(String(payload.careManagerNumber || '').trim(), existingLoginIds);
    existingLoginIds.push(loginId);
    var defaultPassword = generateRandomPassword_();

    var authSheet = ss.getSheetByName('T_認証アカウント');
    if (authSheet) {
      var salt = generateSalt_();
      var hashed = hashPasswordCurrent_(defaultPassword, salt);
      var authColumns = テーブル定義.T_認証アカウント;
      var authRow = authColumns.map(function(col) {
        switch (col) {
          case '認証ID': return Utilities.getUuid();
          case '認証方式': return 'PASSWORD';
          case 'ログインID': return loginId;
          case 'パスワードハッシュ': return hashed;
          case 'パスワードソルト': return salt;
          case 'GoogleユーザーID': return '';
          case 'Googleメール': return '';
          case 'システムロールコード': return 'MEMBER';
          case '会員ID': return memberId;
          case '職員ID': return '';
          case '最終ログイン日時': return '';
          case 'パスワード更新日時': return now;
          case 'アカウント有効フラグ': return true;
          case 'ログイン失敗回数': return 0;
          case 'ロック状態': return false;
          case '作成日時': return now;
          case '更新日時': return now;
          case '削除フラグ': return false;
          default: return '';
        }
      });
      authSheet.appendRow(authRow);
    }

    result.loginId = loginId;

    // v265: 個人・賛助会員メール送信（全体フラグ + 個別フラグ両方チェック）
    var indSuppEmailEnabledRaw = getSystemSettingValue_(ss, 'IND_SUPP_EMAIL_ENABLED');
    var indSuppEmailEnabled = (indSuppEmailEnabledRaw === '' || indSuppEmailEnabledRaw === null)
      ? true : String(indSuppEmailEnabledRaw) !== 'false';
    var email = String(payload.email || '').trim();
    if (email && credEmailEnabled && indSuppEmailEnabled) {
      try {
        var memberName = String(payload.lastName || '') + ' ' + String(payload.firstName || '');
        countMailOutcome(sendCredentialEmail_(email, loginId, defaultPassword, memberName.trim(), credEmailOpts));
      } catch (e) {
        Logger.log('sendCredentialEmail_ failed for ' + email + ': ' + e.message);
      }
    }
  }

  clearAllDataCache_();
  clearAdminDashboardCache_();
  return result;
}

function isRegisteredMemberForApplication_(row) {
  if (!row || toBoolean_(row['削除フラグ'])) return false;
  return !isInactiveMemberStatusForIdentity_(row['会員状態コード']);
}

// 2026-10-13 operator 判断: 申込・追加された介護支援専門員番号が、既存の会員・職員と重なるときは
// **承認で止める**。以前は番号だけを根拠に既存者を自動で移し（個人→職員・他事業所→自事業所）、
// メールを申請者の値で上書きしていた。他人の番号で申し込めば、その人の会員資格とメールを奪えた。
// 同一人物の移籍なら、事務局が会員の移行機能で手動で行う。
// 戻り値: 重なりの説明（承認者向け）の配列。重なりが無ければ空配列。
function findCareManagerRegistrationConflicts_(registrationIndex, careManagerNumbers) {
  var messages = [];
  (careManagerNumbers || []).forEach(function(raw) {
    var cm = String(raw || '').trim();
    if (!cm) return;
    (registrationIndex.activeMembersByCareManager[cm] || []).forEach(function(e) {
      var m = e.member || {};
      messages.push('介護支援専門員番号 ' + cm + ' は、既存の会員「' + joinHumanNameParts_(m['姓'], m['名']).trim()
        + '」（会員ID: ' + e.memberId + '）として登録済みです。');
    });
    (registrationIndex.activeStaffByCareManager[cm] || []).forEach(function(e) {
      var st = e.staff || {};
      var office = e.member ? String(e.member['勤務先名'] || '') : '';
      messages.push('介護支援専門員番号 ' + cm + ' は、事業所「' + office + '」の職員「'
        + joinHumanNameParts_(st['姓'], st['名']).trim() + '」（会員ID: ' + e.memberId + '）として登録済みです。');
    });
  });
  return messages;
}

var CARE_MANAGER_CONFLICT_GUIDANCE_ = '同一人物かを確認し、移籍であれば会員の移行機能で手動で処理してください。この申請は差し戻してください。';

function isRegisteredStaffForApplication_(staffRow, memberRow) {
  if (!staffRow || !memberRow) return false;
  if (toBoolean_(staffRow['削除フラグ'])) return false;
  if (String(staffRow['職員状態コード'] || 'ENROLLED') !== 'ENROLLED') return false;
  return isRegisteredMemberForApplication_(memberRow);
}

function buildMemberApplicationRegistrationIndex_(ss) {
  var memberRows = getRowsAsObjects_(ss, 'T_会員');
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員');
  var authRows = getRowsAsObjects_(ss, 'T_認証アカウント');
  var memberById = {};
  var authByMemberId = {};
  var authByStaffId = {};
  var activeMembersByCareManager = {};
  var activeStaffByCareManager = {};
  var activeBusinessByOfficeNumber = {};

  function push(map, key, value) {
    if (!key) return;
    if (!map[key]) map[key] = [];
    map[key].push(value);
  }

  for (var i = 0; i < memberRows.length; i += 1) {
    var member = memberRows[i];
    var memberId = String(member['会員ID'] || '').trim();
    if (!memberId) continue;
    memberById[memberId] = member;
  }

  for (var ai = 0; ai < authRows.length; ai += 1) {
    var auth = authRows[ai];
    if (toBoolean_(auth['削除フラグ'])) continue;
    var authMemberId = String(auth['会員ID'] || '').trim();
    var authStaffId = String(auth['職員ID'] || '').trim();
    if (authMemberId && !authStaffId && !authByMemberId[authMemberId]) authByMemberId[authMemberId] = auth;
    if (authStaffId && !authByStaffId[authStaffId]) authByStaffId[authStaffId] = auth;
  }

  for (var mi = 0; mi < memberRows.length; mi += 1) {
    var memberRow = memberRows[mi];
    if (!isRegisteredMemberForApplication_(memberRow)) continue;
    var memberId2 = String(memberRow['会員ID'] || '').trim();
    var memberType = String(memberRow['会員種別コード'] || '').trim();
    var careManagerNumber = String(memberRow['介護支援専門員番号'] || '').trim();
    var officeNumber = String(memberRow['事業所番号'] || '').trim();
    var authMember = authByMemberId[memberId2];
    var memberEntry = {
      memberId: memberId2,
      memberType: memberType,
      careManagerNumber: careManagerNumber,
      officeNumber: officeNumber,
      member: memberRow,
      auth: authMember || null,
      loginId: authMember ? String(authMember['ログインID'] || '').trim() : '',
    };
    if (memberType !== 'BUSINESS' && careManagerNumber) push(activeMembersByCareManager, careManagerNumber, memberEntry);
    if (memberType === 'BUSINESS' && officeNumber) push(activeBusinessByOfficeNumber, officeNumber, memberEntry);
  }

  for (var si = 0; si < staffRows.length; si += 1) {
    var staffRow = staffRows[si];
    var parentMemberId = String(staffRow['会員ID'] || '').trim();
    var parentMember = memberById[parentMemberId];
    if (!isRegisteredStaffForApplication_(staffRow, parentMember)) continue;
    var staffId = String(staffRow['職員ID'] || '').trim();
    var staffCareManagerNumber = String(staffRow['介護支援専門員番号'] || '').trim();
    var authStaff = authByStaffId[staffId];
    var staffEntry = {
      memberId: parentMemberId,
      staffId: staffId,
      staffRole: String(staffRow['職員権限コード'] || '').trim(),
      careManagerNumber: staffCareManagerNumber,
      member: parentMember,
      staff: staffRow,
      auth: authStaff || null,
      loginId: authStaff ? String(authStaff['ログインID'] || '').trim() : '',
    };
    if (staffCareManagerNumber) push(activeStaffByCareManager, staffCareManagerNumber, staffEntry);
  }

  return {
    activeMembersByCareManager: activeMembersByCareManager,
    activeStaffByCareManager: activeStaffByCareManager,
    activeBusinessByOfficeNumber: activeBusinessByOfficeNumber,
    memberById: memberById,
    authByMemberId: authByMemberId,
    authByStaffId: authByStaffId,
  };
}


// v368: 変更申請の人間可読サマリーを生成する
//   changeData: { fields?: {key:value}, staffAdd?: [...], staffRemove?: [...], applicationPayload?: {...} }
//   requestType: MEMBER_APPLICATION / MEMBER_UPDATE / WITHDRAWAL / STAFF_ADD / STAFF_REMOVE
function buildChangeSummaryText_(changeData, requestType) {
  if (!changeData || typeof changeData !== 'object') return '';
  var lines = [];
  var FIELD_LABELS = {
    lastName: '姓', firstName: '名', lastKana: '姓カナ', firstKana: '名カナ',
    email: 'メールアドレス', mobilePhone: '携帯電話',
    workplaceName: '勤務先名', officeName: '事業所名',
    workplacePostalCode: '勤務先郵便番号', workplacePrefecture: '勤務先都道府県',
    workplaceCity: '勤務先市区町村', workplaceAddress1: '勤務先住所', workplaceAddress2: '勤務先住所2',
    workplacePhone: '勤務先電話番号', workplaceFax: '勤務先FAX',
    homePostalCode: '自宅郵便番号', homePrefecture: '自宅都道府県',
    homeCity: '自宅市区町村', homeAddress1: '自宅住所', homeAddress2: '自宅住所2',
    careManagerNumber: '介護支援専門員番号',
    deliveryMethodCode: '通知方法', deliveryDestinationCode: '郵送先区分',
  };
  if (requestType === 'WITHDRAWAL') {
    lines.push('・退会申請');
    lines.push('・退会方式: ' + (changeData.withdrawalMethod === 'IMMEDIATE' ? '即時退会（承認日に適用）' : '年度末退会'));
  } else if (requestType === 'MEMBER_APPLICATION') {
    lines.push('・新規入会申込');
  } else if (changeData.fields && typeof changeData.fields === 'object') {
    var keys = Object.keys(changeData.fields);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var v = String(changeData.fields[k] == null ? '' : changeData.fields[k]).trim();
      if (!v) continue;
      var label = FIELD_LABELS[k] || k;
      lines.push('・' + label + ': ' + v);
    }
  }
  if (Array.isArray(changeData.staffAdd) && changeData.staffAdd.length > 0) {
    changeData.staffAdd.forEach(function(s) {
      lines.push('・職員追加: ' + (s.lastName || '') + ' ' + (s.firstName || '') + '（CM番号 ' + (s.careManagerNumber || '') + '）');
    });
  }
  if (Array.isArray(changeData.staffRemove) && changeData.staffRemove.length > 0) {
    changeData.staffRemove.forEach(function(s) {
      lines.push('・職員除籍: ' + (s.lastName || '') + ' ' + (s.firstName || '') + '（CM番号 ' + (s.careManagerNumber || '') + '）');
    });
  }
  // v372.5: 既存職員情報の変更
  if (Array.isArray(changeData.staffUpdate) && changeData.staffUpdate.length > 0) {
    changeData.staffUpdate.forEach(function(s) {
      var changes = [];
      ['lastName', 'firstName', 'lastKana', 'firstKana', 'email', 'careManagerNumber'].forEach(function(k) {
        if (Object.prototype.hasOwnProperty.call(s, k) && String(s[k] || '').trim()) {
          changes.push((FIELD_LABELS[k] || k) + '→' + s[k]);
        }
      });
      lines.push('・職員情報変更（職員ID: ' + (s.staffId || '') + '）: ' + changes.join(', '));
    });
  }
  if (lines.length === 0) return '';
  return ['変更内容:'].concat(lines).join('\n') + '\n';
}

// v368: 申請種別ラベル変換（テンプレ差込変数 {{申請種別}} 用）
var REQUEST_TYPE_LABEL_ = {
  MEMBER_APPLICATION: '入会申込',
  MEMBER_UPDATE: '登録情報変更申請',
  WITHDRAWAL: '退会申請',
  STAFF_ADD: '職員追加申請',
  STAFF_REMOVE: '職員除籍申請',
};

// 事業所入会申込の申請者連絡先は、職員入力順ではなく REPRESENTATIVE のメールアドレス。
// 代表者不在・メール未入力は空文字で返し、呼出元で fail-close する。
function resolveBusinessApplicationRepresentativeEmail_(staff) {
  if (!Array.isArray(staff)) return '';
  for (var i = 0; i < staff.length; i++) {
    var row = staff[i] || {};
    if (String(row.role || '').trim() !== 'REPRESENTATIVE') continue;
    return String(row.email || '').trim();
  }
  return '';
}

function generateMemberId_() {
  var uuid = Utilities.getUuid().replace(/-/g, '');
  var hash = 0;
  for (var i = 0; i < uuid.length; i++) {
    hash = ((hash << 5) - hash + uuid.charCodeAt(i)) >>> 0;
  }
  // 2026-11-01: 1 始まりの 8 桁に限る（10000000〜99999999）。以前は約 1 割が 0 始まりになり、
  // 会員ID の列が数値で保存されて先頭の 0 が消え、作った番号で探せなかった（docs/317 §9.3 E7b-2）。
  // 賛助会員などでは会員ID がログインIDを兼ねる（ログインIDの列は文字列なので 0 が残り、食い違う）。
  return String(10000000 + (hash % 90000000));
}

// v376.72: T_研修申込.申込ID の採番はこの 1 関数に集約する（AGENTS.md §3 の DRY 原則）。
// 以前は 4 箇所が別々に採番しており、同じ列に 3 通りの形式が混在していた
// （会員セルフ = AP- + 10 桁 / 外部申込 = 素の UUID / 名簿への手動追加 = AP- + 8 桁）。
// 一意性は保たれていたため既存データは振り直さない。取消は完全一致で引くため形式変更の影響を受けない。
function generateTrainingApplyId_() {
  return 'AP-' + Utilities.getUuid().replace(/-/g, '').substring(0, 10).toUpperCase();
}

// v376.73: 事業所会員の職員数上限（全体既定）の取得をここに集約する。
// 以前は getSystemSettings_ が `Number(m['DEFAULT_BUSINESS_STAFF_LIMIT'] || 10)` で読み、
// 入会承認は 10 をリテラルで書いていたため、設定を変えても新規申込に反映されなかった。
function resolveDefaultBusinessStaffLimit_(ss) {
  var map = getSystemSettingMap_(ss || getOrCreateDatabase_());
  var raw = Number(map['DEFAULT_BUSINESS_STAFF_LIMIT']);
  return isFinite(raw) && raw >= 1 ? Math.floor(raw) : 10;
}

// v376.73: 認証アカウントの現在のログインID一覧。採番の重複回避に使う。
// 削除フラグや有効フラグで絞らない — 無効な行でもログインIDは占有され続けるため
// （findRowByColumnValue_ は先頭一致の 1 行しか返さない。重複すると後から作られた側が
//  永久にログインできなくなる。退会者の再入会で実際に起こる）。
function collectExistingLoginIds_(ss) {
  return getRowsAsObjects_(ss || getOrCreateDatabase_(), 'T_認証アカウント')
    .map(function(r) { return String(r['ログインID'] || ''); })
    .filter(Boolean);
}

// ── 退会処理 ──────────────────────────────────────────
function withdrawMember_(payload) {
  if (!payload || !payload.memberId) throw new Error('会員IDが未指定です。');
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_会員');
  if (!sheet) throw new Error('T_会員 シートが見つかりません。');

  var found = findRowByColumnValue_(sheet, '会員ID', String(payload.memberId));
  if (!found) throw new Error('対象会員が見つかりません。');

  var cols = found.columns;
  var row = found.row.slice();

  var currentStatus = String(row[cols['会員状態コード']] || 'ACTIVE');
  if (currentStatus === 'WITHDRAWN') throw new Error('この会員は既に退会済みです。');

  var withdrawnDate = normalizeDateInput_(payload.withdrawnDate) || Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  row[cols['会員状態コード']] = 'WITHDRAWN';
  row[cols['退会日']] = withdrawnDate;
  var midYear = payload.midYearWithdrawal === true;
  row[cols['削除フラグ']] = midYear;
  row[cols['更新日時']] = new Date().toISOString();

  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);

  // v125: 退会時に関連する T_認証アカウント の有効フラグも false にする
  disableAuthAccountsByMemberId_(ss, String(payload.memberId));

  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();
  return { withdrawn: true, memberId: String(payload.memberId), withdrawnDate: withdrawnDate };
}

// ── 事業所職員の除籍処理 ──────────────────────────────────────
// T_事業所職員の状態を LEFT に変更し、T_認証アカウントの有効フラグを false にする
function removeStaffFromOffice_(payload) {
  if (!payload || !payload.memberId || !payload.staffId) {
    throw new Error('会員IDまたは職員IDが未指定です。');
  }
  var ss = getOrCreateDatabase_();
  var staffSheet = ss.getSheetByName('T_事業所職員');
  if (!staffSheet) throw new Error('T_事業所職員 シートが見つかりません。');

  var staffFound = findRowByColumnValue_(staffSheet, '職員ID', String(payload.staffId));
  if (!staffFound) throw new Error('対象職員が見つかりません。');

  var sCols = staffFound.columns;
  var sRow = staffFound.row.slice();

  // 所属事業所の一致確認
  if (String(sRow[sCols['会員ID']] || '') !== String(payload.memberId)) {
    throw new Error('職員IDと会員IDが一致しません。');
  }

  // 既に除籍済みチェック
  if (String(sRow[sCols['職員状態コード']] || '') === 'LEFT') {
    throw new Error('この職員は既に除籍済みです。');
  }

  // 代表者は除籍不可（先に代表者変更が必要）
  if (String(sRow[sCols['職員権限コード']] || '') === 'REPRESENTATIVE') {
    throw new Error('代表者は除籍できません。先に代表者を変更してください。');
  }

  var nowIso = new Date().toISOString();
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');

  sRow[sCols['職員状態コード']] = 'LEFT';
  sRow[sCols['退会日']] = today;
  sRow[sCols['職員権限コード']] = 'STAFF';
  sRow[sCols['更新日時']] = nowIso;
  staffSheet.getRange(staffFound.rowNumber, 1, 1, sRow.length).setValues([sRow]);

  // T_認証アカウントの有効フラグを false にする
  disableAuthAccountsByStaffId_(ss, String(payload.staffId));

  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();
  return {
    removed: true,
    memberId: String(payload.memberId),
    staffId: String(payload.staffId),
    withdrawnDate: today,
  };
}

// ── 会員IDに紐づく全認証アカウントの有効フラグを false にする ──
// docs/307 S42（2026-10-24）: シートや列が無ければ止め、無効にした件数を返す。
// 以前は黙って戻り、退会・削除なのにログインが有効なまま「完了」になりえた。
function disableAuthAccountsByMemberId_(ss, memberId) {
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet) throw new Error('T_認証アカウント シートが無いため、ログインを止められませんでした。');
  if (authSheet.getLastRow() < 2) return 0;
  var headers = authSheet.getRange(1, 1, 1, authSheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i++) cols[headers[i]] = i;
  if (cols['会員ID'] == null || cols['アカウント有効フラグ'] == null) {
    throw new Error('T_認証アカウント に「会員ID」「アカウント有効フラグ」の列が無いため、ログインを止められませんでした。');
  }

  var data = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, authSheet.getLastColumn()).getValues();
  var disabled = 0;
  for (var r = 0; r < data.length; r++) {
    if (String(data[r][cols['会員ID']] || '') === memberId) {
      data[r][cols['アカウント有効フラグ']] = false;
      if (cols['更新日時'] != null) data[r][cols['更新日時']] = new Date().toISOString();
      authSheet.getRange(r + 2, 1, 1, data[r].length).setValues([data[r]]);
      disabled++;
    }
  }
  return disabled;
}

// ── 職員IDに紐づく認証アカウントの有効フラグを false にする ──
// v376.100: 職員の介護支援専門員番号を変えたときにログインIDを追従させる。
// 個人会員（CM番号）・事業所会員（事業所番号）は以前からログインIDを書き換えており、
// 職員だけが追従していなかった（v376.99 の調査で判明）。
//
// 既存の不一致は直さない。ここは「これから変えたとき」にだけ効く。
// 一括で書き換えると、現に使われているログインIDを奪うことになるため。
//
// 戻り値: { changed: bool, before: string, after: string, staffEmail: string }
// T_認証アカウント のログインIDを書き換える唯一の場所（2026-09-27 集約）。
//
// 呼び出し元は「どの行か」と「新しいIDを何にするか」だけを決める。
// 行の特定・重複の検出・更新日時・書き戻し・before/after の返却はここが持つ。
// 以前は会員のCM番号・事業所番号・職員のCM番号で 3 箇所が別々にシートを叩いており、
// 重複回避が入っているのは職員だけだった。
//
// resolveNewLoginId(before, otherLoginIds) が新しいIDを返す。
// 空を返すか before と同じなら何もしない。
// 返したIDが他の行と衝突する場合は **書き換えない**（同じログインIDが 2 つできると
// どちらもログインできなくなる。v376.73 で実際に起きた）。衝突は collision で返す。
function updateAuthAccountLoginId_(ss, matchColumn, matchValue, resolveNewLoginId) {
  var result = { changed: false, before: '', after: '', collision: false };
  var target = String(matchValue || '').trim();
  if (!target) return result;

  var sheet = ss.getSheetByName('T_認証アカウント');
  if (!sheet || sheet.getLastRow() < 2) return result;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var h = 0; h < headers.length; h++) cols[headers[h]] = h;
  if (cols[matchColumn] == null || cols['ログインID'] == null) return result;

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();

  // 退会者の行もログインIDを保持したまま残るので、全行から集める。
  var allLoginIds = [];
  for (var e = 0; e < data.length; e++) {
    var lid = String(data[e][cols['ログインID']] || '');
    if (lid) allLoginIds.push(lid);
  }

  for (var r = 0; r < data.length; r++) {
    if (String(data[r][cols[matchColumn]] || '') !== target) continue;
    if (cols['削除フラグ'] != null && toBoolean_(data[r][cols['削除フラグ']])) continue;

    var before = String(data[r][cols['ログインID']] || '');
    var others = allLoginIds.filter(function(v) { return v !== before; });
    var after = String(resolveNewLoginId(before, others) || '').trim();
    if (!after || after === before) return result;
    if (others.indexOf(after) !== -1) {
      result.collision = true;
      result.before = before;
      result.after = after;
      Logger.log('[updateAuthAccountLoginId_] 衝突のため据え置き: ' + before + ' -> ' + after);
      return result;
    }

    data[r][cols['ログインID']] = after;
    if (cols['更新日時'] != null) data[r][cols['更新日時']] = new Date().toISOString();
    sheet.getRange(r + 2, 1, 1, data[r].length).setValues([data[r]]);
    result.changed = true;
    result.before = before;
    result.after = after;
    return result;
  }
  return result;
}

function syncStaffLoginIdToCmNumber_(ss, staffId, newCmNumber) {
  var cm = String(newCmNumber || '').trim();
  if (!cm) return { changed: false, before: '', after: '', staffEmail: '' };
  // 採番の方針だけをここに残す。CM 番号は 8 桁で、衝突したら先頭に 1〜9 を付けて避ける。
  var updated = updateAuthAccountLoginId_(ss, '職員ID', staffId, function(before, others) {
    return generateCmBasedLoginId_(cm, others);
  });
  return { changed: updated.changed, before: updated.before, after: updated.after, staffEmail: '' };
}

function disableAuthAccountsByStaffId_(ss, staffId) {
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet || authSheet.getLastRow() < 2) return;
  var headers = authSheet.getRange(1, 1, 1, authSheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i++) cols[headers[i]] = i;
  if (cols['職員ID'] == null || cols['アカウント有効フラグ'] == null) return;

  var data = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, authSheet.getLastColumn()).getValues();
  for (var r = 0; r < data.length; r++) {
    if (String(data[r][cols['職員ID']] || '') === staffId) {
      data[r][cols['アカウント有効フラグ']] = false;
      data[r][cols['更新日時']] = new Date().toISOString();
      authSheet.getRange(r + 2, 1, 1, data[r].length).setValues([data[r]]);
    }
  }
}

// ── v127: 職員IDに紐づく認証アカウントの有効フラグを true に復旧する ──
function enableAuthAccountsByStaffId_(ss, staffId) {
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet || authSheet.getLastRow() < 2) return;
  var headers = authSheet.getRange(1, 1, 1, authSheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i++) cols[headers[i]] = i;
  if (cols['職員ID'] == null || cols['アカウント有効フラグ'] == null) return;

  var data = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, authSheet.getLastColumn()).getValues();
  for (var r = 0; r < data.length; r++) {
    if (String(data[r][cols['職員ID']] || '') === staffId) {
      data[r][cols['アカウント有効フラグ']] = true;
      data[r][cols['更新日時']] = new Date().toISOString();
      authSheet.getRange(r + 2, 1, 1, data[r].length).setValues([data[r]]);
    }
  }
}

// ── v126: 事業所会員の予約退会（Scheduled Cancellation）──
// 翌年度4/1に退会を予約する。退会日まではサービス完全利用可能。
function scheduleWithdrawMember_(payload) {
  if (!payload || !payload.memberId) throw new Error('会員IDが未指定です。');
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_会員');
  if (!sheet) throw new Error('T_会員 シートが見つかりません。');

  var found = findRowByColumnValue_(sheet, '会員ID', String(payload.memberId));
  if (!found) throw new Error('対象会員が見つかりません。');

  var cols = found.columns;
  var row = found.row.slice();

  var currentStatus = String(row[cols['会員状態コード']] || 'ACTIVE');
  if (currentStatus === 'WITHDRAWN') throw new Error('この会員は既に退会済みです。');
  if (currentStatus === 'WITHDRAWAL_SCHEDULED') throw new Error('この会員は既に退会予定です。');

  // 翌年度4/1を算出
  var nextFyStart = getNextFiscalYearStart_(new Date());
  var withdrawnDate = Utilities.formatDate(nextFyStart, 'Asia/Tokyo', 'yyyy-MM-dd');

  row[cols['会員状態コード']] = 'WITHDRAWAL_SCHEDULED';
  row[cols['退会日']] = withdrawnDate;
  row[cols['更新日時']] = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);

  // 注: アカウントは無効化しない（退会日まで利用可能）
  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();
  return {
    scheduled: true,
    memberId: String(payload.memberId),
    withdrawnDate: withdrawnDate,
  };
}

// ── v126: 予約退会のキャンセル ──
function cancelScheduledWithdraw_(payload) {
  if (!payload || !payload.memberId) throw new Error('会員IDが未指定です。');
  var ss = getOrCreateDatabase_();
  var sheet = ss.getSheetByName('T_会員');
  if (!sheet) throw new Error('T_会員 シートが見つかりません。');

  var found = findRowByColumnValue_(sheet, '会員ID', String(payload.memberId));
  if (!found) throw new Error('対象会員が見つかりません。');

  var cols = found.columns;
  var row = found.row.slice();

  var currentStatus = String(row[cols['会員状態コード']] || 'ACTIVE');
  if (currentStatus !== 'WITHDRAWAL_SCHEDULED') throw new Error('この会員は退会予定ではありません。');

  row[cols['会員状態コード']] = 'ACTIVE';
  row[cols['退会日']] = '';
  row[cols['更新日時']] = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);

  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();
  return { cancelled: true, memberId: String(payload.memberId) };
}

// ── v127: 職員個別更新（status/role 変更対応拡張）──
function updateStaff_(payload) {
  if (!payload || !payload.staffId) throw new Error('職員IDが未指定です。');
  var ss = getOrCreateDatabase_();
  var staffSheet = ss.getSheetByName('T_事業所職員');
  if (!staffSheet) throw new Error('T_事業所職員 シートが見つかりません。');

  var found = findRowByColumnValue_(staffSheet, '職員ID', String(payload.staffId));
  if (!found) throw new Error('対象職員が見つかりません。');

  var cols = found.columns;
  var row = found.row.slice();

  // 所属事業所の一致確認（セキュリティ）
  var memberId = String(row[cols['会員ID']] || '');
  if (payload.memberId && memberId !== String(payload.memberId)) {
    throw new Error('職員IDと会員IDが一致しません。');
  }

  // 更新可能フィールド（Allowlist）
  var nowIso = new Date().toISOString();
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  // v147: 除籍済み職員は氏名・フリガナ必須チェックをスキップ
  var staffCurrentStatus = String(row[cols['職員状態コード']] || 'ENROLLED');
  var hasStaffNamePayload =
    payload.name != null ||
    payload.kana != null ||
    payload.lastName != null ||
    payload.firstName != null ||
    payload.lastKana != null ||
    payload.firstKana != null;
  if (hasStaffNamePayload) {
    var normalizedStaffNames = normalizeStaffNameFields_({
      姓: payload.lastName != null ? payload.lastName : (cols['姓'] != null ? row[cols['姓']] : ''),
      名: payload.firstName != null ? payload.firstName : (cols['名'] != null ? row[cols['名']] : ''),
      セイ: payload.lastKana != null ? payload.lastKana : (cols['セイ'] != null ? row[cols['セイ']] : ''),
      メイ: payload.firstKana != null ? payload.firstKana : (cols['メイ'] != null ? row[cols['メイ']] : ''),
      氏名: payload.name != null ? payload.name : row[cols['氏名']],
      フリガナ: payload.kana != null ? payload.kana : row[cols['フリガナ']],
    });
    if (staffCurrentStatus !== 'LEFT') {
      if (!normalizedStaffNames.name) throw new Error('職員氏名は必須です。');
      if (!normalizedStaffNames.kana) throw new Error('職員フリガナは必須です。');
    }
    if (cols['姓'] != null) row[cols['姓']] = normalizedStaffNames.lastName;
    if (cols['名'] != null) row[cols['名']] = normalizedStaffNames.firstName;
    if (cols['セイ'] != null) row[cols['セイ']] = normalizedStaffNames.lastKana;
    if (cols['メイ'] != null) row[cols['メイ']] = normalizedStaffNames.firstKana;
    row[cols['氏名']] = normalizedStaffNames.name;
    row[cols['フリガナ']] = normalizedStaffNames.kana;
  }
  if (payload.email != null) {
    row[cols['メールアドレス']] = String(payload.email).trim();
  }
  if (payload.careManagerNumber != null) {
    // v372.4: admin 権限（MASTER/ADMIN）の場合 1〜10 桁半角英数字を許容、それ以外は厳格 8 桁数字
    var rawCm = String(payload.careManagerNumber).trim();
    if (rawCm) {
      var allowRelaxedStaffCm = isAllowedRelaxedCmNumber_(payload.__adminSession);
      if (allowRelaxedStaffCm) {
        if (!isValidCmNumberStrict_(rawCm) && !isValidCmNumberRelaxed_(rawCm)) {
          throw new Error('介護支援専門員番号は 8 桁の半角数字、または例外として 1〜10 桁の半角英数字で入力してください（看護師等: HN+事業所番号下8桁 / 社会福祉士: HS+事業所番号下8桁）。');
        }
      } else {
        if (!isValidCmNumberStrict_(rawCm)) {
          throw new Error('介護支援専門員番号は8桁の半角数字で入力してください。');
        }
      }
    }
    row[cols['介護支援専門員番号']] = normalizeCmNumberForStorage_(rawCm);
  }

  // ── role 変更 ──
  var currentRole = String(row[cols['職員権限コード']] || 'STAFF');
  if (payload.role != null) {
    var newRole = normalizeBusinessStaffRole_(payload.role);
    if (newRole !== currentRole) {
      var allStaff = staffSheet.getRange(2, 1, staffSheet.getLastRow() - 1, staffSheet.getLastColumn()).getValues();
      // REPRESENTATIVE から降格する場合: 同事業所に他の ENROLLED 職員が必要
      if (currentRole === 'REPRESENTATIVE' && newRole !== 'REPRESENTATIVE') {
        var enrolledOthers = allStaff.filter(function(r) {
          return String(r[cols['会員ID']] || '') === memberId
            && String(r[cols['職員ID']] || '') !== String(payload.staffId)
            && String(r[cols['職員状態コード']] || '') === 'ENROLLED';
        });
        if (enrolledOthers.length === 0) {
          throw new Error('在籍職員が自分のみのため、代表者の権限変更はできません。個人会員への転換をご利用ください。');
        }
      }
      // REPRESENTATIVE に昇格する場合: 旧代表者を自動で ADMIN に降格
      if (newRole === 'REPRESENTATIVE' && currentRole !== 'REPRESENTATIVE') {
        for (var ri = 0; ri < allStaff.length; ri++) {
          var sr = allStaff[ri];
          if (String(sr[cols['会員ID']] || '') === memberId
            && String(sr[cols['職員ID']] || '') !== String(payload.staffId)
            && String(sr[cols['職員状態コード']] || '') === 'ENROLLED'
            && normalizeBusinessStaffRole_(sr[cols['職員権限コード']]) === 'REPRESENTATIVE') {
            sr[cols['職員権限コード']] = 'ADMIN';
            sr[cols['更新日時']] = new Date().toISOString();
            staffSheet.getRange(ri + 2, 1, 1, sr.length).setValues([sr]);
          }
        }
      }
      row[cols['職員権限コード']] = newRole;
    }
  }

  // ── status 変更（v127 追加）──
  var currentStatus = String(row[cols['職員状態コード']] || 'ENROLLED');
  var statusChanged = false;
  if (payload.status != null) {
    var newStatus = String(payload.status).trim();
    if (!hasMasterOption_(null, 'M_職員状態', newStatus)) {
      throw new Error('職員状態の値が不正です: ' + newStatus);
    }
    if (newStatus !== currentStatus) {
      row[cols['職員状態コード']] = newStatus;
      statusChanged = true;
      if (newStatus === 'LEFT') {
        row[cols['退会日']] = today;
        // v146: 除籍処分 → 権限を強制的にSTAFFに降格（OWASP A01 最小権限原則）
        var roleAtExpulsion = String(row[cols['職員権限コード']] || 'STAFF');
        if (roleAtExpulsion !== 'STAFF') {
          if (roleAtExpulsion === 'REPRESENTATIVE') {
            var allStaffForDemotion = staffSheet.getRange(2, 1, staffSheet.getLastRow() - 1, staffSheet.getLastColumn()).getValues();
            var enrolledOthersForDemotion = allStaffForDemotion.filter(function(r) {
              return String(r[cols['会員ID']] || '') === memberId
                && String(r[cols['職員ID']] || '') !== String(payload.staffId)
                && String(r[cols['職員状態コード']] || '') === 'ENROLLED';
            });
            if (enrolledOthersForDemotion.length === 0) {
              throw new Error('在籍職員が自分のみのため、除籍できません。個人会員への転換をご利用ください。');
            }
          }
          row[cols['職員権限コード']] = 'STAFF';
        }
      } else {
        // ENROLLED に復帰 → 退会日クリア
        row[cols['退会日']] = '';
      }
    }
  }

  // v372.5: withdrawnDate を明示指定された場合は status='LEFT' のとき限定で上書き
  if (payload.withdrawnDate != null && String(payload.withdrawnDate).trim() && cols['退会日'] != null) {
    var curStatus = String(row[cols['職員状態コード']] || '');
    if (curStatus === 'LEFT') {
      var normalizedW = normalizeDateInput_(payload.withdrawnDate);
      if (normalizedW) row[cols['退会日']] = normalizedW;
    }
  }
  if (payload.joinedDate != null) {
    var normalized = normalizeDateInput_(payload.joinedDate);
    if (normalized) row[cols['入会日']] = normalized;
  }
  if (payload.mailingPreference != null && cols['メール配信希望コード'] != null) {
    var mp = String(payload.mailingPreference).trim();
    row[cols['メール配信希望コード']] = (mp === 'NO') ? 'NO' : 'YES';
  }
  row[cols['更新日時']] = nowIso;
  staffSheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);

  // ── status 変更時の認証アカウント連動 ──
  if (statusChanged) {
    var newStatus2 = String(row[cols['職員状態コード']]);
    if (newStatus2 === 'LEFT') {
      disableAuthAccountsByStaffId_(ss, String(payload.staffId));
      // v297: 退職時に現職の役員レコードを自動退任
      autoRetireOfficerByStaffId_(ss, String(payload.staffId), nowIso);
    } else {
      enableAuthAccountsByStaffId_(ss, String(payload.staffId));
    }
  }

  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();
  return {
    updated: true,
    staffId: String(payload.staffId),
    memberId: memberId,
    status: String(row[cols['職員状態コード']] || ''),
    role: String(row[cols['職員権限コード']] || ''),
  };
}

// ── v126: 翌年度の4月1日を返す ──
function getNextFiscalYearStart_(referenceDate) {
  var fyStart = getFiscalYearStart_(referenceDate);
  return new Date(fyStart.getFullYear() + 1, 3, 1, 0, 0, 0, 0);
}

// ── v125: 会員種別変更（個人↔事業所メンバーのシームレス転換）──
function rebindAuthPrincipal_(ss, options) {
  options = options || {};
  var sourceMemberId = String(options.sourceMemberId || '').trim();
  var sourceStaffId = String(options.sourceStaffId || '').trim();
  var targetMemberId = String(options.targetMemberId || '').trim();
  var targetStaffId = String(options.targetStaffId || '').trim();
  var targetRoleCode = String(options.targetRoleCode || '').trim();
  var updatedAt = String(options.updatedAt || new Date().toISOString());
  var result = { updatedCount: 0, authIds: [] };
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet || authSheet.getLastRow() < 2) return result;

  var headers = authSheet.getRange(1, 1, 1, authSheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i += 1) cols[headers[i]] = i;
  var rows = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, authSheet.getLastColumn()).getValues();

  for (var r = 0; r < rows.length; r += 1) {
    if (toBoolean_(rows[r][cols['削除フラグ']])) continue;
    var rowMemberId = String(rows[r][cols['会員ID']] || '').trim();
    var rowStaffId = String(rows[r][cols['職員ID']] || '').trim();
    var shouldUpdate = sourceStaffId
      ? rowStaffId === sourceStaffId
      : !!sourceMemberId && rowMemberId === sourceMemberId;
    if (!shouldUpdate) continue;

    var originalAuthRow = rows[r].slice();
    rows[r][cols['会員ID']] = targetMemberId;
    rows[r][cols['職員ID']] = targetStaffId;
    if (cols['システムロールコード'] != null && targetRoleCode) {
      rows[r][cols['システムロールコード']] = targetRoleCode;
    }
    if (cols['アカウント有効フラグ'] != null) {
      rows[r][cols['アカウント有効フラグ']] = true;
    }
    if (cols['更新日時'] != null) {
      rows[r][cols['更新日時']] = updatedAt;
    }
    // options.tx があれば予約だけ（会員移行の一括更新・docs/317 I）。無ければその場で書く
    if (options.tx) txUpdateRow_(options.tx, 'T_認証アカウント', r + 2, originalAuthRow, rows[r]);
    else authSheet.getRange(r + 2, 1, 1, rows[r].length).setValues([rows[r]]);

    result.updatedCount += 1;
    result.authIds.push(String(rows[r][cols['認証ID']] || ''));
  }

  return result;
}

// tx（省略可）: 渡せば予約だけ（会員移行の一括更新）。省略すればその場で書く
function syncWhitelistMemberLinkByAuthIds_(ss, authIds, memberId, updatedAt, tx) {
  var normalizedAuthIds = uniqueStrings_(authIds || []).filter(function(id) { return !!String(id || '').trim(); });
  if (!normalizedAuthIds.length) return 0;

  var whitelistSheet = ss.getSheetByName('T_管理者Googleホワイトリスト');
  if (!whitelistSheet || whitelistSheet.getLastRow() < 2) return 0;

  var headers = whitelistSheet.getRange(1, 1, 1, whitelistSheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i += 1) cols[headers[i]] = i;
  var rows = whitelistSheet.getRange(2, 1, whitelistSheet.getLastRow() - 1, whitelistSheet.getLastColumn()).getValues();
  var updatedCount = 0;

  for (var r = 0; r < rows.length; r += 1) {
    if (toBoolean_(rows[r][cols['削除フラグ']])) continue;
    var linkedAuthId = String(rows[r][cols['紐付け認証ID']] || '').trim();
    if (normalizedAuthIds.indexOf(linkedAuthId) === -1) continue;

    var originalWhitelistRow = rows[r].slice();
    if (cols['紐付け会員ID'] != null) {
      rows[r][cols['紐付け会員ID']] = memberId;
    }
    if (cols['変更日時'] != null) {
      rows[r][cols['変更日時']] = updatedAt;
    }
    if (cols['更新日時'] != null) {
      rows[r][cols['更新日時']] = updatedAt;
    }
    if (tx) txUpdateRow_(tx, 'T_管理者Googleホワイトリスト', r + 2, originalWhitelistRow, rows[r]);
    else whitelistSheet.getRange(r + 2, 1, 1, rows[r].length).setValues([rows[r]]);
    updatedCount += 1;
  }

  return updatedCount;
}

function isInactiveMemberStatusForIdentity_(status) {
  var value = String(status || 'ACTIVE');
  return value === 'WITHDRAWN' || value === 'TRANSFERRED';
}

function getSingleRegistrationCandidate_(candidates, duplicateMessage) {
  if (!candidates || candidates.length === 0) return null;
  if (candidates.length > 1) throw new Error(duplicateMessage);
  return candidates[0];
}

// tx（省略可）: 渡せば予約だけ（会員移行の一括更新。本体と同じ 1 回で書くので完了記録になる）
function appendPersonMergeLog_(ss, entry, tx) {
  if (!ss.getSheetByName('T_人物統合ログ')) {
    // シートの作成だけは先に SpreadsheetApp で行う（一括更新より前。txCommit_ が flush してから送る）
    var sheet = getOrCreateSheet_(ss, 'T_人物統合ログ');
    writeSheetHeaders_(sheet, テーブル定義['T_人物統合ログ']);
  }
  var now = entry.executedAt || new Date().toISOString();
  var logRow = {
    ログID: entry.logId || ('PML' + Date.now() + '_' + Utilities.getUuid().slice(0, 8)),
    処理種別: entry.action || '',
    介護支援専門員番号: entry.careManagerNumber || '',
    旧会員ID: entry.oldMemberId || '',
    旧職員ID: entry.oldStaffId || '',
    新会員ID: entry.newMemberId || '',
    新職員ID: entry.newStaffId || '',
    結果コード: entry.result || 'OK',
    詳細JSON: JSON.stringify(entry.details || {}),
    実行者メール: entry.actorEmail || '',
    実行日時: now,
    作成日時: now,
    削除フラグ: false,
  };
  if (tx) txAppend_(tx, 'T_人物統合ログ', logRow);
  else appendRowsByHeaders_(ss, 'T_人物統合ログ', [logRow]);
}

// tx（省略可）: 渡せば予約だけ（会員移行の一括更新）。省略すればその場で書く（役員の紐づけ変更など）
function rebindPersonReferenceTable_(ss, tableName, oldMemberId, oldStaffId, newMemberId, newStaffId, now, tx) {
  var sheet = ss.getSheetByName(tableName);
  if (!sheet || sheet.getLastRow() < 2) return 0;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i += 1) cols[String(headers[i] || '')] = i;
  if (cols['会員ID'] == null && cols['職員ID'] == null) return 0;

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var targetPerson = officerPersonRef_(newMemberId, newStaffId);
  var updated = 0;
  for (var r = 0; r < data.length; r += 1) {
    if (cols['削除フラグ'] != null && toBoolean_(data[r][cols['削除フラグ']])) continue;
    if (!rowBelongsToOfficerPerson_({
      '会員ID': cols['会員ID'] != null ? data[r][cols['会員ID']] : '',
      '職員ID': cols['職員ID'] != null ? data[r][cols['職員ID']] : '',
    }, oldMemberId, oldStaffId)) continue;

    var originalRow = data[r].slice();
    if (cols['会員ID'] != null) data[r][cols['会員ID']] = targetPerson.memberId;
    if (cols['職員ID'] != null) data[r][cols['職員ID']] = targetPerson.staffId;
    if (cols['更新日時'] != null) data[r][cols['更新日時']] = now;
    if (tx) txUpdateRow_(tx, tableName, r + 2, originalRow, data[r]);
    else sheet.getRange(r + 2, 1, 1, data[r].length).setValues([data[r]]);
    updated += 1;
  }
  return updated;
}

function migratePersonOwnedReferences_(ss, opts) {
  var oldMemberId = String(opts.oldMemberId || '');
  var oldStaffId = String(opts.oldStaffId || '');
  var newMemberId = String(opts.newMemberId || '');
  var newStaffId = String(opts.newStaffId || '');
  var now = opts.updatedAt || new Date().toISOString();
  var tx = opts.tx || null; // 渡されれば予約だけ（会員移行の一括更新）
  var counts = {};

  counts['T_研修申込'] = migrateTrainingApplications_(ss, oldMemberId, oldStaffId, newMemberId, newStaffId, tx);
  // 2026-10-25: T_支払い も職員ID を持つので、役員まわり 4 表を同じく付け替える（以前は会員→会員のときだけ）
  OFFICER_PERSON_TABLES_.forEach(function(tableName) {
    counts[tableName] = rebindPersonReferenceTable_(ss, tableName, oldMemberId, oldStaffId, newMemberId, newStaffId, now, tx);
  });
  if (oldMemberId && newMemberId && !oldStaffId && !newStaffId) {
    counts['T_年会費納入履歴'] = rebindPersonReferenceTable_(ss, 'T_年会費納入履歴', oldMemberId, '', newMemberId, '', now, tx);
    counts['T_年会費更新履歴'] = rebindPersonReferenceTable_(ss, 'T_年会費更新履歴', oldMemberId, '', newMemberId, '', now, tx);
  }
  return counts;
}

function assertSingleActiveAffiliationByCareManager_(ss, careManagerNumber, contextLabel) {
  var normalized = String(careManagerNumber || '').trim();
  if (!normalized) return;

  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(row) {
    return !toBoolean_(row['削除フラグ'])
      && String(row['介護支援専門員番号'] || '').trim() === normalized
      && String(row['会員種別コード'] || '') !== 'BUSINESS'
      && !isInactiveMemberStatusForIdentity_(row['会員状態コード']);
  });
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(row) {
    return !toBoolean_(row['削除フラグ'])
      && String(row['介護支援専門員番号'] || '').trim() === normalized
      && String(row['職員状態コード'] || 'ENROLLED') === 'ENROLLED';
  });

  if (memberRows.length > 0 && staffRows.length > 0) {
    throw new Error((contextLabel || '会員種別変換') + ' 後の整合性チェックに失敗しました。介護支援専門員番号 ' + normalized + ' に個人/賛助会員と事業所会員メンバーが同時に有効で残っています。');
  }
  if (staffRows.length > 1) {
    var dupIds = staffRows.map(function(r) { return r['職員ID']; }).join(', ');
    throw new Error((contextLabel || '会員種別変換') + ' 後の整合性チェックに失敗しました。介護支援専門員番号 ' + normalized + ' の在籍職員レコードが複数存在します（職員ID: ' + dupIds + '）。');
  }
}

// ── 操作ID: 移行 1 回ごとの識別子。完了記録（T_人物統合ログ のログID）を本体と同じ一括更新で書く ──
function normalizeConversionOperationId_(raw) {
  var s = String(raw == null ? '' : raw).trim();
  if (!s) return '';
  if (s.length < 8 || s.length > 64) throw new Error('操作IDの形式が正しくありません。');
  for (var i = 0; i < s.length; i += 1) {
    var ch = s.charCodeAt(i);
    var ok = (ch >= 48 && ch <= 57) || (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) || ch === 45;
    if (!ok) throw new Error('操作IDの形式が正しくありません。');
  }
  return 'MC-' + s;
}

// 完了記録を探す（SpreadsheetApp で読む。書込みより前・別の実行で使う）
function findMemberConversionRecord_(ss, logId) {
  if (!logId) return null;
  var rows = getRowsAsObjects_(ss, 'T_人物統合ログ');
  for (var i = 0; i < rows.length; i += 1) {
    if (String(rows[i]['ログID'] || '') === logId && !toBoolean_(rows[i]['削除フラグ'])) return rows[i];
  }
  return null;
}

function memberConversionResultFromRecord_(record, operationLogId) {
  var details = {};
  try { details = JSON.parse(String(record['詳細JSON'] || '{}')) || {}; } catch (e) { details = {}; }
  return {
    converted: true,
    alreadyApplied: true,
    operationId: operationLogId,
    direction: String(record['処理種別'] || ''),
    newMemberId: String(record['新会員ID'] || ''),
    newStaffId: String(record['新職員ID'] || ''),
    sourceMemberId: String(record['旧会員ID'] || ''),
    sourceStaffId: String(record['旧職員ID'] || ''),
    officeWithdrawn: !!details.officeWithdrawn,
  };
}

// 応答が失われたときの照会（画面から。読むだけ）
function getMemberConversionResult_(payload) {
  var logId = normalizeConversionOperationId_(payload && payload.operationId);
  if (!logId) throw new Error('操作IDを指定してください。');
  var record = findMemberConversionRecord_(getOrCreateDatabase_(), logId);
  return record ? { found: true, result: memberConversionResultFromRecord_(record, logId) } : { found: false, operationId: logId };
}

// 一括更新の結果が不明（5xx・応答なし）のとき、完了記録を API で読んで確かめる（P0: SpreadsheetApp は古い）
function confirmConversionAppliedViaApi_(ss, logId) {
  try {
    var range = encodeURIComponent("'T_人物統合ログ'!A:A");
    var res = UrlFetchApp.fetch('https://sheets.googleapis.com/v4/spreadsheets/' + encodeURIComponent(ss.getId()) + '/values/' + range, {
      method: 'get',
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true,
    });
    if (res.getResponseCode() !== 200) return 'UNKNOWN';
    var values = (JSON.parse(res.getContentText() || '{}').values) || [];
    for (var i = 0; i < values.length; i += 1) if (String(values[i][0] || '') === logId) return 'APPLIED';
    return 'UNKNOWN'; // 記録が見えないだけでは未実行と断定しない（docs/316 §6）
  } catch (e) {
    return 'UNKNOWN';
  }
}

// 2026-10-31: 移行が書き込む全表と、無条件に読み書きする列（docs/316 §2・A）。
// 以前は 2 表だけで、役員まわり・ホワイトリストは表や列が無いと 0 件として素通りしていた。
// T_人物統合ログ は無ければ appendPersonMergeLog_ が作るので含めない。
// 列はテーブル定義に存在すること（test:officer-person が確かめる）。
var MEMBER_CONVERSION_REQUIRED_COLUMNS_ = [
  { table: 'T_会員', columns: ['会員ID', '会員種別コード', '会員状態コード', '入会日', '退会日', '介護支援専門員番号', '更新日時', '削除フラグ'] },
  { table: 'T_事業所職員', columns: ['職員ID', '会員ID', '職員権限コード', '職員状態コード', '入会日', '退会日', '介護支援専門員番号', '更新日時', '削除フラグ'] },
  { table: 'T_認証アカウント', columns: ['認証ID', '会員ID', '職員ID', 'システムロールコード', 'アカウント有効フラグ', '削除フラグ'] },
  { table: 'T_管理者Googleホワイトリスト', columns: ['紐付け認証ID', '紐付け会員ID', '削除フラグ'] },
  { table: 'T_研修申込', columns: ['会員ID', '職員ID', '申込者ID', '削除フラグ'] },
  { table: 'T_役員', columns: ['会員ID', '職員ID', '削除フラグ'] },
  { table: 'T_振込口座', columns: ['会員ID', '職員ID', '削除フラグ'] },
  { table: 'T_請求', columns: ['会員ID', '職員ID', '削除フラグ'] },
  { table: 'T_支払い', columns: ['会員ID', '職員ID', '削除フラグ'] },
  // 書かないが、処理待ちの申請を確かめるために読む（docs/316 C）
  { table: 'T_変更申請', columns: ['申請ID', '会員ID', '申請種別コード', '申請状態コード', '申請内容JSON', '削除フラグ'] },
];

// 2026-10-31 operator 決定（docs/316 C）: 本人に処理待ちの変更申請があれば、書き込む前に移行を止める。
// 申請は移行前の会員ID・職員IDを指すため、移行後に承認すると別の人・退会済みの行に効いてしまう。
// 管理者が申請を承認か却下してから移行をやり直し、必要なら本人が移行後に申請し直す。
// 本人の申請: (a) 個人・賛助会員としての申請（会員ID 一致）
//            (b) 事業所の申請のうち、この人を職員の追加・情報変更・除籍の対象に含むもの
//                （情報変更は職員ID、追加・除籍は介護支援専門員番号で人を指す）
// 申請内容が読めない申請は本人のものか確かめられないので、データ異常として止める。
// 処理待ちの申請があるのは通常の業務状態なので、Chat の異常通知は出さない。
function findConversionPendingChangeRequests_(ss, person) {
  var memberId = String(person.memberId || '').trim();
  var officeMemberId = String(person.officeMemberId || '').trim();
  var staffId = String(person.staffId || '').trim();
  var careNum = normalizeCmNumberForKey_(person.careManagerNumber);
  var result = { pendingIds: [], unreadableIds: [] };
  getRowsAsObjects_(ss, 'T_変更申請').forEach(function(r) {
    if (toBoolean_(r['削除フラグ'])) return;
    if (String(r['申請状態コード'] || '') !== 'PENDING') return;
    if (String(r['申請種別コード'] || '') === 'MEMBER_APPLICATION') return;
    var requestId = String(r['申請ID'] || '');
    var rowMemberId = String(r['会員ID'] || '').trim();
    if (memberId && rowMemberId === memberId) {
      result.pendingIds.push(requestId);
      return;
    }
    if (!officeMemberId || rowMemberId !== officeMemberId) return;
    var data;
    try {
      data = JSON.parse(String(r['申請内容JSON'] || '{}'));
    } catch (e) {
      data = null;
    }
    if (!data || typeof data !== 'object') {
      result.unreadableIds.push(requestId);
      return;
    }
    var refersToPerson = function(entry) {
      if (!entry || typeof entry !== 'object') return false;
      if (staffId && String(entry.staffId || '').trim() === staffId) return true;
      var target = entry.target && typeof entry.target === 'object' ? entry.target : entry;
      return !!careNum && normalizeCmNumberForKey_(target.careManagerNumber) === careNum;
    };
    var entries = [].concat(
      Array.isArray(data.staffAdd) ? data.staffAdd : [],
      Array.isArray(data.staffRemove) ? data.staffRemove : [],
      Array.isArray(data.staffUpdate) ? data.staffUpdate : []
    );
    if (entries.some(refersToPerson)) result.pendingIds.push(requestId);
  });
  return result;
}

// 処理待ちの申請があれば止める（書き込みの前に呼ぶ）
function assertNoConversionPendingChangeRequests_(ss, person) {
  var found = findConversionPendingChangeRequests_(ss, person);
  if (found.unreadableIds.length > 0) {
    notifyMembershipChatSafely_(ss, 'ANOMALY', {
      '手続種別': '会員種別の移行',
      '異常内容': '変更申請の内容を読み取れません（申請ID: ' + found.unreadableIds.join(', ') + '）。管理者が申請を確認してください。',
    });
    throw new Error('変更申請の内容を読み取れないため、移行できません（申請ID: ' + found.unreadableIds.join(', ') + '）。管理者に連絡してください。');
  }
  if (found.pendingIds.length > 0) {
    throw new Error('この方に処理待ちの変更申請があるため、移行できません（申請ID: ' + found.pendingIds.join(', ') + '）。'
      + '変更申請の画面で承認または却下してから、もう一度移行してください。'
      + '移行後も変更が必要な場合は、ご本人に申請し直していただいてください。');
  }
}

// 事業所あての処理待ちの変更申請（入会申込を除く）の申請IDを返す。
// 2026-11-01 operator 決定（docs/316 §2 の 7）: 最後の在籍職員を移行すると事業所が自動退会するため、
// 事業所に処理待ちの申請が 1 件でもあれば止める（処理待ちの職員追加を承認すれば 0 人にならない）。
// 申請の中身は問わないので、内容の読めない申請もここでは「処理待ち」として数える。
function findOfficePendingChangeRequestIds_(ss, officeMemberId) {
  var officeId = String(officeMemberId || '').trim();
  if (!officeId) throw new Error('事業所の会員IDが空のため、処理待ちの申請を確かめられません。');
  return getRowsAsObjects_(ss, 'T_変更申請').filter(function(r) {
    return !toBoolean_(r['削除フラグ'])
      && String(r['申請状態コード'] || '') === 'PENDING'
      && String(r['申請種別コード'] || '') !== 'MEMBER_APPLICATION'
      && String(r['会員ID'] || '').trim() === officeId;
  }).map(function(r) { return String(r['申請ID'] || ''); });
}

function inspectMemberConversionData_(ss) {
  var requirements = MEMBER_CONVERSION_REQUIRED_COLUMNS_;
  for (var i = 0; i < requirements.length; i += 1) {
    var requirement = requirements[i];
    var sheet = ss.getSheetByName(requirement.table);
    if (!sheet || sheet.getLastColumn() < 1) {
      return { code: 'MISSING_TABLE', table: requirement.table };
    }
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
    for (var c = 0; c < requirement.columns.length; c += 1) {
      if (headers.indexOf(requirement.columns[c]) < 0) {
        return { code: 'MISSING_COLUMN', table: requirement.table, column: requirement.columns[c] };
      }
    }
  }
  return null;
}

function convertMemberType_(payload) {
  if (!payload || !payload.direction) throw new Error('direction が未指定です。');
  var direction = String(payload.direction);
  if (direction !== 'STAFF_TO_INDIVIDUAL' && direction !== 'INDIVIDUAL_TO_STAFF') {
    throw new Error('不明な direction: ' + direction);
  }

  var ss = getOrCreateDatabase_();
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    return convertMemberTypeOn_(ss, payload);
  } finally {
    lock.releaseLock();
  }
}

// 渡された ss だけで移行する（本番 DB を自分では開かない）。
// 2026-10-31: 隔離 E2E（docs/317 §2.1）が一時スプレッドシートを渡して本物の移行を通すために入口から分けた。
function convertMemberTypeOn_(ss, payload) {
  var direction = String(payload && payload.direction || '');
  if (direction !== 'STAFF_TO_INDIVIDUAL' && direction !== 'INDIVIDUAL_TO_STAFF') {
    throw new Error('不明な direction: ' + direction);
  }
  var anomaly = inspectMemberConversionData_(ss);
  if (anomaly) {
    var message = anomaly.code === 'MISSING_TABLE'
      ? '移行に必要な表「' + anomaly.table + '」を確認できません。'
      : '表「' + anomaly.table + '」の列「' + anomaly.column + '」を確認できません。';
    notifyMembershipChatSafely_(ss, 'ANOMALY', {
      '手続種別': '会員種別の移行',
      '異常内容': message + ' 管理者がデータ構造を確認してください。',
    });
    throw new Error('移行に必要なデータ構造を確認できません。' + message + ' 管理者に連絡してください。');
  }
  // 操作ID: 画面が作って送る。同じ操作IDの完了記録があれば、もう一度は実行せず前の結果を返す（docs/316 §6）
  var logId = normalizeConversionOperationId_(payload.operationId) || ('MC-' + Utilities.getUuid());
  var previous = findMemberConversionRecord_(ss, logId);
  if (previous) return memberConversionResultFromRecord_(previous, logId);

  // 読取・検証・計画（ここまで DB に書かない）→ 1 回の一括更新
  var tx = createSheetWriteTx_(ss);
  var result = direction === 'STAFF_TO_INDIVIDUAL'
    ? convertStaffToIndividual_(ss, payload, tx, logId)
    : convertIndividualToStaff_(ss, payload, tx, logId);
  var commit = txCommit_(tx);
  if (commit.status === 'UNKNOWN' && confirmConversionAppliedViaApi_(ss, logId) === 'APPLIED') commit.status = 'APPLIED';
  if (commit.status === 'NOT_APPLIED') {
    throw new Error('移行を反映できませんでした。データは変わっていません（すべての表を一度に書く方式のため、一部だけ反映されることはありません）。時間をおいてもう一度実行してください。');
  }
  if (commit.status !== 'APPLIED') {
    throw new Error('移行の結果を確認できませんでした（操作ID: ' + logId + '）。会員詳細を開き直して状態を確認してから、必要な場合だけもう一度実行してください。');
  }
  // DB の反映を確かめてから（キャッシュの消去は DB を読まない）
  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();
  result.operationId = logId;
  return result;
}

// tx: 書込みの予約先（createSheetWriteTx_）。ここでは DB に書かない（convertMemberTypeOn_ が一括で書く）
// logId: 完了記録（T_人物統合ログ のログID）に使う操作ID
function convertStaffToIndividual_(ss, payload, tx, logId) {
  if (!tx) throw new Error('書込みの予約先（tx）がありません。');
  var sourceMemberId = String(payload.sourceMemberId || '');
  var sourceStaffId = String(payload.sourceStaffId || '');
  if (!sourceMemberId || !sourceStaffId) throw new Error('sourceMemberId / sourceStaffId は必須です。');

  // 1. 事業所の存在確認
  var memberSheet = ss.getSheetByName('T_会員');
  if (!memberSheet) throw new Error('T_会員 シートが見つかりません。');
  var officeFound = findRowByColumnValue_(memberSheet, '会員ID', sourceMemberId);
  if (!officeFound) throw new Error('事業所 ' + sourceMemberId + ' が見つかりません。');
  var officeRow = officeFound.row;
  var officeCols = officeFound.columns;
  if (String(officeRow[officeCols['会員種別コード']] || '') !== 'BUSINESS') {
    throw new Error('会員 ' + sourceMemberId + ' は事業所会員ではありません。');
  }

  // 2. 職員の存在確認
  var staffSheet = ss.getSheetByName('T_事業所職員');
  if (!staffSheet) throw new Error('T_事業所職員 シートが見つかりません。');
  var staffFound = findRowByColumnValue_(staffSheet, '職員ID', sourceStaffId);
  if (!staffFound) throw new Error('職員 ' + sourceStaffId + ' が見つかりません。');
  var sRow = staffFound.row;
  var sCols = staffFound.columns;
  if (String(sRow[sCols['会員ID']] || '') !== sourceMemberId) {
    throw new Error('職員は指定の事業所に所属していません。');
  }
  // 2026-10-31: 在籍していない職員（移行済み・除籍済み）は移行しない。以前は状態を見ず、もう一度移行できた
  if (toBoolean_(sRow[sCols['削除フラグ']]) || String(sRow[sCols['職員状態コード']] || '') !== 'ENROLLED') {
    throw new Error('この職員は在籍中ではありません（移行済み・除籍済みの可能性があります）。会員詳細を開き直して確認してください。');
  }

  // now/today をここで確定（ステップ3で使うため、ステップ5より前に宣言）
  var now = new Date().toISOString();
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');

  // 2.5. 介護支援専門員番号を先取得して事前チェック（DB変更前）
  var staffCareNumPre = String(sRow[sCols['介護支援専門員番号']] || '').trim();
  if (staffCareNumPre) {
    var otherEnrolledSameCM = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
      return !toBoolean_(r['削除フラグ'])
        && String(r['介護支援専門員番号'] || '').trim() === staffCareNumPre
        && String(r['職員状態コード'] || '') === 'ENROLLED'
        && String(r['職員ID'] || '') !== sourceStaffId;
    });
    if (otherEnrolledSameCM.length > 0) {
      throw new Error('介護支援専門員番号 ' + staffCareNumPre + ' の在籍職員が他事業所に存在します（職員ID: ' + otherEnrolledSameCM.map(function(r) { return String(r['職員ID'] || ''); }).join(', ') + '）。重複を解消してから再度お試しください。');
    }
  }

  // 2.6. 処理待ちの変更申請があれば書き込む前に止める（docs/316 C）
  assertNoConversionPendingChangeRequests_(ss, {
    officeMemberId: sourceMemberId,
    staffId: sourceStaffId,
    careManagerNumber: staffCareNumPre,
  });

  // 3. 代表者チェック（v127: 最後の1名の場合は事業所自動退会）
  var isRepresentative = String(sRow[sCols['職員権限コード']] || '') === 'REPRESENTATIVE';
  var officeWithdrawn = false;
  var enrolledOthers = [];
  if (isRepresentative) {
    // 同事業所の他の ENROLLED 職員を確認
    var allStaffData = staffSheet.getRange(2, 1, staffSheet.getLastRow() - 1, staffSheet.getLastColumn()).getValues();
    enrolledOthers = allStaffData.filter(function(r) {
      return String(r[sCols['会員ID']] || '') === sourceMemberId
        && String(r[sCols['職員ID']] || '') !== sourceStaffId
        && String(r[sCols['職員状態コード']] || '') === 'ENROLLED';
    });
  }

  // 3.1. 最後の在籍職員の移行（＝事業所の自動退会）は、事業所に処理待ちの申請があれば書き込む前に止める（docs/316 §2 の 7）
  if (isRepresentative && enrolledOthers.length === 0) {
    var officePendingIds = findOfficePendingChangeRequestIds_(ss, sourceMemberId);
    if (officePendingIds.length > 0) {
      throw new Error('この方は事業所の最後の在籍職員で、移行すると事業所が自動退会になります。'
        + '事業所に処理待ちの変更申請があるため、移行できません（申請ID: ' + officePendingIds.join(', ') + '）。'
        + '変更申請の画面で承認または却下してから、もう一度移行してください。');
    }
  }

  if (isRepresentative) {
    if (enrolledOthers.length === 0) {
      // 最後の1名 → 事業所を自動退会
      var offRow = officeRow.slice();
      offRow[officeCols['会員状態コード']] = 'WITHDRAWN';
      offRow[officeCols['退会日']] = today;
      offRow[officeCols['更新日時']] = now;
      txUpdateRow_(tx, 'T_会員', officeFound.rowNumber, officeRow, offRow);
      officeWithdrawn = true;
      // newRepresentativeStaffId 不要
    } else {
      // 他に在籍職員がいる → 後任代表者必須
      var newRepStaffId = String(payload.newRepresentativeStaffId || '').trim();
      if (!newRepStaffId) throw new Error('他の在籍職員がいるため、後任代表者の指定が必要です。');
      if (newRepStaffId === sourceStaffId) throw new Error('後任代表者は自分以外を指定してください。');
      var newRepFound = findRowByColumnValue_(staffSheet, '職員ID', newRepStaffId);
      if (!newRepFound) throw new Error('後任代表者 ' + newRepStaffId + ' が見つかりません。');
      if (String(newRepFound.row[newRepFound.columns['会員ID']] || '') !== sourceMemberId) {
        throw new Error('後任代表者は同じ事業所の職員でなければなりません。');
      }
      if (String(newRepFound.row[newRepFound.columns['職員状態コード']] || '') === 'LEFT') {
        throw new Error('後任代表者は在籍中の職員でなければなりません。');
      }
      // 後任を REPRESENTATIVE に昇格
      var nrRow = newRepFound.row.slice();
      nrRow[newRepFound.columns['職員権限コード']] = 'REPRESENTATIVE';
      nrRow[newRepFound.columns['更新日時']] = new Date().toISOString();
      txUpdateRow_(tx, 'T_事業所職員', newRepFound.rowNumber, newRepFound.row, nrRow);
    }
  }

  // 4. 職員情報を取得（氏名を分割）
  var staffNameFields = normalizeStaffNameFields_({
    姓: sCols['姓'] != null ? sRow[sCols['姓']] : '',
    名: sCols['名'] != null ? sRow[sCols['名']] : '',
    セイ: sCols['セイ'] != null ? sRow[sCols['セイ']] : '',
    メイ: sCols['メイ'] != null ? sRow[sCols['メイ']] : '',
    氏名: sRow[sCols['氏名']],
    フリガナ: sRow[sCols['フリガナ']],
  });
  var staffName = staffNameFields.name;
  var staffKana = staffNameFields.kana;
  var staffEmail = String(sRow[sCols['メールアドレス'] || ''] || '');
  var staffCareNum = String(sRow[sCols['介護支援専門員番号']] || '');
  var lastName = staffNameFields.lastName;
  var firstName = staffNameFields.firstName;
  var lastKana = staffNameFields.lastKana;
  var firstKana = staffNameFields.firstKana;

  // 5. 個人会員レコード: 同一CM番号の既存 WITHDRAWN / TRANSFERRED 行を再活性化、なければ新規作成
  // 再活性化により往復変換でのレコード蓄積を防ぎ、年会費履歴を自動継承する。
  // 2026-10-31 operator 決定: 移行済み（TRANSFERRED）の行も使い直す。以前は退会の行だけで、
  // 個人→職員→個人と戻すたびに新しい会員IDの行ができ、年会費の履歴が古い会員IDに残っていた（docs/317 E7）。
  var newMemberId;
  var reuseFound = null;
  if (staffCareNum) {
    var memberCandidates = getRowsAsObjects_(ss, 'T_会員').filter(function(r) {
      var status = String(r['会員状態コード'] || '');
      return !toBoolean_(r['削除フラグ'])
        && String(r['介護支援専門員番号'] || '').trim() === staffCareNum
        && String(r['会員種別コード'] || '') !== 'BUSINESS'
        && (status === 'WITHDRAWN' || status === 'TRANSFERRED');
    });
    // 退会日・移行日が最も新しい行を優先。日付のセルは Date で読めるので、文字列にせず時刻で比べる
    // （以前は String(Date) を比べており、曜日の綴りの順になっていた）
    var leftAt = function(r) {
      return dbStateTime_(r['退会日']) || dbStateTime_(r['移行日']) || dbStateTime_(r['更新日時']);
    };
    memberCandidates.sort(function(a, b) { return leftAt(b) - leftAt(a); });
    if (memberCandidates.length > 0) {
      reuseFound = findRowByColumnValue_(memberSheet, '会員ID', String(memberCandidates[0]['会員ID'] || ''));
    }
  }
  if (reuseFound) {
    // 既存行を再活性化（入会日=再入会日、氏名・メールを職員情報で更新）
    newMemberId = String(reuseFound.row[reuseFound.columns['会員ID']] || '');
    var updMemberRow = reuseFound.row.slice();
    updMemberRow[reuseFound.columns['会員状態コード']] = 'ACTIVE';
    updMemberRow[reuseFound.columns['入会日']] = today;
    updMemberRow[reuseFound.columns['退会日']] = '';
    if (reuseFound.columns['移行日'] != null) updMemberRow[reuseFound.columns['移行日']] = '';
    if (reuseFound.columns['姓'] != null) updMemberRow[reuseFound.columns['姓']] = lastName;
    if (reuseFound.columns['名'] != null) updMemberRow[reuseFound.columns['名']] = firstName;
    if (reuseFound.columns['セイ'] != null) updMemberRow[reuseFound.columns['セイ']] = lastKana;
    if (reuseFound.columns['メイ'] != null) updMemberRow[reuseFound.columns['メイ']] = firstKana;
    if (reuseFound.columns['代表メールアドレス'] != null) updMemberRow[reuseFound.columns['代表メールアドレス']] = staffEmail;
    updMemberRow[reuseFound.columns['更新日時']] = now;
    txUpdateRow_(tx, 'T_会員', reuseFound.rowNumber, reuseFound.row, updMemberRow);
  } else {
    // 初回変換 or CM番号なし → 新規作成
    newMemberId = generateMemberId_();
    while (findRowByColumnValue_(memberSheet, '会員ID', newMemberId)) {
      newMemberId = generateMemberId_();
    }
    // 2026-10-31: シートの実際の見出しで並べる（以前は テーブル定義 の列順で appendRow しており、
    // 列順がずれたシートでは別の列に書き、番号の先頭 0 を守る書式も通らなかった）。
    txAppend_(tx, 'T_会員', {
      会員ID: newMemberId,
      会員種別コード: 'INDIVIDUAL',
      会員状態コード: 'ACTIVE',
      入会日: today,
      退会日: '',
      姓: lastName,
      名: firstName,
      セイ: lastKana,
      メイ: firstKana,
      代表メールアドレス: staffEmail,
      介護支援専門員番号: staffCareNum,
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    });
  }

  // 6. T_事業所職員を LEFT + 削除フラグ
  var updStaffRow = sRow.slice();
  updStaffRow[sCols['職員状態コード']] = 'LEFT';
  updStaffRow[sCols['退会日']] = today;
  updStaffRow[sCols['削除フラグ']] = true;
  updStaffRow[sCols['更新日時']] = now;
  txUpdateRow_(tx, 'T_事業所職員', staffFound.rowNumber, sRow, updStaffRow);

  // 7. T_認証アカウント: 会員ID→新ID, 職員ID→クリア, 有効フラグ=true
  var authRebind = rebindAuthPrincipal_(ss, {
    sourceStaffId: sourceStaffId,
    targetMemberId: newMemberId,
    targetStaffId: '',
    targetRoleCode: 'INDIVIDUAL_MEMBER',
    updatedAt: now,
    tx: tx,
  });
  syncWhitelistMemberLinkByAuthIds_(ss, authRebind.authIds, newMemberId, now, tx);

  // 8. T_研修申込: 該当職員の申込を新会員IDに更新
  var migrateCounts = migratePersonOwnedReferences_(ss, {
    oldMemberId: sourceMemberId,
    oldStaffId: sourceStaffId,
    newMemberId: newMemberId,
    newStaffId: '',
    updatedAt: now,
    tx: tx,
  });
  // 完了記録（ログID = 操作ID）。本体と同じ一括更新で書くので、本体が反映されたときだけ残る（P9）
  appendPersonMergeLog_(ss, {
    logId: logId,
    action: 'STAFF_TO_INDIVIDUAL',
    careManagerNumber: staffCareNum,
    oldMemberId: sourceMemberId,
    oldStaffId: sourceStaffId,
    newMemberId: newMemberId,
    newStaffId: '',
    // 2026-11-01（operator 決定 A）: 入会日は「この記録で在籍が始まった日」（年度の在籍判定に使う）なので、
    // 使い直した行は戻した日に書き換える。上書きする前の入会日と元の行の入会日をここに残す（最初の入会日をたどれるように）。
    details: { officeWithdrawn: officeWithdrawn, migrated: migrateCounts,
      joinedDates: { source: normalizeDateInput_(sRow[sCols['入会日']]),
        reusedBefore: reuseFound ? normalizeDateInput_(reuseFound.row[reuseFound.columns['入会日']]) : '' } },
    executedAt: now,
  }, tx);
  // post-check は廃止: 再活性化パターン + 事前チェック（step 2.5）で整合性を保証するため不要
  // キャッシュの消去は一括更新の反映を確かめてから convertMemberTypeOn_ が行う

  return {
    converted: true,
    direction: 'STAFF_TO_INDIVIDUAL',
    newMemberId: newMemberId,
    sourceStaffId: sourceStaffId,
    officeWithdrawn: officeWithdrawn,
  };
}

// tx・logId は convertStaffToIndividual_ と同じ（ここでは DB に書かない）
function convertIndividualToStaff_(ss, payload, tx, logId) {
  if (!tx) throw new Error('書込みの予約先（tx）がありません。');
  var sourceMemberId = String(payload.sourceMemberId || '');
  var targetOfficeMemberId = String(payload.targetOfficeMemberId || '');
  var staffRole = String(payload.staffRole || 'STAFF');
  if (!sourceMemberId) throw new Error('sourceMemberId は必須です。');
  if (!targetOfficeMemberId) throw new Error('targetOfficeMemberId は必須です。');
  if (!hasMasterOption_(ss, 'M_職員権限', staffRole)) staffRole = 'STAFF';

  // 1. 個人会員の存在確認
  var memberSheet = ss.getSheetByName('T_会員');
  if (!memberSheet) throw new Error('T_会員 シートが見つかりません。');
  var srcFound = findRowByColumnValue_(memberSheet, '会員ID', sourceMemberId);
  if (!srcFound) throw new Error('会員 ' + sourceMemberId + ' が見つかりません。');
  var srcRow = srcFound.row;
  var srcCols = srcFound.columns;
  var srcType = String(srcRow[srcCols['会員種別コード']] || '');
  if (srcType !== 'INDIVIDUAL' && srcType !== 'SUPPORT') {
    throw new Error('事業所会員を別の事業所に転籍する機能は未対応です。');
  }
  // 2026-10-31: 移行済みの会員はもう一度移行しない（以前は状態を見ていなかった）
  if (String(srcRow[srcCols['会員状態コード']] || '') === 'TRANSFERRED') {
    throw new Error('この会員はすでに移行済みです。会員詳細を開き直して確認してください。');
  }

  // 2. 転籍先事業所の存在確認
  var officeFound = findRowByColumnValue_(memberSheet, '会員ID', targetOfficeMemberId);
  if (!officeFound) throw new Error('事業所 ' + targetOfficeMemberId + ' が見つかりません。');
  if (String(officeFound.row[officeFound.columns['会員種別コード']] || '') !== 'BUSINESS') {
    throw new Error('転籍先 ' + targetOfficeMemberId + ' は事業所会員ではありません。');
  }
  if (String(officeFound.row[officeFound.columns['会員状態コード']] || '') === 'WITHDRAWN') {
    throw new Error('転籍先の事業所は退会済みです。');
  }

  // 3. 事業所の職員数上限チェック
  var staffLimitInfo = getBusinessStaffLimitInfo_(ss, targetOfficeMemberId);
  if (!(staffLimitInfo.limit > 0)) {
    throw new Error('転籍先の職員数上限を確認できません。事業所または全体の上限設定を確認してください。');
  }
  if (staffLimitInfo.enrolled >= staffLimitInfo.limit) {
    throw new Error('転籍先の事業所は職員数上限（' + staffLimitInfo.limit + '名）に達しています。');
  }

  // 3.5. 介護支援専門員番号の解決（賛助会員でペイロードから受け取る場合を含む）
  var srcCareNum = String(srcRow[srcCols['介護支援専門員番号']] || '').trim();
  var inputCareNum = String(payload.careManagerNumber || '').trim();
  if (!srcCareNum && srcType === 'SUPPORT') {
    // 賛助会員で介護支援専門員番号が未登録の場合は入力値を必須とする
    if (!inputCareNum) {
      throw new Error('賛助会員を事業所職員として転籍するには介護支援専門員番号が必要です。モーダルで介護支援専門員番号を入力してください。');
    }
    if (!/^\d{8}$/.test(inputCareNum)) {
      throw new Error('介護支援専門員番号は8桁の半角数字で入力してください。');
    }
    srcCareNum = inputCareNum;
  } else if (!srcCareNum && srcType === 'INDIVIDUAL') {
    // 個人会員で介護支援専門員番号がない場合（データ不整合）は警告付きで続行
    Logger.log('警告: 個人会員 ' + sourceMemberId + ' に介護支援専門員番号が登録されていません。');
  }
  // 3.6. Pre-check: DB変更前に全会員・全事業所を対象とした重複確認（変更後アサートより安全）
  if (srcCareNum) {
    // (a) 転籍元以外の有効な個人/賛助会員に同一CM番号が存在しないか
    var allMemberRowsForCheck = getRowsAsObjects_(ss, 'T_会員');
    var activeSameCMMembers = allMemberRowsForCheck.filter(function(r) {
      return !toBoolean_(r['削除フラグ'])
        && String(r['介護支援専門員番号'] || '').trim() === srcCareNum
        && String(r['会員種別コード'] || '') !== 'BUSINESS'
        && !isInactiveMemberStatusForIdentity_(r['会員状態コード'])
        && String(r['会員ID'] || '') !== sourceMemberId;
    });
    if (activeSameCMMembers.length > 0) {
      throw new Error('介護支援専門員番号 ' + srcCareNum + ' の有効な個人/賛助会員が他に存在します（会員ID: ' + activeSameCMMembers.map(function(r) { return String(r['会員ID'] || ''); }).join(', ') + '）。データ管理コンソールの「会員CM番号重複修復」を実行してから再度お試しください。');
    }
    // (b) 全事業所で同一CM番号のENROLLED職員が存在しないか
    var allStaffRowsForCheck = getRowsAsObjects_(ss, 'T_事業所職員');
    var enrolledSameCMStaff = allStaffRowsForCheck.filter(function(r) {
      return !toBoolean_(r['削除フラグ'])
        && String(r['介護支援専門員番号'] || '').trim() === srcCareNum
        && String(r['職員状態コード'] || '') === 'ENROLLED';
    });
    if (enrolledSameCMStaff.length > 0) {
      throw new Error('介護支援専門員番号 ' + srcCareNum + ' の在籍職員が既に存在します（職員ID: ' + enrolledSameCMStaff.map(function(r) { return String(r['職員ID'] || ''); }).join(', ') + '）。重複を解消してから再度お試しください。');
    }
  }

  // 3.7. 処理待ちの変更申請があれば書き込む前に止める（docs/316 C）。
  // 本人の申請と、転籍先の事業所がこの人を職員として追加・変更・除籍する申請。
  assertNoConversionPendingChangeRequests_(ss, {
    memberId: sourceMemberId,
    officeMemberId: targetOfficeMemberId,
    careManagerNumber: srcCareNum,
  });

  // 4. 職員レコード: 同一CM番号 × 同一事業所の既存 LEFT 行を再活性化、なければ新規作成
  // 再活性化により往復変換でのレコード蓄積を防ぐ。
  var now = new Date().toISOString();
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  var staffName = (String(srcRow[srcCols['姓']] || '') + ' ' + String(srcRow[srcCols['名']] || '')).trim();
  var staffKana = (String(srcRow[srcCols['セイ']] || '') + ' ' + String(srcRow[srcCols['メイ']] || '')).trim();
  // v368: 紐づけは介護支援専門員番号で行うため、メアド空でも転籍を通す。
  // メアド空の場合は credential メール送信は skip し、職員レコードのみ作成する。
  // 後で管理者が職員のメアドを手動入力した時点で、管理画面から credential メール再送が可能。
  var staffEmail = String(srcRow[srcCols['代表メールアドレス']] || '').trim();
  if (!staffEmail) {
    Logger.log('[convertMemberType] 転籍元会員(' + sourceMemberId + ')のメアド空。credential メール送信を skip して転籍を継続。');
  }
  var staffCareNum = srcCareNum; // step 3.5 で確定済み

  var staffSheet = ss.getSheetByName('T_事業所職員');
  if (!staffSheet) throw new Error('T_事業所職員 シートが見つかりません。');

  var newStaffId;
  var reuseStaffFound = null;
  if (staffCareNum) {
    // 削除フラグ=true の LEFT 行も再活性化対象（変換時に削除フラグが付くため）
    var staffCandidates = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
      return String(r['会員ID'] || '') === targetOfficeMemberId
        && String(r['介護支援専門員番号'] || '').trim() === staffCareNum
        && String(r['職員状態コード'] || '') === 'LEFT';
    });
    // 退会日が最も新しい行を優先（日付のセルは Date で読めるので時刻で比べる）
    var staffLeftAt = function(r) { return dbStateTime_(r['退会日']) || dbStateTime_(r['更新日時']); };
    staffCandidates.sort(function(a, b) { return staffLeftAt(b) - staffLeftAt(a); });
    if (staffCandidates.length > 0) {
      reuseStaffFound = findRowByColumnValue_(staffSheet, '職員ID', String(staffCandidates[0]['職員ID'] || ''));
    }
  }
  if (reuseStaffFound) {
    // 既存行を再活性化（入会日=再入会日、権限・氏名・メール・CM番号を更新）
    newStaffId = String(reuseStaffFound.row[reuseStaffFound.columns['職員ID']] || '');
    var updStaff = reuseStaffFound.row.slice();
    updStaff[reuseStaffFound.columns['職員状態コード']] = 'ENROLLED';
    updStaff[reuseStaffFound.columns['入会日']] = today;
    updStaff[reuseStaffFound.columns['退会日']] = '';
    updStaff[reuseStaffFound.columns['削除フラグ']] = false;
    updStaff[reuseStaffFound.columns['職員権限コード']] = staffRole;
    if (reuseStaffFound.columns['姓'] != null) updStaff[reuseStaffFound.columns['姓']] = String(srcRow[srcCols['姓']] || '');
    if (reuseStaffFound.columns['名'] != null) updStaff[reuseStaffFound.columns['名']] = String(srcRow[srcCols['名']] || '');
    if (reuseStaffFound.columns['セイ'] != null) updStaff[reuseStaffFound.columns['セイ']] = String(srcRow[srcCols['セイ']] || '');
    if (reuseStaffFound.columns['メイ'] != null) updStaff[reuseStaffFound.columns['メイ']] = String(srcRow[srcCols['メイ']] || '');
    if (reuseStaffFound.columns['氏名'] != null) updStaff[reuseStaffFound.columns['氏名']] = staffName;
    if (reuseStaffFound.columns['フリガナ'] != null) updStaff[reuseStaffFound.columns['フリガナ']] = staffKana;
    if (reuseStaffFound.columns['メールアドレス'] != null) updStaff[reuseStaffFound.columns['メールアドレス']] = staffEmail;
    if (reuseStaffFound.columns['介護支援専門員番号'] != null) updStaff[reuseStaffFound.columns['介護支援専門員番号']] = staffCareNum;
    updStaff[reuseStaffFound.columns['更新日時']] = now;
    txUpdateRow_(tx, 'T_事業所職員', reuseStaffFound.rowNumber, reuseStaffFound.row, updStaff);
  } else {
    // 初回転籍 or CM番号なし → 新規作成
    newStaffId = 'S' + Date.now();
    txAppend_(tx, 'T_事業所職員', {
      職員ID: newStaffId,
      会員ID: targetOfficeMemberId,
      姓: String(srcRow[srcCols['姓']] || ''),
      名: String(srcRow[srcCols['名']] || ''),
      セイ: String(srcRow[srcCols['セイ']] || ''),
      メイ: String(srcRow[srcCols['メイ']] || ''),
      氏名: staffName,
      フリガナ: staffKana,
      メールアドレス: staffEmail,
      職員権限コード: staffRole,
      職員状態コード: 'ENROLLED',
      入会日: today,
      退会日: '',
      介護支援専門員番号: staffCareNum,
      メール配信希望コード: 'YES',
      作成日時: now,
      更新日時: now,
      削除フラグ: false,
    });
  }

  // 5. T_認証アカウント: 会員ID→事業所ID, 職員ID→新ID, 有効フラグ=true
  var targetRoleCode = staffRole === 'STAFF' ? 'BUSINESS_MEMBER' : 'BUSINESS_ADMIN';
  var authRebind = rebindAuthPrincipal_(ss, {
    sourceMemberId: sourceMemberId,
    targetMemberId: targetOfficeMemberId,
    targetStaffId: newStaffId,
    targetRoleCode: targetRoleCode,
    updatedAt: now,
    tx: tx,
  });
  syncWhitelistMemberLinkByAuthIds_(ss, authRebind.authIds, targetOfficeMemberId, now, tx);

  // 6. 元の個人/賛助会員を移行済みにする（賛助会員で新規入力 CM 番号があれば書き戻す）
  var updSrcRow = srcRow.slice();
  updSrcRow[srcCols['会員状態コード']] = 'TRANSFERRED';
  if (srcCols['移行日'] != null) updSrcRow[srcCols['移行日']] = today;
  updSrcRow[srcCols['更新日時']] = now;
  if (inputCareNum && srcCols['介護支援専門員番号'] != null) {
    updSrcRow[srcCols['介護支援専門員番号']] = srcCareNum;
  }
  txUpdateRow_(tx, 'T_会員', srcFound.rowNumber, srcRow, updSrcRow);

  // 7. T_研修申込: 会員ID→事業所ID, 職員ID→新ID
  // ※ assertSingleActiveAffiliationByCareManager_ は DB変更前の 3.6 pre-check に移行済み
  var migrateCounts2 = migratePersonOwnedReferences_(ss, {
    oldMemberId: sourceMemberId,
    oldStaffId: '',
    newMemberId: targetOfficeMemberId,
    newStaffId: newStaffId,
    updatedAt: now,
    tx: tx,
  });
  // 完了記録（ログID = 操作ID）。本体と同じ一括更新で書く（P9）
  appendPersonMergeLog_(ss, {
    logId: logId,
    action: 'INDIVIDUAL_TO_STAFF',
    careManagerNumber: staffCareNum,
    oldMemberId: sourceMemberId,
    oldStaffId: '',
    newMemberId: targetOfficeMemberId,
    newStaffId: newStaffId,
    // 2026-11-01（operator 決定 A）: 上書きする前の入会日と元の行の入会日を残す（上の STAFF_TO_INDIVIDUAL と同じ）
    details: { migrated: migrateCounts2,
      joinedDates: { source: normalizeDateInput_(srcRow[srcCols['入会日']]),
        reusedBefore: reuseStaffFound ? normalizeDateInput_(reuseStaffFound.row[reuseStaffFound.columns['入会日']]) : '' } },
    executedAt: now,
  }, tx);
  // キャッシュの消去は一括更新の反映を確かめてから convertMemberTypeOn_ が行う

  return {
    converted: true,
    direction: 'INDIVIDUAL_TO_STAFF',
    newStaffId: newStaffId,
    targetOfficeMemberId: targetOfficeMemberId,
    sourceMemberId: sourceMemberId,
  };
}

// ── 会員セルフ退会申請（年度末退会予約）──────────────────────
// パスワード再認証 → 会員状態を WITHDRAWAL_SCHEDULED に変更 → 退会日を年度末(3/31)に設定
// アカウントは無効化しない（年度末までログイン可能）
function withdrawSelf_(payload) {
  if (!payload || !payload.loginId || !payload.password || !payload.memberId) {
    throw new Error('退会申請に必要な情報が不足しています。');
  }

  var loginId = String(payload.loginId).trim();
  var password = String(payload.password);
  var memberId = String(payload.memberId).trim();

  // ── パスワード再認証（changePassword_ と同パターン）──
  var ss = getOrCreateDatabase_();
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet) throw new Error('認証アカウントテーブルが見つかりません。');

  var authRowInfo = findRowByColumnValue_(authSheet, 'ログインID', loginId);
  if (!authRowInfo) throw new Error('認証情報が見つかりません。');

  var authRow = authRowInfo.row;
  var authCols = authRowInfo.columns;
  var authMemberId = String(authRow[authCols['会員ID']] || '');
  if (authMemberId !== memberId) throw new Error('認証情報と会員IDが一致しません。');

  if (!toBoolean_(authRow[authCols['アカウント有効フラグ']])) throw new Error('アカウントが無効です。');
  if (toBoolean_(authRow[authCols['ロック状態']])) throw new Error('アカウントがロックされています。');

  var storedSalt = String(authRow[authCols['パスワードソルト']] || '');
  var storedHash = String(authRow[authCols['パスワードハッシュ']] || '');
  if (!storedSalt || !storedHash) throw new Error('パスワードが初期化されていません。');

  var withdrawVerify = verifyPassword_(password, storedSalt, storedHash);
  if (!withdrawVerify.match) throw new Error('パスワードが正しくありません。');

  // ── 事業所会員の代表者チェック ──
  var memberSheet = ss.getSheetByName('T_会員');
  if (!memberSheet) throw new Error('T_会員 シートが見つかりません。');

  var memberFound = findRowByColumnValue_(memberSheet, '会員ID', memberId);
  if (!memberFound) throw new Error('対象会員が見つかりません。');

  var mCols = memberFound.columns;
  var mRow = memberFound.row.slice();
  var memberType = String(mRow[mCols['会員種別コード']] || '');
  var currentStatus = String(mRow[mCols['会員状態コード']] || 'ACTIVE');

  if (currentStatus === 'WITHDRAWN') throw new Error('この会員は既に退会済みです。');
  if (currentStatus === 'WITHDRAWAL_SCHEDULED') throw new Error('既に退会申請済みです。');

  // 事業所会員の場合、代表者のみ退会申請可能（BR-11）。
  // 2026-10-02: 以前は if を入れ子にしており、職員IDが空・職員シートが無い・職員行が
  // 見つからない のいずれでも**何も検証せず素通り**していた（docs/294 §2-4）。
  // 代表者であることを確かめられないなら、通さずに止める（fail-closed）。
  if (memberType === 'BUSINESS') {
    var staffId = String(authRow[authCols['職員ID']] || '').trim();
    if (!staffId) throw new Error('事業所の退会申請は代表者のみ実行できます。');
    var staffSheet = ss.getSheetByName('T_事業所職員');
    if (!staffSheet) throw new Error('職員情報を確認できないため、退会申請を受け付けられません。');
    var staffFound = findRowByColumnValue_(staffSheet, '職員ID', staffId);
    if (!staffFound) throw new Error('職員情報を確認できないため、退会申請を受け付けられません。');
    var staffRole = String(staffFound.row[staffFound.columns['職員権限コード']] || '');
    if (staffRole !== 'REPRESENTATIVE') {
      throw new Error('事業所の退会申請は代表者のみ実行できます。');
    }
  }

  // ── 年度末日を計算（日本会計年度: 4月〜3月）──
  var now = new Date();
  var jstNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  var year = jstNow.getFullYear();
  var month = jstNow.getMonth() + 1; // 1-12
  var fiscalYearEndYear = month >= 4 ? year + 1 : year;
  var withdrawnDate = fiscalYearEndYear + '-03-31';

  // ── T_会員 更新 ──
  mRow[mCols['会員状態コード']] = 'WITHDRAWAL_SCHEDULED';
  mRow[mCols['退会日']] = withdrawnDate;
  mRow[mCols['更新日時']] = new Date().toISOString();

  memberSheet.getRange(memberFound.rowNumber, 1, 1, mRow.length).setValues([mRow]);
  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();

  return {
    scheduled: true,
    memberId: memberId,
    withdrawnDate: withdrawnDate,
  };
}

// ── 退会申請取り消し（年度末前のセルフ取り消し）──────────────
// パスワード再認証 → WITHDRAWAL_SCHEDULED を ACTIVE に戻す → 退会日クリア
function cancelWithdrawalSelf_(payload) {
  if (!payload || !payload.loginId || !payload.password || !payload.memberId) {
    throw new Error('取り消しに必要な情報が不足しています。');
  }

  var loginId = String(payload.loginId).trim();
  var password = String(payload.password);
  var memberId = String(payload.memberId).trim();

  // ── パスワード再認証 ──
  var ss = getOrCreateDatabase_();
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet) throw new Error('認証アカウントテーブルが見つかりません。');

  var authRowInfo = findRowByColumnValue_(authSheet, 'ログインID', loginId);
  if (!authRowInfo) throw new Error('認証情報が見つかりません。');

  var authRow = authRowInfo.row;
  var authCols = authRowInfo.columns;
  var authMemberId = String(authRow[authCols['会員ID']] || '');
  if (authMemberId !== memberId) throw new Error('認証情報と会員IDが一致しません。');

  if (!toBoolean_(authRow[authCols['アカウント有効フラグ']])) throw new Error('アカウントが無効です。');
  if (toBoolean_(authRow[authCols['ロック状態']])) throw new Error('アカウントがロックされています。');

  var storedSalt = String(authRow[authCols['パスワードソルト']] || '');
  var storedHash = String(authRow[authCols['パスワードハッシュ']] || '');
  if (!storedSalt || !storedHash) throw new Error('パスワードが初期化されていません。');

  var infoVerify = verifyPassword_(password, storedSalt, storedHash);
  if (!infoVerify.match) throw new Error('パスワードが正しくありません。');

  // ── 会員状態チェック ──
  var memberSheet = ss.getSheetByName('T_会員');
  if (!memberSheet) throw new Error('T_会員 シートが見つかりません。');

  var memberFound = findRowByColumnValue_(memberSheet, '会員ID', memberId);
  if (!memberFound) throw new Error('対象会員が見つかりません。');

  var mCols = memberFound.columns;
  var mRow = memberFound.row.slice();
  var currentStatus = String(mRow[mCols['会員状態コード']] || 'ACTIVE');

  if (currentStatus !== 'WITHDRAWAL_SCHEDULED') {
    throw new Error('退会申請中ではありません。');
  }

  // 2026-10-13: 事業所会員の退会の取り消しも代表者のみ（退会申請 withdrawSelf_ と同じ規則・BR-11）。
  // 以前は検査が無く、一般職員でも事業所の退会予約を取り消せた。確かめられなければ止める（fail-closed）。
  if (String(mRow[mCols['会員種別コード']] || '') === 'BUSINESS') {
    var cancelStaffId = String(authRow[authCols['職員ID']] || '').trim();
    var cancelStaffSheet = ss.getSheetByName('T_事業所職員');
    var cancelStaffFound = (cancelStaffId && cancelStaffSheet) ? findRowByColumnValue_(cancelStaffSheet, '職員ID', cancelStaffId) : null;
    if (!cancelStaffFound || String(cancelStaffFound.row[cancelStaffFound.columns['職員権限コード']] || '') !== 'REPRESENTATIVE') {
      throw new Error('事業所の退会の取り消しは代表者のみ実行できます。');
    }
  }

  // ── T_会員 更新（ACTIVE に戻す）──
  mRow[mCols['会員状態コード']] = 'ACTIVE';
  mRow[mCols['退会日']] = '';
  mRow[mCols['更新日時']] = new Date().toISOString();

  memberSheet.getRange(memberFound.rowNumber, 1, 1, mRow.length).setValues([mRow]);
  clearAllDataCache_();
  clearAdminDashboardCache_();
  clearTrainingManagementCache_();

  return {
    canceled: true,
    memberId: memberId,
  };
}

// ── 会員セルフサービス更新（OWASP Mass Assignment 対策）──────────────
// 根拠: OWASP Top 10 A01 / ASVS V4.1.2 / CWE-915
// サーバーサイド allowlist でフィールドをフィルタし、管理者専用フィールドへの
// クライアント側からの書き換えを防止する。
// CM番号編集ポリシー（docs/113 案C確定）:
//   careManagerNumber はこのリストに含めない。会員セルフサービスでは読み取り専用。
//   変更は管理者コンソール（ADMIN_MEMBER_WRITABLE_FIELDS_）経由のみ。
var MEMBER_WRITABLE_FIELDS_ = [
  'lastName','firstName','lastKana','firstKana',
  'homePostCode','homePrefecture','homeCity','homeAddressLine','homeAddressLine2','mobilePhone',
  'officePostCode','officePrefecture','officeCity','officeAddressLine','officeAddressLine2','phone','fax',
  'email','mailingPreference','preferredMailDestination',
];
var ADMIN_BATCH_WRITABLE_FIELDS_ = [
  'id',
  'email', 'mailingPreference', 'preferredMailDestination',
  'status', 'joinedDate', 'withdrawnDate',
];
// v143: NIST RBAC — MASTER/ADMIN が会員詳細画面で編集可能なフィールド
// MEMBER_WRITABLE_FIELDS_ の上位互換 + 管理者専用フィールド
var ADMIN_MEMBER_WRITABLE_FIELDS_ = [
  // 会員セルフサービスでも編集可能なフィールド
  'lastName','firstName','lastKana','firstKana',
  'homePostCode','homePrefecture','homeCity','homeAddressLine','homeAddressLine2','mobilePhone',
  'officePostCode','officePrefecture','officeCity','officeAddressLine','officeAddressLine2','phone','fax',
  'email','mailingPreference','preferredMailDestination',
  // 管理者専用フィールド（ADMIN_ONLY_EDIT 層）
  'status','joinedDate','withdrawnDate','withdrawalProcessDate','statusNote','midYearWithdrawal',
  'careManagerNumber','officeName','officeNumber','staffLimit',
];
// v143: 管理者編集で監査ログ対象となるフィールド（ADMIN_ONLY_EDIT 層）
var ADMIN_AUDIT_FIELDS_ = [
  'status','joinedDate','withdrawnDate','withdrawalProcessDate','statusNote','midYearWithdrawal',
];
// v106: NIST RBAC — ロール別職員フィールド allowlist
var STAFF_WRITABLE_FIELDS_REPRESENTATIVE_ = ['id','name','kana','email','status','role'];
var STAFF_WRITABLE_FIELDS_ADMIN_ = ['id','name','kana','email','status','role']; // v167: ADMIN can change roles of others (not self, not REPRESENTATIVE)
var STAFF_WRITABLE_FIELDS_SELF_ = ['id','name','kana','email'];

function buildSelfServiceBusinessStaffSnapshot_(row) {
  row = row || {};
  var lastName = String(row['姓'] || '');
  var firstName = String(row['名'] || '');
  var lastKana = String(row['セイ'] || '');
  var firstKana = String(row['メイ'] || '');
  return {
    id: String(row['職員ID'] || ''),
    lastName: lastName,
    firstName: firstName,
    lastKana: lastKana,
    firstKana: firstKana,
    name: String(row['氏名'] || [lastName, firstName].join(' ').trim() || ''),
    kana: String(row['フリガナ'] || [lastKana, firstKana].join(' ').trim() || ''),
    email: String(row['メールアドレス'] || ''),
    role: String(row['職員権限コード'] || 'STAFF'),
    status: String(row['職員状態コード'] || 'ENROLLED'),
    joinedDate: normalizeDateInput_(row['入会日']),
    withdrawnDate: normalizeDateInput_(row['退会日'])
  };
}

function mergeSelfServiceBusinessStaffPayload_(base, incoming, allowedFields) {
  var result = {};
  var source = incoming || {};
  for (var key in base) {
    if (Object.prototype.hasOwnProperty.call(base, key)) {
      result[key] = base[key];
    }
  }
  for (var i = 0; i < allowedFields.length; i += 1) {
    var field = allowedFields[i];
    if (field === 'id') continue;
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      result[field] = source[field];
    }
  }
  return result;
}

function sanitizeAdminBatchMemberPayload_(payload) {
  if (!payload || !payload.id) throw new Error('会員IDが未指定です。');
  var sanitized = { id: String(payload.id) };
  for (var i = 0; i < ADMIN_BATCH_WRITABLE_FIELDS_.length; i += 1) {
    var key = ADMIN_BATCH_WRITABLE_FIELDS_[i];
    if (key !== 'id' && Object.prototype.hasOwnProperty.call(payload, key)) {
      sanitized[key] = payload[key];
    }
  }
  return sanitized;
}

// v143: 管理者会員詳細編集用サニタイズ — ADMIN_MEMBER_WRITABLE_FIELDS_ でフィルタ
function sanitizeAdminMemberPayload_(payload) {
  if (!payload || !payload.id) throw new Error('会員IDが未指定です。');
  var sanitized = { id: String(payload.id), type: payload.type };
  var hasOwn = Object.prototype.hasOwnProperty;
  for (var i = 0; i < ADMIN_MEMBER_WRITABLE_FIELDS_.length; i += 1) {
    var key = ADMIN_MEMBER_WRITABLE_FIELDS_[i];
    if (hasOwn.call(payload, key)) {
      sanitized[key] = payload[key];
    }
  }
  // staff 配列はそのまま透過（syncBusinessStaffRows_ が処理）
  if (hasOwn.call(payload, 'staff')) {
    sanitized.staff = payload.staff;
  }
  return sanitized;
}

// v143: 監査ログ追記 — ADMIN_AUDIT_FIELDS_ の変更を T_監査ログ に記録
// v259: ログSSが設定されている場合はそちらに書き込む
function appendAdminAuditLog_(ss, adminEmail, memberId, changes) {
  if (!changes || changes.length === 0) return;
  appendAuditLogEntries_(changes.map(function(c) {
    return { operatorEmail: adminEmail, operation: 'ADMIN_EDIT', tableName: 'T_会員',
      recordId: memberId, fieldName: c.field, oldValue: c.oldValue, newValue: c.newValue };
  }));
}

function updateMembersBatch_(payload) {
  if (!payload || !Array.isArray(payload.records) || payload.records.length === 0) {
    throw new Error('保存対象の会員データがありません。');
  }
  if (payload.records.length > 100) {
    throw new Error('会員一括編集は最大100件までです。');
  }

  var adminSession = checkAdminBySession_();
  var ss = getOrCreateDatabase_();
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var results = [];
    // 2026-10-13: 入力の整形（検証）は書き込む前に全件で行う。
    var sanitizedList = payload.records.map(function(rec) { return sanitizeAdminBatchMemberPayload_(rec); });
    for (var i = 0; i < sanitizedList.length; i += 1) {
      try {
        results.push(updateMember_(sanitizedList[i], {
          skipAdminCheck: true,
          adminSession: adminSession,
          ss: ss,
          skipCacheClear: true,
        }));
      } catch (batchErr) {
        // 1 件ずつ書くため、途中で失敗するとそれより前は保存済みになる。
        // 以前は「失敗」としか伝わらず、何件保存されたか分からなかった。
        throw new Error((i + 1) + ' 件目（会員ID: ' + String(sanitizedList[i].id || '') + '）で保存できませんでした: '
          + batchErr.message + '（それより前の ' + i + ' 件は保存済みです）');
      }
      // 2026-10-13: 退会にしたら認証も無効化する（他の退会経路と同じ）。以前はログインできる状態が残った。
      if (String(sanitizedList[i].status || '') === 'WITHDRAWN') {
        disableAuthAccountsByMemberId_(ss, String(sanitizedList[i].id || ''));
      }
    }
    return results;
  } finally {
    // 途中で失敗しても、保存済みの分が画面に反映されるようにキャッシュを消す
    clearAllDataCache_();
    clearAdminDashboardCache_();
    clearTrainingManagementCache_();
    lock.releaseLock();
  }
}

// ── v125: フラット人物リスト取得（個人会員+事業所職員を混合） ──
function getAdminPersonList_() {
  var ss = getOrCreateDatabase_();
  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });
  var staffRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });
  var authRows = getRowsAsObjects_(ss, 'T_認証アカウント').filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });

  // 事業所名のルックアップ（会員ID→事業所名）
  var officeNameByMemberId = {};
  for (var mi = 0; mi < memberRows.length; mi++) {
    var m = memberRows[mi];
    if (String(m['会員種別コード'] || '') === 'BUSINESS') {
      officeNameByMemberId[String(m['会員ID'] || '')] = String(m['勤務先名'] || '');
    }
  }

  // 認証アカウントの有効フラグルックアップ
  // 個人会員: 会員IDで引く（職員ID空）、職員: 職員IDで引く
  var authByMemberId = {};
  var authByStaffId = {};
  for (var ai = 0; ai < authRows.length; ai++) {
    var auth = authRows[ai];
    var aStaffId = String(auth['職員ID'] || '').trim();
    var aMemberId = String(auth['会員ID'] || '').trim();
    if (aStaffId) {
      authByStaffId[aStaffId] = toBoolean_(auth['アカウント有効フラグ']);
    } else if (aMemberId) {
      authByMemberId[aMemberId] = toBoolean_(auth['アカウント有効フラグ']);
    }
  }

  var persons = [];

  // 個人会員・賛助会員
  for (var i = 0; i < memberRows.length; i++) {
    var member = memberRows[i];
    var memberType = String(member['会員種別コード'] || 'INDIVIDUAL');
    if (memberType === 'BUSINESS') continue; // 事業所エンティティ自体はスキップ
    var memberId = String(member['会員ID'] || '');
    persons.push({
      personKey: memberId,
      personType: memberType === 'SUPPORT' ? 'SUPPORT' : 'INDIVIDUAL',
      displayName: (String(member['姓'] || '') + ' ' + String(member['名'] || '')).trim() || memberId,
      kana: (String(member['セイ'] || '') + ' ' + String(member['メイ'] || '')).trim(),
      email: String(member['代表メールアドレス'] || ''),
      officeName: String(member['勤務先名'] || ''),
      memberId: memberId,
      staffId: null,
      status: String(member['会員状態コード'] || 'ACTIVE'),
      joinedDate: normalizeDateInput_(member['入会日']),
      withdrawnDate: normalizeDateInput_(member['退会日']),
      mailingPreference: String(member['発送方法コード'] || 'EMAIL'),
      preferredMailDestination: String(member['郵送先区分コード'] || 'OFFICE'),
      staffRole: null,
      careManagerNumber: String(member['介護支援専門員番号'] || ''),
      accountEnabled: authByMemberId[memberId] !== undefined ? authByMemberId[memberId] : true,
      // v376.69: 一括編集の対象拡張（連絡先・勤務先・自宅）
      phone: String(member['勤務先電話番号'] || ''),
      fax: String(member['勤務先FAX番号'] || ''),
      mobilePhone: String(member['携帯電話番号'] || ''),
      officePostCode: String(member['勤務先郵便番号'] || ''),
      officePrefecture: String(member['勤務先都道府県'] || ''),
      officeCity: String(member['勤務先市区町村'] || ''),
      officeAddressLine: String(member['勤務先住所'] || ''),
      officeAddressLine2: String(member['勤務先住所2'] || ''),
      homePostCode: String(member['自宅郵便番号'] || ''),
      homePrefecture: String(member['自宅都道府県'] || ''),
      homeCity: String(member['自宅市区町村'] || ''),
      homeAddressLine: String(member['自宅住所'] || ''),
      homeAddressLine2: String(member['自宅住所2'] || ''),
    });
  }

  // 事業所職員
  for (var j = 0; j < staffRows.length; j++) {
    var staff = staffRows[j];
    var staffMemberId = String(staff['会員ID'] || '');
    var staffId = String(staff['職員ID'] || '');
    persons.push({
      personKey: staffMemberId + ':' + staffId,
      personType: 'OFFICE_STAFF',
      displayName: String(staff['氏名'] || ''),
      kana: String(staff['フリガナ'] || ''),
      email: String(staff['メールアドレス'] || ''),
      officeName: officeNameByMemberId[staffMemberId] || '',
      memberId: staffMemberId,
      staffId: staffId,
      status: String(staff['職員状態コード'] || 'ENROLLED'),
      joinedDate: normalizeDateInput_(staff['入会日']),
      withdrawnDate: normalizeDateInput_(staff['退会日']),
      mailingPreference: String(staff['メール配信希望コード'] || 'YES'),
      preferredMailDestination: '',
      staffRole: String(staff['職員権限コード'] || 'STAFF'),
      careManagerNumber: String(staff['介護支援専門員番号'] || ''),
      accountEnabled: authByStaffId[staffId] !== undefined ? authByStaffId[staffId] : true,
    });
  }

  persons.sort(function(a, b) {
    return String(a.displayName || '').localeCompare(String(b.displayName || ''));
  });

  return { persons: persons };
}

// ── v125: フラット人物の一括更新 ──
// v376.69: 一括編集で更新できる項目。
// 以前は 6 項目だけで、住所や電話をまとめて直す手段が無く「スプレッドシートを直接開く」しかなかった。
// GCP 移行後はシートを開けなくなるため（docs/261 T-07）、連絡先・住所まで拡張する。
//
// **意図的に含めないもの**（一括で書き換えると事故が大きい・別画面で扱う）:
//   氏名 / カナ / 介護支援専門員番号（本人特定と会員ログイン ID に直結）
//   会員種別 / 事業所の所属（移行機能で扱う）／職員数上限（事業所設定）
var ADMIN_BATCH_PERSON_WRITABLE_INDIVIDUAL_ = [
  'email', 'mailingPreference', 'preferredMailDestination',
  'status', 'joinedDate', 'withdrawnDate',
  // v376.69: 連絡先
  'phone', 'fax', 'mobilePhone',
  // v376.69: 勤務先
  'officeName', 'officePostCode', 'officePrefecture', 'officeCity', 'officeAddressLine', 'officeAddressLine2',
  // v376.69: 自宅
  'homePostCode', 'homePrefecture', 'homeCity', 'homeAddressLine', 'homeAddressLine2',
];
// 職員（T_事業所職員）は列が氏名・カナ・メール・権限・状態・入会/退会日・専門員番号のみで、
// **電話や住所の列を持たない**（連絡先は所属事業所＝T_会員 側が正本）。
// そのため一括編集の対象も従来どおり 4 項目に留める。列を増やす場合はスキーマ変更が先。
var ADMIN_BATCH_PERSON_WRITABLE_STAFF_ = [
  'email', 'status', 'joinedDate', 'withdrawnDate',
];

function updatePersonsBatch_(payload) {
  if (!payload || !Array.isArray(payload.records) || payload.records.length === 0) {
    throw new Error('保存対象のデータがありません。');
  }
  if (payload.records.length > 100) {
    throw new Error('一括編集は最大100件までです。');
  }

  var adminSession = checkAdminBySession_();
  var ss = getOrCreateDatabase_();
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var results = [];
    // 2026-10-13: 書き込む前に全件の形を確かめる（途中で止まって一部だけ保存されるのを減らす）。
    for (var pi = 0; pi < payload.records.length; pi++) {
      var pre = payload.records[pi];
      if (!pre || !pre.personKey || !pre.personType) {
        throw new Error('レコード ' + (pi + 1) + ': personKey または personType が未指定です。');
      }
      var preType = String(pre.personType);
      if (preType !== 'INDIVIDUAL' && preType !== 'SUPPORT' && preType !== 'OFFICE_STAFF') {
        throw new Error('レコード ' + (pi + 1) + ': 不明な personType: ' + preType);
      }
      if (preType === 'OFFICE_STAFF') {
        if (!String(pre.staffId || '')) throw new Error('レコード ' + (pi + 1) + ': staffId が未指定です。');
        // 以前は不正な状態値を黙って ENROLLED（在籍）に書き換えて成功と返していた。
        if (Object.prototype.hasOwnProperty.call(pre, 'status') && !hasMasterOption_(null, 'M_職員状態', pre.status)) {
          throw new Error('レコード ' + (pi + 1) + ': 職員の状態の値が不正です（' + String(pre.status || '空') + '）。');
        }
      }
    }
    for (var i = 0; i < payload.records.length; i++) {
      var rec = payload.records[i];
      try {
      if (!rec || !rec.personKey || !rec.personType) {
        throw new Error('レコード ' + (i + 1) + ': personKey または personType が未指定です。');
      }
      var personType = String(rec.personType);

      if (personType === 'INDIVIDUAL' || personType === 'SUPPORT') {
        // T_会員 を更新
        var memberSanitized = { id: String(rec.memberId || rec.personKey) };
        for (var mi = 0; mi < ADMIN_BATCH_PERSON_WRITABLE_INDIVIDUAL_.length; mi++) {
          var mk = ADMIN_BATCH_PERSON_WRITABLE_INDIVIDUAL_[mi];
          if (Object.prototype.hasOwnProperty.call(rec, mk)) {
            memberSanitized[mk] = rec[mk];
          }
        }
        results.push(updateMember_(memberSanitized, {
          skipAdminCheck: true,
          adminSession: adminSession,
          ss: ss,
          skipCacheClear: true,
        }));

        // status を WITHDRAWN にした場合、認証アカウントも無効化
        if (String(rec.status) === 'WITHDRAWN') {
          disableAuthAccountsByMemberId_(ss, memberSanitized.id);
        }

      } else if (personType === 'OFFICE_STAFF') {
        // T_事業所職員 を更新
        var staffId = String(rec.staffId || '');
        if (!staffId) throw new Error('レコード ' + (i + 1) + ': staffId が未指定です。');

        var staffSheet = ss.getSheetByName('T_事業所職員');
        if (!staffSheet) throw new Error('T_事業所職員 シートが見つかりません。');
        var staffFound = findRowByColumnValue_(staffSheet, '職員ID', staffId);
        if (!staffFound) throw new Error('レコード ' + (i + 1) + ': 職員ID ' + staffId + ' が見つかりません。');

        var sCols = staffFound.columns;
        var sRow = staffFound.row.slice();
        var disableStaffAuthAfterWrite = false;
        var nowIso = new Date().toISOString();

        // Allowlist でフィルタして更新
        for (var si = 0; si < ADMIN_BATCH_PERSON_WRITABLE_STAFF_.length; si++) {
          var sk = ADMIN_BATCH_PERSON_WRITABLE_STAFF_[si];
          if (!Object.prototype.hasOwnProperty.call(rec, sk)) continue;

          if (sk === 'email' && sCols['メールアドレス'] != null) {
            sRow[sCols['メールアドレス']] = String(rec.email || '');
          } else if (sk === 'status' && sCols['職員状態コード'] != null) {
            var newStatus = String(rec.status || 'ENROLLED');
            sRow[sCols['職員状態コード']] = newStatus;
            // LEFT にした場合は退会日を自動セット + 認証アカウント無効化（無効化は行を書いた後）
            if (newStatus === 'LEFT') {
              if (!normalizeDateInput_(sRow[sCols['退会日']])) {
                sRow[sCols['退会日']] = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
              }
              disableStaffAuthAfterWrite = true;
            }
          } else if (sk === 'joinedDate' && sCols['入会日'] != null) {
            sRow[sCols['入会日']] = normalizeDateInput_(rec.joinedDate) || '';
          } else if (sk === 'withdrawnDate' && sCols['退会日'] != null) {
            sRow[sCols['退会日']] = normalizeDateInput_(rec.withdrawnDate) || '';
          }
        }

        sRow[sCols['更新日時']] = nowIso;
        staffSheet.getRange(staffFound.rowNumber, 1, 1, sRow.length).setValues([sRow]);
        if (disableStaffAuthAfterWrite) disableAuthAccountsByStaffId_(ss, staffId);
        results.push({ updated: true, staffId: staffId });

      } else {
        throw new Error('レコード ' + (i + 1) + ': 不明な personType: ' + personType);
      }
      } catch (personErr) {
        // 1 件ずつ書くため、途中で失敗するとそれより前は保存済みになる。件数を伝える。
        throw new Error((i + 1) + ' 件目で保存できませんでした: ' + personErr.message + '（それより前の ' + i + ' 件は保存済みです）');
      }
    }
    return results;
  } finally {
    // 途中で失敗しても、保存済みの分が画面に反映されるようにキャッシュを消す
    clearAllDataCache_();
    clearAdminDashboardCache_();
    clearTrainingManagementCache_();
    lock.releaseLock();
  }
}

function updateMemberSelf_(payload) {
  if (!payload || !payload.loginId) throw new Error('認証情報が不足しています。');
  if (!payload.id) throw new Error('会員IDが未指定です。');

  // 1. loginId → 会員ID の照合（なりすまし防止）+ 職員ロール判定
  var ss = getOrCreateDatabase_();
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet) throw new Error('認証テーブルが見つかりません。');
  var authRow = findRowByColumnValue_(authSheet, 'ログインID', String(payload.loginId).trim());
  if (!authRow) throw new Error('認証情報が不正です。');
  var authMemberId = String(authRow.row[authRow.columns['会員ID']] || '');
  if (authMemberId !== String(payload.id)) {
    throw new Error('他の会員のデータは更新できません。');
  }

  // v106: 呼び出し元の職員ロールを判定（NIST RBAC）
  var callerStaffId = String(authRow.row[authRow.columns['職員ID']] || '').trim();
  var callerStaffRole = '';
  if (callerStaffId) {
    var staffSheet = ss.getSheetByName('T_事業所職員');
    if (staffSheet) {
      var staffFound = findRowByColumnValue_(staffSheet, '職員ID', callerStaffId);
      if (staffFound) {
        callerStaffRole = String(staffFound.row[staffFound.columns['職員権限コード']] || 'STAFF');
      }
    }
  }

  // 2. payload をサーバーサイド allowlist でフィルタ
  var sanitized = { id: payload.id, type: payload.type };

  // v106: STAFF ロールは会員基本情報・事業所情報を変更不可
  if (callerStaffRole !== 'STAFF') {
    for (var i = 0; i < MEMBER_WRITABLE_FIELDS_.length; i++) {
      var key = MEMBER_WRITABLE_FIELDS_[i];
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        sanitized[key] = payload[key];
      }
    }
  }

  // 3. 職員データをロール別に制御しつつ、送信されなかった既存行は保持する
  if (Object.prototype.hasOwnProperty.call(payload, 'staff') && Array.isArray(payload.staff)) {
    var currentStaffRows = getBusinessStaffRowsByMember_(ss, String(payload.id || ''));
    var currentStaffById = {};
    for (var csr = 0; csr < currentStaffRows.length; csr += 1) {
      var currentStaffRow = currentStaffRows[csr] || {};
      var currentStaffRowId = String(currentStaffRow['職員ID'] || '').trim();
      if (!currentStaffRowId) continue;
      currentStaffById[currentStaffRowId] = buildSelfServiceBusinessStaffSnapshot_(currentStaffRow);
    }

    var submittedStaff = payload.staff.map(function(s) {
      return {
        id: String(s.id || ''),
        lastName: String(s.lastName || ''),
        firstName: String(s.firstName || ''),
        lastKana: String(s.lastKana || ''),
        firstKana: String(s.firstKana || ''),
        name: String(s.name || ''),
        kana: String(s.kana || ''),
        email: String(s.email || ''),
        role: String(s.role || ''),
        status: String(s.status || ''),
      };
    });

    var normalizedStaff = [];

    if (callerStaffRole === 'STAFF') {
      if (!currentStaffById[callerStaffId]) {
        throw new Error('自身の職員データが見つかりません。');
      }
      var ownSubmittedStaff = null;
      for (var ssi = 0; ssi < submittedStaff.length; ssi += 1) {
        if (submittedStaff[ssi].id === callerStaffId) {
          ownSubmittedStaff = submittedStaff[ssi];
          break;
        }
      }
      if (!ownSubmittedStaff) {
        throw new Error('他の職員のデータは更新できません。');
      }
      for (var currentStaffId in currentStaffById) {
        if (!Object.prototype.hasOwnProperty.call(currentStaffById, currentStaffId)) continue;
        var currentSnapshot = currentStaffById[currentStaffId];
        if (currentStaffId === callerStaffId) {
          normalizedStaff.push(mergeSelfServiceBusinessStaffPayload_(currentSnapshot, ownSubmittedStaff, STAFF_WRITABLE_FIELDS_SELF_));
        } else {
          normalizedStaff.push(currentSnapshot);
        }
      }
    } else if (callerStaffRole === 'ADMIN' || callerStaffRole === 'REPRESENTATIVE') {
      var otherOfficeStaffIds = null; // 他の事業所の職員ID（必要になったときだけ読む）
      for (var submittedIndex = 0; submittedIndex < submittedStaff.length; submittedIndex += 1) {
        var submitted = submittedStaff[submittedIndex];
        if (!submitted.id) continue;
        var currentSnapshotById = currentStaffById[submitted.id] || null;
        var currentRole = currentSnapshotById ? normalizeBusinessStaffRole_(currentSnapshotById.role) : '';

        if (callerStaffRole === 'ADMIN' && currentRole === 'REPRESENTATIVE') {
          normalizedStaff.push(currentSnapshotById);
          continue;
        }

        if (callerStaffRole === 'REPRESENTATIVE' && submitted.id === callerStaffId) {
          normalizedStaff.push(mergeSelfServiceBusinessStaffPayload_(
            currentSnapshotById || submitted,
            submitted,
            STAFF_WRITABLE_FIELDS_SELF_
          ));
          continue;
        }

        if (callerStaffRole === 'ADMIN' && submitted.id === callerStaffId) {
          normalizedStaff.push(mergeSelfServiceBusinessStaffPayload_(
            currentSnapshotById || submitted,
            submitted,
            ['id','name','kana','email','status']
          ));
          continue;
        }

        // 2026-10-13: 自分の事業所に無い職員IDは「新しい職員」に限る。以前は保存処理（upsertStaffRow_）が
        // シート全体から職員IDで行を探すため、他の事業所の職員を自分の事業所へ移し、メールを差し替えられた。
        if (!currentSnapshotById) {
          if (!otherOfficeStaffIds) {
            otherOfficeStaffIds = {};
            getRowsAsObjects_(ss, 'T_事業所職員').forEach(function(r) {
              if (String(r['会員ID'] || '') !== String(payload.id || '')) otherOfficeStaffIds[String(r['職員ID'] || '')] = true;
            });
          }
          if (otherOfficeStaffIds[submitted.id]) throw new Error('他の事業所の職員は変更できません。');
        }
        // 2026-10-13: 画面の権限の選択肢は「管理者／一般」だけ。代表者への変更は事務局が行う。
        // 以前はそのまま保存しており、事業所の管理者が同僚を代表者にできた。
        if (normalizeBusinessStaffRole_(submitted.role) === 'REPRESENTATIVE' && currentRole !== 'REPRESENTATIVE') {
          throw new Error('代表者の変更は事務局へご連絡ください。');
        }
        normalizedStaff.push(submitted);
      }

      for (var existingStaffId in currentStaffById) {
        if (!Object.prototype.hasOwnProperty.call(currentStaffById, existingStaffId)) continue;
        var alreadyIncluded = false;
        for (var ni = 0; ni < normalizedStaff.length; ni += 1) {
          if (normalizedStaff[ni].id === existingStaffId) {
            alreadyIncluded = true;
            break;
          }
        }
        if (!alreadyIncluded) {
          normalizedStaff.push(currentStaffById[existingStaffId]);
        }
      }
    }

    if (normalizedStaff.length > 0) {
      sanitized.staff = normalizedStaff;
    }
  }

  // 4. 会員セルフサービス専用経路: admin 認証 wrapper を通さず保存 core へ渡す
  return saveMemberCore_(sanitized, {
    skipAdminCheck: true,
    ss: ss,
    adminSession: callerStaffId ? {
      staffId: callerStaffId,
      roleCode: callerStaffRole
    } : null
  });
}

function updateMember_(payload, options) {
  var skipAdminCheck = false;
  var adminSession = null;
  var ss = null;
  var skipCacheClear = false;
  if (typeof options === 'boolean') {
    skipAdminCheck = options;
  } else if (options && typeof options === 'object') {
    skipAdminCheck = options.skipAdminCheck === true;
    adminSession = options.adminSession || null;
    ss = options.ss || null;
    skipCacheClear = options.skipCacheClear === true;
  }
  if (!adminSession && !skipAdminCheck) {
    adminSession = checkAdminBySession_();
  }
  return saveMemberCore_(payload, {
    skipAdminCheck: true,
    adminSession: adminSession,
    ss: ss,
    skipCacheClear: skipCacheClear,
    enableAdminRoleValidation: true,
    enableAdminAudit: true,
    // 管理者セッションを渡さない経路（変更申請の承認・年会費画面からの退会）でも、
    // 監査ログの実行者だけは渡せるようにする。セッションを渡すと CM 番号の緩和判定まで変わるため分ける。
    auditActor: options && typeof options === 'object' ? String(options.auditActor || '') : '',
  });
}

function saveMemberCore_(payload, options) {
  if (!payload || !payload.id) throw new Error('会員IDが未指定です。');
  var skipAdminCheck = false;
  var adminSession = null;
  var ss = null;
  var skipCacheClear = false;
  var enableAdminRoleValidation = false;
  var enableAdminAudit = false;
  var auditActor = '';
  if (typeof options === 'boolean') {
    skipAdminCheck = options;
  } else if (options && typeof options === 'object') {
    skipAdminCheck = options.skipAdminCheck === true;
    adminSession = options.adminSession || null;
    ss = options.ss || null;
    skipCacheClear = options.skipCacheClear === true;
    enableAdminRoleValidation = options.enableAdminRoleValidation === true;
    enableAdminAudit = options.enableAdminAudit === true;
    auditActor = String(options.auditActor || '');
  }
  if (!ss) {
    ss = getOrCreateDatabase_();
  }
  var sheet = ss.getSheetByName('T_会員');
  if (!sheet) throw new Error('T_会員 シートが見つかりません。');

  var found = findRowByColumnValue_(sheet, '会員ID', String(payload.id));
  if (!found) throw new Error('対象会員が見つかりません。');

  var cols = found.columns;
  var row = found.row.slice();
  requireColumns_(cols, [
    '会員状態コード', '入会日', '退会日', '削除フラグ',
    '姓', '名', 'セイ', 'メイ',
    '勤務先名', '勤務先郵便番号', '勤務先都道府県', '勤務先市区町村', '勤務先住所',
    '勤務先電話番号', '勤務先FAX番号',
    '自宅郵便番号', '自宅都道府県', '自宅市区町村', '自宅住所',
    '携帯電話番号', '介護支援専門員番号'
  ]);

  var memberTypeCode = String(row[cols['会員種別コード']] || payload.type || 'INDIVIDUAL');
  var hasOwn = Object.prototype.hasOwnProperty;
  // v147: 退会済み事業所会員は代表者バリデーションをスキップ（代表者なしでも情報更新可能）
  var currentMemberStatus = String(row[cols['会員状態コード']] || 'ACTIVE');
  if (enableAdminRoleValidation && memberTypeCode === 'BUSINESS' && currentMemberStatus !== 'WITHDRAWN' && Object.prototype.hasOwnProperty.call(payload, 'staff')) {
    validateBusinessStaffRoleTransition_(ss, String(payload.id), payload.staff, adminSession);
  }
  function fromPayloadOrCurrent(key, currentValue) {
    return hasOwn.call(payload, key) ? payload[key] : currentValue;
  }
  function getCol(name) {
    var idx = cols[name];
    return idx != null ? row[idx] : '';
  }
  var loginIdFallback = String(fromPayloadOrCurrent('loginId', getAnyPasswordLoginIdByMemberId_(ss, String(payload.id))) || '');
  var storedCareManagerNumber = String(getCol('介護支援専門員番号') || '');
  // 賛助会員のログインIDは CM 番号ではない（自動採番の 9 桁等）。
  // これを CM 番号の代替値にすると、連絡先だけの変更承認でも 8 桁検証に失敗する。
  // 賛助会員は DB に既に任意値があれば保全し、空欄なら空欄のままにする。
  // 2026-10-04: 空の CM 番号をログインIDで埋めるのをやめた（docs/299）。
  // ログインIDは CM 番号が無い会員に自動採番される 9 桁（BR-01）で、**CM 番号ではない**。
  // 埋めると「登録されていない CM 番号」を捏造することになり、本番で 19 名が
  // 管理画面の編集 1 回で汚染される状態だった。空は空のまま持ち回る。
  var careManagerFallback = storedCareManagerNumber;
  var mergedPayload = {
    id: String(payload.id),
    type: memberTypeCode,
    lastName: fromPayloadOrCurrent('lastName', String(getCol('姓') || '')),
    firstName: fromPayloadOrCurrent('firstName', String(getCol('名') || '')),
    lastKana: fromPayloadOrCurrent('lastKana', String(getCol('セイ') || '')),
    firstKana: fromPayloadOrCurrent('firstKana', String(getCol('メイ') || '')),
    careManagerNumber: fromPayloadOrCurrent('careManagerNumber', careManagerFallback),
    email: fromPayloadOrCurrent('email', String(getCol('代表メールアドレス') || '')),
    mobilePhone: fromPayloadOrCurrent('mobilePhone', String(getCol('携帯電話番号') || '')),
    officeName: fromPayloadOrCurrent('officeName', String(getCol('勤務先名') || '')),
    officeNumber: fromPayloadOrCurrent('officeNumber', String(getCol('事業所番号') || '')),
    officePostCode: fromPayloadOrCurrent('officePostCode', String(getCol('勤務先郵便番号') || '')),
    officePrefecture: fromPayloadOrCurrent('officePrefecture', String(getCol('勤務先都道府県') || '')),
    officeCity: fromPayloadOrCurrent('officeCity', String(getCol('勤務先市区町村') || '')),
    officeAddressLine: fromPayloadOrCurrent('officeAddressLine', String(getCol('勤務先住所') || '')),
    officeAddressLine2: fromPayloadOrCurrent('officeAddressLine2', String(getCol('勤務先住所2') || '')),
    phone: fromPayloadOrCurrent('phone', String(getCol('勤務先電話番号') || '')),
    fax: fromPayloadOrCurrent('fax', String(getCol('勤務先FAX番号') || '')),
    homePostCode: fromPayloadOrCurrent('homePostCode', String(getCol('自宅郵便番号') || '')),
    homePrefecture: fromPayloadOrCurrent('homePrefecture', String(getCol('自宅都道府県') || '')),
    homeCity: fromPayloadOrCurrent('homeCity', String(getCol('自宅市区町村') || '')),
    homeAddressLine: fromPayloadOrCurrent('homeAddressLine', String(getCol('自宅住所') || '')),
    homeAddressLine2: fromPayloadOrCurrent('homeAddressLine2', String(getCol('自宅住所2') || '')),
    mailingPreference: fromPayloadOrCurrent('mailingPreference', String(getCol('発送方法コード') || 'EMAIL')),
    preferredMailDestination: fromPayloadOrCurrent('preferredMailDestination', String(getCol('郵送先区分コード') || 'OFFICE')),
    staffLimit: fromPayloadOrCurrent('staffLimit', getCol('職員数上限')),
    status: fromPayloadOrCurrent('status', String(getCol('会員状態コード') || 'ACTIVE')),
    joinedDate: fromPayloadOrCurrent('joinedDate', String(getCol('入会日') || '')),
    withdrawnDate: fromPayloadOrCurrent('withdrawnDate', String(getCol('退会日') || '')),
    withdrawalProcessDate: fromPayloadOrCurrent('withdrawalProcessDate', String(getCol('退会処理日') || '')),
    statusNote: fromPayloadOrCurrent('statusNote', String(getCol('ステータスメモ') || '')),
    midYearWithdrawal: fromPayloadOrCurrent('midYearWithdrawal', false),
  };
  // 2026-10-02: 勤務先が「勤務なし」なら、前職の連絡先と住所を会員行に残さない。
  //
  // 変更申請の承認は空文字を適用しない（空欄＝据え置きが仕様）。そのため退職の届け出で
  // phone:'' を送っても消えず、「勤務先名＝勤務なし ＋ 前職の電話・FAX・住所」という
  // 嘘の行ができていた。承認側に空文字の例外を作ると「空欄＝据え置き」が崩れるので、
  // 保存の正本であるここで不変条件として落とす（管理画面からの編集にも効く）。
  //
  // 空の勤務先名は対象にしない。isNoOfficeAffiliation_ は空も「勤務なし」と見なすが、
  // 空は単に未入力の古い行でもありうる。無関係な編集の巻き添えで住所を消さない。
  if (memberTypeCode !== 'BUSINESS'
      && String(mergedPayload.officeName || '').trim() === NO_OFFICE_AFFILIATION_LABEL_) {
    mergedPayload.phone = '';
    mergedPayload.fax = '';
    mergedPayload.officePostCode = '';
    mergedPayload.officePrefecture = '';
    mergedPayload.officeCity = '';
    mergedPayload.officeAddressLine = '';
    mergedPayload.officeAddressLine2 = '';
  }

  // v372.4: admin 権限（MASTER/ADMIN）の場合のみ CM 番号緩和を許可
  var allowRelaxedCm = isAllowedRelaxedCmNumber_(adminSession);
  // 2026-10-02: 書式検証は「値を変えるときだけ」効かせる。今 DB にある値をそのまま
  // 持ち回る保存（別項目だけの変更）は、過去データが書式に合わなくても通す。
  validateMemberPayload_(mergedPayload, memberTypeCode, currentMemberStatus, {
    allowRelaxedCmNumber: allowRelaxedCm,
    // DB 側が既に空なら、空のまま保存することを許す（捏造しないための対）
    allowBlankCareManagerNumber: !storedCareManagerNumber,
    stored: {
      mobilePhone: getCol('携帯電話番号'),
      phone: getCol('勤務先電話番号'),
      fax: getCol('勤務先FAX番号'),
      homePostCode: getCol('自宅郵便番号'),
      officePostCode: getCol('勤務先郵便番号'),
      email: getCol('代表メールアドレス'),
      officeNumber: getCol('事業所番号'),
      careManagerNumber: storedCareManagerNumber,
    },
  });
  // v372.4: DB 保存前に CM 番号を大文字化（既存純数字データは影響なし）
  if (mergedPayload.careManagerNumber) {
    mergedPayload.careManagerNumber = normalizeCmNumberForStorage_(mergedPayload.careManagerNumber);
  }
  var sharedMobile = memberTypeCode === 'BUSINESS' && !String(mergedPayload.mobilePhone || '').trim()
    ? String(mergedPayload.phone || '')
    : String(mergedPayload.mobilePhone || '');

  // v143: 監査ログ用 — 変更前の値を記録
  var prevStatus = String(getCol('会員状態コード') || 'ACTIVE');
  var prevJoinedDate = String(normalizeDateInput_(getCol('入会日')) || '');
  var prevWithdrawnDate = String(normalizeDateInput_(getCol('退会日')) || '');
  var prevWithdrawalProcessDate = String(normalizeDateInput_(getCol('退会処理日')) || '');
  var prevStatusNote = String(getCol('ステータスメモ') || '');

  function setCol(name, value) {
    var idx = cols[name];
    if (idx != null) row[idx] = value !== undefined ? value : '';
  }

  setCol('姓', mergedPayload.lastName || '');
  setCol('名', mergedPayload.firstName || '');
  // v376: kana 列は normalizeKana_ で全角カタカナに正規化（不正文字は throw）
  setCol('セイ', normalizeAndValidateKana_(mergedPayload.lastKana || '', '会員のセイ'));
  setCol('メイ', normalizeAndValidateKana_(mergedPayload.firstKana || '', '会員のメイ'));
  // v143: MASTER/ADMIN は全有効ステータスへ遷移可能（復旧・強制退会を含む）
  var rawStatus = String(mergedPayload.status || 'ACTIVE');
  // 値は M_会員状態。TRANSFERRED（移行済み）は同一人物の移行処理だけが付ける状態なので、ここからは付けさせない
  if (!isKnownMasterCode_(ss, 'M_会員状態', rawStatus) || rawStatus === 'TRANSFERRED') {
    throw new Error('無効な会員状態コードです: ' + rawStatus);
  }
  var nextStatus = rawStatus;
  setCol('会員状態コード', nextStatus);
  setCol('入会日', normalizeDateInput_(mergedPayload.joinedDate));
  setCol('退会日', normalizeDateInput_(mergedPayload.withdrawnDate));
  // v143: 退会処理日の保存
  if (cols['退会処理日'] != null) {
    setCol('退会処理日', normalizeDateInput_(mergedPayload.withdrawalProcessDate));
  }
  if (cols['ステータスメモ'] != null) {
    setCol('ステータスメモ', String(mergedPayload.statusNote || '').slice(0, 2000));
  }
  var immediateDelete = nextStatus === 'WITHDRAWN' &&
    (mergedPayload.midYearWithdrawal === true || String(mergedPayload.midYearWithdrawal || '').toLowerCase() === 'true');
  setCol('削除フラグ', immediateDelete);
  setCol('介護支援専門員番号', mergedPayload.careManagerNumber || '');
  setCol('代表メールアドレス', mergedPayload.email || '');
  setCol('携帯電話番号', sharedMobile);
  setCol('勤務先名', mergedPayload.officeName || '');
  // 2026-10-04: 事業所番号を書いていなかった。mergedPayload には載っていて
  // 管理者 allowlist にも入っているのに setCol が無く、updateMember が
  // success を返しながら列は変わらないという無言の空振りになっていた（docs/299）。
  setCol('事業所番号', mergedPayload.officeNumber || '');
  setCol('勤務先郵便番号', mergedPayload.officePostCode || '');
  setCol('勤務先都道府県', mergedPayload.officePrefecture || '');
  setCol('勤務先市区町村', mergedPayload.officeCity || '');
  setCol('勤務先住所', mergedPayload.officeAddressLine || '');
  setCol('勤務先住所2', mergedPayload.officeAddressLine2 || '');
  setCol('勤務先電話番号', mergedPayload.phone || '');
  setCol('勤務先FAX番号', mergedPayload.fax || '');
  setCol('自宅郵便番号', mergedPayload.homePostCode || '');
  setCol('自宅都道府県', mergedPayload.homePrefecture || '');
  setCol('自宅市区町村', mergedPayload.homeCity || '');
  setCol('自宅住所', mergedPayload.homeAddressLine || '');
  setCol('自宅住所2', mergedPayload.homeAddressLine2 || '');
  if (memberTypeCode !== 'BUSINESS') {
    assertMemberMailingCodes_(ss, mergedPayload.mailingPreference, mergedPayload.preferredMailDestination);
  }
  setCol('発送方法コード', mergedPayload.mailingPreference || 'EMAIL');
  setCol('郵送先区分コード', mergedPayload.preferredMailDestination || 'OFFICE');
  if (cols['職員数上限'] != null) {
    var n = Number(mergedPayload.staffLimit);
    setCol('職員数上限', isFinite(n) && n >= 1 ? Math.floor(n) : '');
  }
  // v131: 事業所会員は姓/名/セイ/メイ/介護支援専門員番号/発送方法/郵送先区分をブランク強制
  if (memberTypeCode === 'BUSINESS') {
    setCol('姓', '');
    setCol('名', '');
    setCol('セイ', '');
    setCol('メイ', '');
    setCol('介護支援専門員番号', '');
    setCol('発送方法コード', '');
    setCol('郵送先区分コード', '');
  }
  setCol('更新日時', new Date().toISOString());
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  if (hasOwn.call(payload, 'staff')) {
    syncBusinessStaffRows_(ss, String(payload.id), memberTypeCode, payload.staff || []);
  }

  // v143: 管理者操作の監査ログ出力
  // 2026-10-13: 以前は受け直したセッションの email 項目を見ていたが、管理者セッションに email は無い（loginId が正）。
  // 条件が常に偽で、会員状態・入会日・退会日の変更が監査ログに一度も残っていなかった（docs/304 H2）。
  var effectiveAdminSession = adminSession || (payload.__adminSession || null);
  var auditOperator = auditActor || String((effectiveAdminSession && effectiveAdminSession.loginId) || '');
  if (enableAdminAudit && auditOperator) {
    var auditChanges = [];
    var newJoinedDate = String(normalizeDateInput_(mergedPayload.joinedDate) || '');
    var newWithdrawnDate = String(normalizeDateInput_(mergedPayload.withdrawnDate) || '');
    var newWithdrawalProcessDate = String(normalizeDateInput_(mergedPayload.withdrawalProcessDate) || '');
    var newStatusNote = String(mergedPayload.statusNote || '').slice(0, 2000);
    if (nextStatus !== prevStatus) {
      auditChanges.push({ field: '会員状態コード', oldValue: prevStatus, newValue: nextStatus });
    }
    if (newJoinedDate !== prevJoinedDate) {
      auditChanges.push({ field: '入会日', oldValue: prevJoinedDate, newValue: newJoinedDate });
    }
    if (newWithdrawnDate !== prevWithdrawnDate) {
      auditChanges.push({ field: '退会日', oldValue: prevWithdrawnDate, newValue: newWithdrawnDate });
    }
    if (newWithdrawalProcessDate !== prevWithdrawalProcessDate) {
      auditChanges.push({ field: '退会処理日', oldValue: prevWithdrawalProcessDate, newValue: newWithdrawalProcessDate });
    }
    if (newStatusNote !== prevStatusNote) {
      auditChanges.push({ field: 'ステータスメモ', oldValue: prevStatusNote, newValue: newStatusNote });
    }
    appendAdminAuditLog_(ss, auditOperator, payload.id, auditChanges);
  }

  if (!skipCacheClear) {
    clearAllDataCache_();
    clearAdminDashboardCache_();
    clearTrainingManagementCache_();
  }
  return { updated: true, memberId: String(payload.id) };
}

function validateMemberPayload_(payload, memberTypeCode, currentMemberStatus, opts) {
  // v372.4: opts.allowRelaxedCmNumber === true で 1〜10 桁半角英数字を許可
  opts = opts || {};
  var allowRelaxedCm = opts.allowRelaxedCmNumber === true;
  function trim(v) { return String(v || '').trim(); }
  function isHalfWidthKana(v) { return /^[ｦ-ﾟ\s]+$/u.test(trim(v)); }
  function isEightDigits(v) { return /^\d{8}$/.test(trim(v)); }

  // 2026-10-02: 書式検証をサーバ側へ。BR-18「画面側の検証は入力の手助けであり、
  // 最終判定はサーバーで行う」。これまで書式を見ていたのは画面だけで、公開ポータルの
  // 変更申請は allowlist と trim を通るだけだったため、API を直接叩けば
  // 「でんわばんごう」が携帯電話番号として保存できた（docs/294 §2-1）。
  //
  // 正本は src/shared/validators.ts。GAS へ regex を build 注入すると pruner の罠を踏むため
  // （feedback_build_pruner_regex_action_traps）、ここにローカルで持ち、
  // npm run test:validation-matrix が両者の一致を検査する。
  var FORMAT_PHONE = /^[0-9+\-() ー−]{6,}$/;
  var FORMAT_POSTAL = /^\d{3}-?\d{4}$/;
  var FORMAT_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var FORMAT_OFFICE_NO = /^[A-Za-z0-9]{10}$/;

  // 既存データを人質にしない。保存される値が今 DB にある値と同じなら書式を見ない。
  // 本番には `573 -1191`（空白混入）や事業所番号 `0` が実在し、無条件に弾くと
  // その会員は無関係な項目すら直せなくなる。**変更しようとしたときだけ**書式を見る。
  var storedValues = opts.stored || {};
  function checkFormat(key, pattern, label) {
    var value = trim(payload[key]);
    if (!value) return;
    if (trim(storedValues[key]) === value) return;
    if (!pattern.test(value)) throw new Error(label);
  }
  function toDate(v) {
    var text = trim(v);
    if (!text) return null;
    var parsed = new Date(text);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  var isBusiness = memberTypeCode === 'BUSINESS';
  var isSupport = memberTypeCode === 'SUPPORT';
  // v147: 退会済み会員は必須フィールドチェックをスキップ（全会員種別共通）
  var isWithdrawn = String(payload.status || currentMemberStatus || 'ACTIVE') === 'WITHDRAWN';

  // 事業所会員は姓/名/セイ/メイ/介護支援専門員番号をブランク運用（v131）
  if (!isBusiness && !isWithdrawn) {
    if (!trim(payload.lastName)) throw new Error('姓は必須です。');
    if (!trim(payload.firstName)) throw new Error('名は必須です。');
    if (!trim(payload.lastKana)) throw new Error('セイは必須です。');
    if (!trim(payload.firstKana)) throw new Error('メイは必須です。');
    // v376: 半角カナ制限を廃止。ひらがな/全角カナ/半角カナを許容し、保存時に normalizeAndValidateKana_ が全角カタカナに正規化する
    // 2026-10-04: 既に空の行は空のまま保存できる（AGENTS L3.3 既存データを人質にしない）。
    // 新規作成では従来どおり必須。saveMemberCore_ が「DB 側も空だった」ときだけ許可を渡す。
    if (!isSupport && !trim(payload.careManagerNumber) && opts.allowBlankCareManagerNumber !== true) {
      throw new Error('賛助会員以外は介護支援専門員番号が必須です。');
    }
    // 賛助会員の CM 番号は任意。過去データに残る任意値（自動採番ログインID等）も
    // 連絡先変更を妨げないため、必須・書式検証の対象外とする。
    if (!isSupport && trim(payload.careManagerNumber)) {
      // v372.4: admin 例外（MASTER/ADMIN 権限）なら 1〜10 桁半角英数字を許可
      if (allowRelaxedCm) {
        if (!isEightDigits(payload.careManagerNumber) && !isValidCmNumberRelaxed_(payload.careManagerNumber)) {
          throw new Error('介護支援専門員番号は 8 桁の半角数字、または例外として 1〜10 桁の半角英数字で入力してください（看護師等: HN+事業所番号下8桁 / 社会福祉士: HS+事業所番号下8桁）。');
        }
      } else {
        if (!isEightDigits(payload.careManagerNumber)) {
          throw new Error('介護支援専門員番号は8桁の半角数字で入力してください。');
        }
      }
    }
  }

  if (!isWithdrawn) {
    if (!trim(payload.mobilePhone) && !trim(payload.phone)) {
      if (isBusiness) {
        throw new Error('電話番号（または事業所電話番号）が必須です。');
      }
      throw new Error('勤務先電話番号または携帯電話番号のどちらかを入力してください。');
    }
  }

  var hasOfficeAffiliationInput =
    !!trim(payload.officeName) ||
    !!trim(payload.officePostCode) ||
    !!trim(payload.officePrefecture) ||
    !!trim(payload.officeCity) ||
    !!trim(payload.officeAddressLine) ||
    !!trim(payload.phone) ||
    !!trim(payload.fax);
  var preferredMailDestination = trim(payload.preferredMailDestination || (isBusiness ? 'OFFICE' : ''));
  var requireOfficeInfo = !isWithdrawn && (
    isBusiness ||
    (!isBusiness && preferredMailDestination === 'OFFICE')
  );
  var requireHomeInfo = !isWithdrawn && !isBusiness && preferredMailDestination === 'HOME';

  if (requireOfficeInfo) {
    if (!trim(payload.officeName)) throw new Error('事業所情報: 勤務先名は必須です。');
    // 2026-10-01: 「勤務なし」は非空文字なので上の必須チェックを素通りする。
    // 郵送先が勤務先のまま勤務なしにすると、宛名が「勤務なし」の郵便が出る。
    // 退職したなら郵送先は自宅であるはずなので、この組み合わせ自体を作らせない。
    if (!isBusiness && isNoOfficeAffiliation_(payload.officeName)) {
      throw new Error('勤務先が「勤務なし」のときは、郵送先区分を自宅にしてください。');
    }
    if (isBusiness) {
      if (!trim(payload.officePostCode)) throw new Error('事業所情報: 郵便番号は必須です。');
      if (!trim(payload.officePrefecture)) throw new Error('事業所情報: 都道府県は必須です。');
      if (!trim(payload.officeCity)) throw new Error('事業所情報: 市区町村は必須です。');
      if (!trim(payload.officeAddressLine)) throw new Error('事業所情報: 住所は必須です。');
      if (!trim(payload.phone)) throw new Error('事業所情報: 電話番号は必須です。');
    }
  }

  if (requireHomeInfo) {
    if (!trim(payload.homePostCode)) throw new Error('個人会員は自宅郵便番号が必須です。');
    if (!trim(payload.homePrefecture)) throw new Error('個人会員は自宅都道府県が必須です。');
    if (!trim(payload.homeCity)) throw new Error('個人会員は自宅市区町村が必須です。');
    if (!trim(payload.homeAddressLine)) throw new Error('個人会員は自宅住所が必須です。');
  }

  // 書式検証（入力がある項目だけ・値を変えるときだけ）。BR-15 / BR-16 / BR-18。
  // 退会済みも対象にする。履歴として残す値であっても、壊れた値を新たに書く理由は無い。
  checkFormat('mobilePhone', FORMAT_PHONE, '携帯電話番号は半角数字とハイフンで入力してください。');
  checkFormat('phone', FORMAT_PHONE, '電話番号は半角数字とハイフンで入力してください。');
  checkFormat('fax', FORMAT_PHONE, 'FAX番号は半角数字とハイフンで入力してください。');
  checkFormat('homePostCode', FORMAT_POSTAL, '自宅郵便番号は 123-4567 の形式で入力してください。');
  checkFormat('officePostCode', FORMAT_POSTAL, '勤務先郵便番号は 123-4567 の形式で入力してください。');
  checkFormat('email', FORMAT_EMAIL, 'メールアドレスの形式が正しくありません。');
  if (isBusiness) {
    checkFormat('officeNumber', FORMAT_OFFICE_NO, '事業所番号は半角英数字 10 文字で入力してください。');
  }

  // 日付形式と順序チェックはステータスに関係なく維持
  var joined = toDate(payload.joinedDate);
  var withdrawn = toDate(payload.withdrawnDate);
  if (trim(payload.joinedDate) && !joined) throw new Error('入会日は有効な日付で入力してください。');
  if (trim(payload.withdrawnDate) && !withdrawn) throw new Error('退会日は有効な日付で入力してください。');
  if (joined && withdrawn && joined.getTime() > withdrawn.getTime()) {
    throw new Error('退会日は入会日以降で入力してください。');
  }
  var payloadStatus = String(payload.status || 'ACTIVE');
  if ((payloadStatus === 'WITHDRAWN' || payloadStatus === 'WITHDRAWAL_SCHEDULED') && !trim(payload.withdrawnDate)) {
    throw new Error('退会済み・退会予定の会員は退会日の入力が必須です。');
  }
}

function normalizeDateInput_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, 'Asia/Tokyo', 'yyyy-MM-dd');
  }
  var text = String(value || '').trim();
  if (!text) return '';
  var ymd = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) {
    var y = Number(ymd[1]);
    var m = Number(ymd[2]);
    var d = Number(ymd[3]);
    var strictDate = new Date(y, m - 1, d, 12, 0, 0, 0);
    if (
      strictDate.getFullYear() !== y ||
      strictDate.getMonth() !== m - 1 ||
      strictDate.getDate() !== d
    ) return '';
    return text;
  }
  var parsed = new Date(text);
  if (isNaN(parsed.getTime())) return '';
  return Utilities.formatDate(parsed, 'Asia/Tokyo', 'yyyy-MM-dd');
}

function normalizeSearchText_(value) {
  return String(value == null ? '' : value)
    .normalize('NFKC')
    .toLowerCase()
    .trim();
}

function compactSearchText_(value) {
  return normalizeSearchText_(value).replace(/[\s\u3000]+/g, '');
}

function matchesSearchQuery_(query, values) {
  var normalizedQuery = normalizeSearchText_(query);
  if (!normalizedQuery) return true;
  var sourceValues = Array.isArray(values) ? values : [];
  var normalizedHaystack = sourceValues.map(normalizeSearchText_).join(' ');
  var compactHaystack = sourceValues.map(compactSearchText_).join('');
  var compactQuery = compactSearchText_(normalizedQuery);
  if (compactQuery && compactHaystack.indexOf(compactQuery) >= 0) return true;
  var terms = normalizedQuery.split(/[\s\u3000]+/).filter(function(term) { return !!term; });
  return terms.every(function(term) {
    return normalizedHaystack.indexOf(term) >= 0 || compactHaystack.indexOf(compactSearchText_(term)) >= 0;
  });
}

function shouldAutoDeleteOnNextApril_(withdrawnDateRaw, referenceDate) {
  var normalized = normalizeDateInput_(withdrawnDateRaw);
  if (!normalized) return false;
  var parsed = new Date(normalized + 'T00:00:00+09:00');
  if (isNaN(parsed.getTime())) return false;
  var threshold = new Date(parsed.getFullYear() + 1, 3, 1, 0, 0, 0, 0); // next year 4/1
  return referenceDate.getTime() >= threshold.getTime();
}

// v106: 年度開始日ユーティリティ（日本の会計年度: 4月1日〜翌年3月31日）
function getFiscalYearStart_(referenceDate) {
  var d = referenceDate || new Date();
  var year = d.getFullYear();
  var month = d.getMonth(); // 0-based: 0=Jan, 3=Apr
  // 1〜3月は前年度
  if (month < 3) year -= 1;
  return new Date(year, 3, 1, 0, 0, 0, 0); // 4月1日 00:00:00
}

function normalizeBusinessStaffRole_(value) {
  var role = String(value || 'STAFF');
  return hasMasterOption_(null, 'M_職員権限', role) ? role : 'STAFF';
}

function getBusinessStaffRowsByMember_(ss, memberId) {
  return getRowsAsObjects_(ss, 'T_事業所職員').filter(function(row) {
    return !toBoolean_(row['削除フラグ']) && String(row['会員ID'] || '') === String(memberId || '');
  });
}

function validateBusinessStaffRoleTransition_(ss, memberId, staffPayloadList, adminSession) {
  var actorStaffId = String((adminSession && adminSession.staffId) || '').trim();
  var actorRoleCode = String((adminSession && adminSession.roleCode) || '');
  var currentRows = getBusinessStaffRowsByMember_(ss, String(memberId || ''));

  var currentRolesById = {};
  var currentStatusById = {};
  var currentRepIds = {};
  var actorStaffRole = '';

  for (var i = 0; i < currentRows.length; i += 1) {
    var row = currentRows[i];
    var staffId = String(row['職員ID'] || '');
    if (!staffId) continue;
    var role = normalizeBusinessStaffRole_(row['職員権限コード']);
    var status = String(row['職員状態コード'] || 'ENROLLED');
    currentRolesById[staffId] = role;
    currentStatusById[staffId] = status;
    if (status !== 'LEFT' && role === 'REPRESENTATIVE') {
      currentRepIds[staffId] = true;
    }
    if (actorStaffId && actorStaffId === staffId) {
      actorStaffRole = role;
    }
  }

  // システム管理権限（MASTER/ADMIN）は事業所内の職員ロールに関係なく全操作可能
  var adminPermLevel = adminSession ? String(adminSession.adminPermissionLevel || '') : '';
  var isSystemAdmin = (adminPermLevel === 'MASTER' || adminPermLevel === 'ADMIN');

  if (!actorStaffRole) {
    actorStaffRole = isSystemAdmin ? 'REPRESENTATIVE' : 'ADMIN';
  }

  var payloadRows = Array.isArray(staffPayloadList) ? staffPayloadList : [];
  var payloadById = {};
  var nextRolesById = {};
  var nextStatusById = {};
  var nextRepIds = {};

  for (var j = 0; j < payloadRows.length; j += 1) {
    var payload = payloadRows[j] || {};
    var staffId = String(payload.id || '').trim();
    if (!staffId) continue;
    payloadById[staffId] = {
      role: normalizeBusinessStaffRole_(payload.role),
      status: String(payload.status || 'ENROLLED') === 'LEFT' ? 'LEFT' : 'ENROLLED',
    };
  }

  for (var existingId in currentRolesById) {
    if (!Object.prototype.hasOwnProperty.call(currentRolesById, existingId)) continue;
    var currentRole = currentRolesById[existingId];
    var currentStatus = currentStatusById[existingId] || 'ENROLLED';
    var nextStatus = currentStatus;
    var nextRole = currentRole;
    if (Object.prototype.hasOwnProperty.call(payloadById, existingId)) {
      nextStatus = payloadById[existingId].status;
      nextRole = payloadById[existingId].role;
    } else {
      nextStatus = 'LEFT';
    }
    nextRolesById[existingId] = nextRole;
    nextStatusById[existingId] = nextStatus;
    if (nextStatus !== 'LEFT' && nextRole === 'REPRESENTATIVE') {
      nextRepIds[existingId] = true;
    }
    if (!isSystemAdmin && actorStaffRole !== 'REPRESENTATIVE') {
      // BR-06「ADMIN は…自分自身のロールも変更できない」。
      // 2026-10-02: 代表者がらみの遷移しか見ておらず、ADMIN の自己降格が通っていた
      // （docs/294 §2-3）。昇格は代表者ガードが止めるが、仕様どおりではなかった。
      if (actorStaffId && existingId === actorStaffId && nextRole !== currentRole) {
        throw new Error('自分自身のロールは変更できません。代表者にご依頼ください。');
      }
      if (currentRole === 'REPRESENTATIVE' && nextRole !== 'REPRESENTATIVE') {
        throw new Error('代表者ロールは代表者または管理者のみ変更できます。');
      }
      if (currentRole !== 'REPRESENTATIVE' && nextRole === 'REPRESENTATIVE') {
        throw new Error('代表者は代表者または管理者のみ登録できます。');
      }
    }
  }

  for (var payloadId in payloadById) {
    if (!Object.prototype.hasOwnProperty.call(payloadById, payloadId)) continue;
    if (Object.prototype.hasOwnProperty.call(currentRolesById, payloadId)) continue;
    var normalizedRole = payloadById[payloadId].role;
    var normalizedStatus = payloadById[payloadId].status;
    nextRolesById[payloadId] = normalizedRole;
    nextStatusById[payloadId] = normalizedStatus;
    if (normalizedStatus !== 'LEFT' && normalizedRole === 'REPRESENTATIVE') {
      nextRepIds[payloadId] = true;
    }
    if (!isSystemAdmin && actorStaffRole !== 'REPRESENTATIVE' && normalizedRole === 'REPRESENTATIVE') {
      throw new Error('代表者は代表者または管理者のみ登録できます。');
    }
  }

  var repCount = 0;
  var activeRepCount = 0;
  for (var finalId in nextRepIds) {
    if (Object.prototype.hasOwnProperty.call(nextRepIds, finalId)) {
      repCount += 1;
    }
  }
  if (repCount === 0) {
    throw new Error('代表者は必ず1名登録してください。');
  }
  if (repCount > 1) {
    throw new Error('代表者は1名のみ登録できます。');
  }

  for (var activeRoleId in nextRolesById) {
    if (!Object.prototype.hasOwnProperty.call(nextRolesById, activeRoleId)) continue;
    if ((nextStatusById[activeRoleId] || 'ENROLLED') === 'LEFT') continue;
    if (nextRolesById[activeRoleId] === 'REPRESENTATIVE') {
      activeRepCount += 1;
    }
  }
  if (activeRepCount === 0) {
    throw new Error('代表者は必ず1名登録してください。');
  }
  if (activeRepCount > 1) {
    throw new Error('代表者は1名のみ登録できます。');
  }
}

function applyWithdrawalDeletionPolicy_() {
  var ss = getOrCreateDatabase_();
  var now = new Date();

  // ── Phase 1: 退会予定 → 退会確定（退会日を過ぎた WITHDRAWAL_SCHEDULED を WITHDRAWN に）──
  promoteScheduledWithdrawals_(ss, now);

  // ── Phase 2: 退会済みの削除フラグ付与（既存ロジック）──
  markAutoDeletedRows_(ss, 'T_会員', '会員状態コード', 'WITHDRAWN', '退会日');
  markAutoDeletedRows_(ss, 'T_事業所職員', '職員状態コード', 'LEFT', '退会日');

  function markAutoDeletedRows_(spreadsheet, sheetName, statusCol, withdrawnCode, withdrawnDateCol) {
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() < 2) return;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var cols = {};
    for (var i = 0; i < headers.length; i += 1) cols[headers[i]] = i;
    if (cols['削除フラグ'] == null || cols[statusCol] == null || cols[withdrawnDateCol] == null) return;

    var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    var updates = [];
    for (var r = 0; r < rows.length; r += 1) {
      var row = rows[r];
      if (toBoolean_(row[cols['削除フラグ']])) continue;
      if (String(row[cols[statusCol]] || '') !== withdrawnCode) continue;
      if (!shouldAutoDeleteOnNextApril_(row[cols[withdrawnDateCol]], now)) continue;
      row[cols['削除フラグ']] = true;
      if (cols['更新日時'] != null) row[cols['更新日時']] = now.toISOString();
      updates.push({ rowNumber: r + 2, row: row });
    }
    for (var u = 0; u < updates.length; u += 1) {
      sheet.getRange(updates[u].rowNumber, 1, 1, updates[u].row.length).setValues([updates[u].row]);
    }
  }
}

// 退会予定日を過ぎた WITHDRAWAL_SCHEDULED を WITHDRAWN に昇格 + 認証アカウント無効化
function promoteScheduledWithdrawals_(ss, now) {
  var memberSheet = ss.getSheetByName('T_会員');
  if (!memberSheet || memberSheet.getLastRow() < 2) return;

  var headers = memberSheet.getRange(1, 1, 1, memberSheet.getLastColumn()).getValues()[0];
  var cols = {};
  for (var i = 0; i < headers.length; i += 1) cols[headers[i]] = i;
  // 会員ID が無いと、退会にした会員のログインを特定できない（何も書かずに戻る）
  if (cols['会員状態コード'] == null || cols['退会日'] == null || cols['会員ID'] == null) return;

  var todayStr = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy-MM-dd');
  var rows = memberSheet.getRange(2, 1, memberSheet.getLastRow() - 1, memberSheet.getLastColumn()).getValues();
  var memberUpdates = [];
  var withdrawnMemberIds = [];

  for (var r = 0; r < rows.length; r += 1) {
    var row = rows[r];
    if (toBoolean_(row[cols['削除フラグ']])) continue;
    if (String(row[cols['会員状態コード']] || '') !== 'WITHDRAWAL_SCHEDULED') continue;

    var withdrawnDate = normalizeDateInput_(row[cols['退会日']]);
    if (!withdrawnDate || withdrawnDate > todayStr) continue;

    // 退会日を過ぎている → WITHDRAWN に確定
    row[cols['会員状態コード']] = 'WITHDRAWN';
    row[cols['更新日時']] = now.toISOString();
    memberUpdates.push({ rowNumber: r + 2, row: row });
    withdrawnMemberIds.push(String(row[cols['会員ID']] || ''));
  }

  if (memberUpdates.length === 0) return;

  // 2026-10-14（docs/307 S37）: 以前は会員を「退会」に書き換えた後で認証の表を探し、表や列が無ければ
  // 黙って戻っていた。退会が確定したのにログインできる状態が残り、ジョブは成功扱いになる。
  // 認証の表と列を先に確かめ、無ければ何も書かずに止める（runScheduledJob_ が Chat に知らせ、翌日もやり直す）。
  var authSheet = ss.getSheetByName('T_認証アカウント');
  if (!authSheet) {
    throw new Error('T_認証アカウント が見つからないため、退会の確定を止めました（' + memberUpdates.length + ' 名）。ログインを止められないためです。');
  }
  var authCols = {};
  if (authSheet.getLastColumn() > 0) {
    var authHeaders = authSheet.getRange(1, 1, 1, authSheet.getLastColumn()).getValues()[0];
    for (var j = 0; j < authHeaders.length; j += 1) authCols[authHeaders[j]] = j;
  }
  if (authCols['会員ID'] == null || authCols['アカウント有効フラグ'] == null) {
    throw new Error('T_認証アカウント に 会員ID・アカウント有効フラグ の列が無いため、退会の確定を止めました（' + memberUpdates.length + ' 名）。ログインを止められないためです。');
  }

  for (var u = 0; u < memberUpdates.length; u += 1) {
    memberSheet.getRange(memberUpdates[u].rowNumber, 1, 1, memberUpdates[u].row.length).setValues([memberUpdates[u].row]);
  }

  // 対象会員の認証アカウントを無効化（認証の行がまだ 1 件も無いときは、止めるログインも無い）
  if (authSheet.getLastRow() < 2) return;
  var authRows = authSheet.getRange(2, 1, authSheet.getLastRow() - 1, authSheet.getLastColumn()).getValues();
  for (var a = 0; a < authRows.length; a += 1) {
    var authRow = authRows[a];
    var authMemberId = String(authRow[authCols['会員ID']] || '');
    if (withdrawnMemberIds.indexOf(authMemberId) === -1) continue;
    if (!toBoolean_(authRow[authCols['アカウント有効フラグ']])) continue;

    authRow[authCols['アカウント有効フラグ']] = false;
    if (authCols['更新日時'] != null) authRow[authCols['更新日時']] = now.toISOString();
    authSheet.getRange(a + 2, 1, 1, authRow.length).setValues([authRow]);
  }
}

function applyWithdrawalDeletionPolicyIfNeeded_() {
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty(WITHDRAWAL_POLICY_LAST_APPLIED_DATE_KEY) === today) {
    return;
  }

  var lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    if (props.getProperty(WITHDRAWAL_POLICY_LAST_APPLIED_DATE_KEY) === today) {
      return;
    }
    applyWithdrawalDeletionPolicy_();
    props.setProperty(WITHDRAWAL_POLICY_LAST_APPLIED_DATE_KEY, today);
  } finally {
    lock.releaseLock();
  }
}

function syncBusinessStaffRows_(ss, memberId, memberTypeCode, staffPayloadList) {
  var sheet = ss.getSheetByName('T_事業所職員');
  if (!sheet) return;
  var nowIso = new Date().toISOString();

  var activeRows = getRowsAsObjects_(ss, 'T_事業所職員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && String(r['会員ID'] || '') === String(memberId || '');
  });
  var byId = {};
  for (var i = 0; i < activeRows.length; i += 1) {
    byId[String(activeRows[i]['職員ID'] || '')] = activeRows[i];
  }

  if (memberTypeCode !== 'BUSINESS') {
    for (var k = 0; k < activeRows.length; k += 1) {
      var st = activeRows[k];
        upsertStaffRow_(ss, {
          職員ID: String(st['職員ID'] || ''),
          会員ID: String(memberId || ''),
          姓: String(st['姓'] || ''),
          名: String(st['名'] || ''),
          セイ: String(st['セイ'] || ''),
          メイ: String(st['メイ'] || ''),
          氏名: String(st['氏名'] || ''),
          フリガナ: String(st['フリガナ'] || ''),
        メールアドレス: String(st['メールアドレス'] || ''),
        職員権限コード: String(st['職員権限コード'] || 'STAFF'),
        職員状態コード: 'LEFT',
        入会日: String(st['入会日'] || ''),
        退会日: normalizeDateInput_(String(st['退会日'] || '')) || Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd'),
        更新日時: nowIso,
        削除フラグ: true,
      });
    }
    return;
  }

  var seen = {};
  var payloadRows = Array.isArray(staffPayloadList) ? staffPayloadList : [];
  for (var j = 0; j < payloadRows.length; j += 1) {
    var payload = payloadRows[j] || {};
    var staffId = String(payload.id || '').trim();
    if (!staffId) continue;
    seen[staffId] = true;
    var existing = byId[staffId];
    var normalizedStaffNames = normalizeStaffNameFields_({
      姓: payload.lastName != null ? payload.lastName : (existing ? existing['姓'] : ''),
      名: payload.firstName != null ? payload.firstName : (existing ? existing['名'] : ''),
      セイ: payload.lastKana != null ? payload.lastKana : (existing ? existing['セイ'] : ''),
      メイ: payload.firstKana != null ? payload.firstKana : (existing ? existing['メイ'] : ''),
      氏名: payload.name != null ? payload.name : (existing ? existing['氏名'] : ''),
      フリガナ: payload.kana != null ? payload.kana : (existing ? existing['フリガナ'] : ''),
    });
    var name = normalizedStaffNames.name;
    var kana = normalizedStaffNames.kana;
    var status = String(payload.status || 'ENROLLED') === 'LEFT' ? 'LEFT' : 'ENROLLED';
    // v147: 除籍済み職員は氏名・フリガナ必須チェックをスキップ
    if (status !== 'LEFT') {
      if (!name) throw new Error('職員氏名は必須です。');
      if (!kana) throw new Error('職員フリガナは必須です。');
    }
    // v106: 既存レコードから現行ステータスと日付を取得
    var prevStatus = existing ? String(existing['職員状態コード'] || 'ENROLLED') : 'ENROLLED';
    var joined = normalizeDateInput_(payload.joinedDate)
      || (existing ? normalizeDateInput_(existing['入会日']) : '');
    // v106: 退職日はバックエンドで自動記録（フロントエンドからの送信は無視）
    var withdrawn = (existing ? normalizeDateInput_(existing['退会日']) : '') || '';
    if (status === 'LEFT' && prevStatus !== 'LEFT' && !withdrawn) {
      // ENROLLED→LEFT 遷移時に退職日を自動セット
      withdrawn = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
    }

    upsertStaffRow_(ss, {
      職員ID: staffId,
      会員ID: String(memberId || ''),
      姓: normalizedStaffNames.lastName,
      名: normalizedStaffNames.firstName,
      セイ: normalizedStaffNames.lastKana,
      メイ: normalizedStaffNames.firstKana,
      氏名: name,
      フリガナ: kana,
      メールアドレス: String(payload.email || ''),
      職員権限コード: normalizeBusinessStaffRole_(payload.role),
      職員状態コード: status,
      入会日: joined,
      退会日: withdrawn,
      介護支援専門員番号: String(payload.careManagerNumber || '').trim(),
      更新日時: nowIso,
      削除フラグ: false,
    });
  }

  for (var existingId in byId) {
    if (!Object.prototype.hasOwnProperty.call(byId, existingId)) continue;
    if (seen[existingId]) continue;
    var rowObj = byId[existingId];
    upsertStaffRow_(ss, {
      職員ID: existingId,
      会員ID: String(memberId || ''),
      姓: String(rowObj['姓'] || ''),
      名: String(rowObj['名'] || ''),
      セイ: String(rowObj['セイ'] || ''),
      メイ: String(rowObj['メイ'] || ''),
      氏名: String(rowObj['氏名'] || ''),
      フリガナ: String(rowObj['フリガナ'] || ''),
      メールアドレス: String(rowObj['メールアドレス'] || ''),
      職員権限コード: String(rowObj['職員権限コード'] || 'STAFF'),
      職員状態コード: 'LEFT',
      入会日: String(rowObj['入会日'] || ''),
      退会日: normalizeDateInput_(String(rowObj['退会日'] || '')) || Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd'),
      更新日時: nowIso,
      削除フラグ: true,
    });
  }
}

function upsertStaffRow_(ss, rowObject) {
  var sheet = ss.getSheetByName('T_事業所職員');
  if (!sheet) return;
  var normalizedNameFields = normalizeStaffNameFields_(rowObject);
  var found = findRowByColumnValue_(sheet, '職員ID', String(rowObject['職員ID'] || ''));
  if (!found) {
    var now = String(rowObject['更新日時'] || new Date().toISOString());
    appendRowsByHeaders_(ss, 'T_事業所職員', [{
      職員ID: String(rowObject['職員ID'] || ''),
      会員ID: String(rowObject['会員ID'] || ''),
      姓: normalizedNameFields.lastName,
      名: normalizedNameFields.firstName,
      セイ: normalizedNameFields.lastKana,
      メイ: normalizedNameFields.firstKana,
      氏名: normalizedNameFields.name,
      フリガナ: normalizedNameFields.kana,
      メールアドレス: String(rowObject['メールアドレス'] || ''),
      職員権限コード: String(rowObject['職員権限コード'] || 'STAFF'),
      職員状態コード: String(rowObject['職員状態コード'] || 'ENROLLED'),
      // v106: 新規作成時は登録日を自動セット（フロントエンド値より優先）
      入会日: normalizeDateInput_(rowObject['入会日']) || Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd'),
      退会日: normalizeDateInput_(rowObject['退会日']),
      介護支援専門員番号: String(rowObject['介護支援専門員番号'] || ''),
      メール配信希望コード: String(rowObject['メール配信希望コード'] || 'YES'),
      作成日時: now,
      更新日時: now,
      削除フラグ: toBoolean_(rowObject['削除フラグ']),
    }]);
    return;
  }

  var row = found.row.slice();
  var cols = found.columns;
  function setCol(name, value) {
    var idx = cols[name];
    if (idx != null) row[idx] = value !== undefined ? value : '';
  }
  setCol('会員ID', String(rowObject['会員ID'] || ''));
  setCol('姓', normalizedNameFields.lastName);
  setCol('名', normalizedNameFields.firstName);
  setCol('セイ', normalizedNameFields.lastKana);
  setCol('メイ', normalizedNameFields.firstKana);
  setCol('氏名', normalizedNameFields.name);
  setCol('フリガナ', normalizedNameFields.kana);
  setCol('メールアドレス', String(rowObject['メールアドレス'] || ''));
  setCol('職員権限コード', String(rowObject['職員権限コード'] || 'STAFF'));
  setCol('職員状態コード', String(rowObject['職員状態コード'] || 'ENROLLED'));
  setCol('入会日', normalizeDateInput_(rowObject['入会日']));
  setCol('退会日', normalizeDateInput_(rowObject['退会日']));
  setCol('更新日時', String(rowObject['更新日時'] || new Date().toISOString()));
  setCol('削除フラグ', toBoolean_(rowObject['削除フラグ']));
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
}
