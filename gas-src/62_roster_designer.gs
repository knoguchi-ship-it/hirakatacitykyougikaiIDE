// gas-src/62_roster_designer.gs — 名簿出力のテンプレート。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

// ─── v372: 名簿出力 Visual Template Designer 用 API ───────────────────────────

/**
 * フィールド辞書: 列ビルダー UI で表示する全候補フィールドのメタ情報。
 * フロントエンドはこの辞書からチェックボックスを生成し、出力列に追加可能。
 * 新フィールド追加時はこの辞書のみ更新すればフロント改修不要。
 */
function getRosterFieldDictionary_(ss) {
  // 選択肢つき項目の名称は、それぞれのマスタの名称（コード → 名称）
  var labelsOf = function(masterName) {
    var labels = {};
    readMasterOptions_(ss, masterName).forEach(function(o) { labels[o.code] = o.label; });
    return labels;
  };
  // applicableUnits: 'MEMBER' | 'STAFF' のどちらの出力単位で意味があるか
  // - 'MEMBER': 会員行（個人/賛助/事業所会員）で値が入る
  // - 'STAFF':  事業所職員行で値が入る
  // 両方含むものは MIXED モードで安心して使える
  return [
    // === 統合（polymorphic）フィールド: 全エンティティで自動的に値が入る ===
    { key: 'autoName',                label: '氏名（自動）',           group: 'auto', type: 'string', sample: '山田 太郎', applicableUnits: ['MEMBER', 'STAFF'], description: '個人/賛助は姓名、事業所会員は勤務先名、事業所職員は職員姓名' },
    { key: 'autoKana',                label: 'フリガナ（自動）',       group: 'auto', type: 'string', sample: 'ヤマダ タロウ', applicableUnits: ['MEMBER', 'STAFF'], description: '個人/賛助は会員フリガナ、職員は職員フリガナ' },
    { key: 'autoEmail',               label: 'メール（自動）',         group: 'auto', type: 'string', sample: 'taro@example.jp', applicableUnits: ['MEMBER', 'STAFF'], description: '個人/賛助は代表メール、職員は職員メール' },
    { key: 'autoCareManagerNumber',   label: 'CM番号（自動）',         group: 'auto', type: 'string', sample: '27000001', applicableUnits: ['MEMBER', 'STAFF'], description: '個人は会員CM番号、職員は職員CM番号' },
    // === 区分 ===
    { key: 'outputCategory',          label: '区分（会員/職員）',       group: 'auto', type: 'enum', enumLabels: { MEMBER: '会員', STAFF: '事業所職員' }, sample: '会員', applicableUnits: ['MEMBER', 'STAFF'], description: '混合モードで会員行/職員行を識別' },

    // === 会員（個人/賛助/事業所すべての会員行）===
    { key: 'memberId',                label: '会員ID',                  group: 'member', type: 'string', sample: 'M0123456789', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'memberType',              label: '会員種別',                group: 'member', type: 'enum', enumLabels: labelsOf('M_会員種別'), sample: '個人会員', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'memberStatus',            label: '会員状態',                group: 'member', type: 'enum', enumLabels: labelsOf('M_会員状態'), sample: '在籍中', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'joinedDate',              label: '会員入会日',              group: 'member', type: 'date', sample: '2024-04-01', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'withdrawnDate',           label: '会員退会日',              group: 'member', type: 'date', sample: '', applicableUnits: ['MEMBER', 'STAFF'] },

    // === 個人/賛助会員のみ（事業所会員は空・職員行は親会員値が空のため出ない）===
    { key: 'lastName',                label: '姓（個人/賛助）',         group: 'individual', type: 'string', sample: '山田', applicableUnits: ['MEMBER'] },
    { key: 'firstName',               label: '名（個人/賛助）',         group: 'individual', type: 'string', sample: '太郎', applicableUnits: ['MEMBER'] },
    { key: 'fullName',                label: '氏名 姓名（個人/賛助）',  group: 'individual', type: 'string', sample: '山田 太郎', applicableUnits: ['MEMBER'] },
    { key: 'lastKana',                label: 'セイ（個人/賛助）',       group: 'individual', type: 'string', sample: 'ヤマダ', applicableUnits: ['MEMBER'] },
    { key: 'firstKana',               label: 'メイ（個人/賛助）',       group: 'individual', type: 'string', sample: 'タロウ', applicableUnits: ['MEMBER'] },
    { key: 'fullKana',                label: 'フリガナ（個人/賛助）',   group: 'individual', type: 'string', sample: 'ヤマダ タロウ', applicableUnits: ['MEMBER'] },
    { key: 'email',                   label: '代表メールアドレス',      group: 'individual', type: 'string', sample: 'taro@example.jp', applicableUnits: ['MEMBER'] },
    { key: 'mobilePhone',             label: '携帯電話番号',            group: 'individual', type: 'string', sample: '090-1234-5678', applicableUnits: ['MEMBER'] },
    { key: 'careManagerNumber',       label: '介護支援専門員番号（会員）', group: 'individual', type: 'string', sample: '27000001', applicableUnits: ['MEMBER'] },
    { key: 'mailingPreference',       label: '発送方法',                group: 'individual', type: 'enum', enumLabels: labelsOf('M_発送方法'), sample: 'メール', applicableUnits: ['MEMBER'] },
    { key: 'preferredMailDestination', label: '郵送先区分',              group: 'individual', type: 'enum', enumLabels: labelsOf('M_郵送先区分'), sample: '勤務先', applicableUnits: ['MEMBER'] },
    { key: 'homePostCode',            label: '自宅郵便番号',            group: 'individual', type: 'string', sample: '573-0000', applicableUnits: ['MEMBER'] },
    { key: 'homePrefecture',          label: '自宅都道府県',            group: 'individual', type: 'string', sample: '大阪府', applicableUnits: ['MEMBER'] },
    { key: 'homeCity',                label: '自宅市区町村',            group: 'individual', type: 'string', sample: '枚方市', applicableUnits: ['MEMBER'] },
    { key: 'homeAddressLine',         label: '自宅住所',                group: 'individual', type: 'string', sample: '○○町1-1', applicableUnits: ['MEMBER'] },
    { key: 'homeAddressLine2',        label: '自宅住所2',               group: 'individual', type: 'string', sample: '', applicableUnits: ['MEMBER'] },
    { key: 'homeFullAddress',         label: '自宅住所（結合）',        group: 'individual', type: 'string', sample: '大阪府枚方市○○町1-1', applicableUnits: ['MEMBER'] },

    // === 事業所会員（勤務先情報・MEMBER単位・職員行は親会員から継承）===
    { key: 'officeName',              label: '事業所名',                group: 'office', type: 'string', sample: 'ケアプランセンターA', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'officeNumber',            label: '事業所番号',              group: 'office', type: 'string', sample: '2700123456', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'officePostCode',          label: '事業所郵便番号',          group: 'office', type: 'string', sample: '573-0000', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'officePrefecture',        label: '事業所都道府県',          group: 'office', type: 'string', sample: '大阪府', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'officeCity',              label: '事業所市区町村',          group: 'office', type: 'string', sample: '枚方市', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'officeAddressLine',       label: '事業所住所',              group: 'office', type: 'string', sample: '岡東町1-1', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'officeAddressLine2',      label: '事業所住所2',             group: 'office', type: 'string', sample: '○○ビル3F', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'officeFullAddress',       label: '事業所住所（結合）',      group: 'office', type: 'string', sample: '大阪府枚方市岡東町1-1', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'officePhone',             label: '事業所電話番号',          group: 'office', type: 'string', sample: '072-000-0000', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'officeFax',               label: '事業所FAX番号',           group: 'office', type: 'string', sample: '072-000-0001', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'enrolledStaffCount',      label: '在籍職員数（事業所）',    group: 'office', type: 'number', sample: '5', applicableUnits: ['MEMBER', 'STAFF'] },

    // === 事業所職員（STAFF/MIXED モードでのみ意味あり）===
    { key: 'staffId',                 label: '職員ID',                  group: 'staff', type: 'string', sample: 'a1b2c3d4', applicableUnits: ['STAFF'] },
    { key: 'staffLastName',           label: '職員 姓',                 group: 'staff', type: 'string', sample: '佐藤', applicableUnits: ['STAFF'] },
    { key: 'staffFirstName',          label: '職員 名',                 group: 'staff', type: 'string', sample: '次郎', applicableUnits: ['STAFF'] },
    { key: 'staffFullName',           label: '職員氏名 姓名',           group: 'staff', type: 'string', sample: '佐藤 次郎', applicableUnits: ['STAFF'] },
    { key: 'staffLastKana',           label: '職員 セイ',               group: 'staff', type: 'string', sample: 'サトウ', applicableUnits: ['STAFF'] },
    { key: 'staffFirstKana',          label: '職員 メイ',               group: 'staff', type: 'string', sample: 'ジロウ', applicableUnits: ['STAFF'] },
    { key: 'staffFullKana',           label: '職員フリガナ',            group: 'staff', type: 'string', sample: 'サトウ ジロウ', applicableUnits: ['STAFF'] },
    { key: 'staffEmail',              label: '職員メールアドレス',      group: 'staff', type: 'string', sample: 'jiro@example.jp', applicableUnits: ['STAFF'] },
    { key: 'staffCareManagerNumber',  label: '職員CM番号',              group: 'staff', type: 'string', sample: '27000123', applicableUnits: ['STAFF'] },
    { key: 'staffRole',               label: '職員権限',                group: 'staff', type: 'enum', enumLabels: labelsOf('M_職員権限'), sample: '代表者', applicableUnits: ['STAFF'] },
    { key: 'staffStatus',             label: '職員状態',                group: 'staff', type: 'enum', enumLabels: labelsOf('M_職員状態'), sample: '在籍', applicableUnits: ['STAFF'] },
    { key: 'staffJoinedDate',         label: '職員入会日',              group: 'staff', type: 'date', sample: '2024-04-01', applicableUnits: ['STAFF'] },
    { key: 'staffWithdrawnDate',      label: '職員退会日',              group: 'staff', type: 'date', sample: '', applicableUnits: ['STAFF'] },
    { key: 'staffMailingOptOut',      label: '職員メール配信希望',      group: 'staff', type: 'enum', enumLabels: { YES: '配信希望', NO: '配信停止' }, sample: '配信希望', applicableUnits: ['STAFF'] },

    // === 年会費 ===
    { key: 'annualFeeStatus',         label: '年会費状態（選択年度）',  group: 'fee', type: 'enum', enumLabels: labelsOf('M_会費納入状態'), sample: '納入済み', applicableUnits: ['MEMBER', 'STAFF'] },
    { key: 'annualFeeYear',           label: '年会費対象年度',          group: 'fee', type: 'number', sample: '2026', applicableUnits: ['MEMBER', 'STAFF'], valuePicker: 'year' },
  ];
}

/**
 * Visual Template Designer 用に会員データをフラット化して返す。
 * 辞書の全キーを raw 文字列で含む（v373.7 までは旧 getMembersForRoster_ と並存していたが現在は唯一の経路）。
 * フロントエンドは row[fieldKey] でアクセスできる。
 */
function getRosterDesignerData_(payload) {
  var p = payload || {};
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var memberTypes  = p.memberTypes  || getActiveMemberTypeCodes_(ss);
  var memberStatusFilter = String(p.memberStatus || 'ACTIVE');
  var outputUnit = String(p.outputUnit || 'MEMBER').toUpperCase();
  if (['MEMBER', 'STAFF', 'MIXED'].indexOf(outputUnit) < 0) outputUnit = 'MEMBER';

  var now = new Date();
  var currentFY = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  var year = Number(p.year || 0);
  if (!year || !isFinite(year)) year = currentFY;

  var memberSheet = ss.getSheetByName('T_会員');
  var staffSheet  = ss.getSheetByName('T_事業所職員');
  var feeSheet    = ss.getSheetByName('T_年会費納入履歴');

  var members   = getRowsAsObjectsFromSheet_(memberSheet);
  var staffRows = staffSheet ? getRowsAsObjectsFromSheet_(staffSheet) : [];
  var feeRows   = feeSheet   ? getRowsAsObjectsFromSheet_(feeSheet)   : [];

  var feeMap = {};
  var feeMapByYear = {};
  feeRows.forEach(function(r) {
    if (toBoolean_(r['削除フラグ'])) return;
    var yr  = Number(r['対象年度'] || 0);
    var mid = String(r['会員ID'] || '');
    if (!yr || !mid) return;
    var status = String(r['会費納入状態コード'] || 'UNPAID');
    if (!feeMapByYear[yr]) feeMapByYear[yr] = {};
    feeMapByYear[yr][mid] = status;
    if (yr === year) feeMap[mid] = status;
  });
  var allFeeYears = getMailingListYears_(feeRows, year);

  var staffCountMap = {};
  staffRows.forEach(function(s) {
    if (toBoolean_(s['削除フラグ'])) return;
    if (String(s['職員状態コード'] || '') !== 'ENROLLED') return;
    var mid = String(s['会員ID'] || '');
    staffCountMap[mid] = (staffCountMap[mid] || 0) + 1;
  });

  var joinStr_ = function(parts) {
    return parts.filter(function(p){ return p != null && String(p).trim() !== ''; }).map(function(p){ return String(p).trim(); }).join('');
  };

  // 事業所職員行を会員IDごとに事前マップ
  var staffByMemberId = {};
  if (outputUnit === 'STAFF' || outputUnit === 'MIXED') {
    staffRows.forEach(function(s) {
      if (toBoolean_(s['削除フラグ'])) return;
      var mid = String(s['会員ID'] || '');
      if (!mid) return;
      if (!staffByMemberId[mid]) staffByMemberId[mid] = [];
      staffByMemberId[mid].push(s);
    });
  }

  var memberById = {};
  members.forEach(function(m) { memberById[String(m['会員ID'] || '')] = m; });

  // 会員行を作る共通ヘルパー
  var buildMemberRow_ = function(m, fiscalSnapshot, memberId, feeStatus, feeHistories) {
    var mtype = String(m['会員種別コード'] || '');
    var lastName  = String(m['姓'] || '').trim();
    var firstName = String(m['名'] || '').trim();
    var lastKana  = String(m['セイ'] || '').trim();
    var firstKana = String(m['メイ'] || '').trim();
    var officeName = String(m['勤務先名'] || '').trim();
    var displayName = (mtype === 'BUSINESS')
      ? (officeName || memberId)
      : ((lastName + ' ' + firstName).trim() || memberId);
    return {
      memberId: memberId,
      memberType: mtype,
      memberStatus: String(fiscalSnapshot.memberStatus || ''),
      lastName: lastName,
      firstName: firstName,
      lastKana: lastKana,
      firstKana: firstKana,
      email: String(m['代表メールアドレス'] || ''),
      mobilePhone: String(m['携帯電話番号'] || ''),
      careManagerNumber: String(m['介護支援専門員番号'] || ''),
      joinedDate: fiscalSnapshot.joinedDate || '',
      withdrawnDate: fiscalSnapshot.withdrawnDate || '',
      mailingPreference: String(m['発送方法コード'] || ''),
      preferredMailDestination: String(m['郵送先区分コード'] || ''),
      officeName: officeName,
      officeNumber: String(m['事業所番号'] || ''),
      officePostCode: String(m['勤務先郵便番号'] || ''),
      officePrefecture: String(m['勤務先都道府県'] || ''),
      officeCity: String(m['勤務先市区町村'] || ''),
      officeAddressLine: String(m['勤務先住所'] || ''),
      officeAddressLine2: String(m['勤務先住所2'] || ''),
      officePhone: String(m['勤務先電話番号'] || ''),
      officeFax: String(m['勤務先FAX番号'] || ''),
      homePostCode: String(m['自宅郵便番号'] || ''),
      homePrefecture: String(m['自宅都道府県'] || ''),
      homeCity: String(m['自宅市区町村'] || ''),
      homeAddressLine: String(m['自宅住所'] || ''),
      homeAddressLine2: String(m['自宅住所2'] || ''),
      annualFeeStatus: feeStatus,
      annualFeeYear: String(year),
      enrolledStaffCount: mtype === 'BUSINESS' ? String(staffCountMap[memberId] || 0) : '',
      annualFeeHistories: feeHistories,
      fullName: (lastName + ' ' + firstName).trim(),
      fullKana: (lastKana + ' ' + firstKana).trim(),
      displayName: displayName,
      officeFullAddress: joinStr_([m['勤務先都道府県'], m['勤務先市区町村'], m['勤務先住所'], m['勤務先住所2']]),
      homeFullAddress: joinStr_([m['自宅都道府県'], m['自宅市区町村'], m['自宅住所'], m['自宅住所2']]),
      outputCategory: 'MEMBER',
      // === 統合 polymorphic フィールド（会員行）===
      autoName: (mtype === 'BUSINESS') ? officeName : ((lastName + ' ' + firstName).trim()),
      autoKana: (mtype === 'BUSINESS') ? '' : ((lastKana + ' ' + firstKana).trim()),
      autoEmail: (mtype === 'BUSINESS') ? '' : String(m['代表メールアドレス'] || ''),
      autoCareManagerNumber: (mtype === 'BUSINESS') ? '' : String(m['介護支援専門員番号'] || ''),
      // staff 列は空（会員行）
      staffId: '', staffLastName: '', staffFirstName: '', staffFullName: '',
      staffLastKana: '', staffFirstKana: '', staffFullKana: '',
      staffEmail: '', staffCareManagerNumber: '', staffRole: '', staffStatus: '',
      staffJoinedDate: '', staffWithdrawnDate: '', staffMailingOptOut: '',
    };
  };

  // 職員行を作る共通ヘルパー（親会員データを継承）
  var buildStaffRow_ = function(m, s, fiscalSnapshot, memberId, feeStatus, feeHistories) {
    var base = buildMemberRow_(m, fiscalSnapshot, memberId, feeStatus, feeHistories);
    var sLastName  = String(s['姓'] || '').trim();
    var sFirstName = String(s['名'] || '').trim();
    var sLastKana  = String(s['セイ'] || '').trim();
    var sFirstKana = String(s['メイ'] || '').trim();
    base.outputCategory = 'STAFF';
    base.staffId = String(s['職員ID'] || '');
    base.staffLastName = sLastName;
    base.staffFirstName = sFirstName;
    base.staffFullName = (sLastName + ' ' + sFirstName).trim();
    base.staffLastKana = sLastKana;
    base.staffFirstKana = sFirstKana;
    base.staffFullKana = (sLastKana + ' ' + sFirstKana).trim();
    base.staffEmail = String(s['メールアドレス'] || '');
    base.staffCareManagerNumber = String(s['介護支援専門員番号'] || '');
    base.staffRole = String(s['職員権限コード'] || '');
    base.staffStatus = String(s['職員状態コード'] || '');
    base.staffJoinedDate = String(s['入会日'] || '');
    base.staffWithdrawnDate = String(s['退会日'] || '');
    base.staffMailingOptOut = String(s['メール配信希望コード'] || '');
    base.displayName = base.staffFullName || base.staffId;
    // === 統合 polymorphic フィールド（職員行は職員値で上書き）===
    base.autoName = base.staffFullName || base.staffId;
    base.autoKana = base.staffFullKana;
    base.autoEmail = base.staffEmail;
    base.autoCareManagerNumber = base.staffCareManagerNumber;
    return base;
  };

  var rows = [];
  members.forEach(function(m) {
    if (toBoolean_(m['削除フラグ'])) return;
    var mtype = String(m['会員種別コード'] || '');
    if (memberTypes.indexOf(mtype) < 0) return;

    var fiscalSnapshot = getMemberFiscalSnapshot_(m, year);
    if (!fiscalSnapshot.eligible) return;
    var status = fiscalSnapshot.memberStatus;
    if (memberStatusFilter === 'ACTIVE' && status !== 'ACTIVE') return;
    if (memberStatusFilter === 'INCLUDING_SCHEDULED' &&
        status !== 'ACTIVE' && status !== 'WITHDRAWAL_SCHEDULED') return;

    var memberId  = String(m['会員ID'] || '');
    var feeStatus = feeMap[memberId] || 'UNPAID';
    var feeHistories = {};
    allFeeYears.forEach(function(yr) {
      feeHistories[yr] = (feeMapByYear[yr] && feeMapByYear[yr][memberId]) || 'UNPAID';
    });

    if (outputUnit === 'MEMBER') {
      rows.push(buildMemberRow_(m, fiscalSnapshot, memberId, feeStatus, feeHistories));
    } else if (outputUnit === 'STAFF') {
      // 事業所会員のみ職員行を展開
      if (mtype !== 'BUSINESS') return;
      var arr = staffByMemberId[memberId] || [];
      arr.forEach(function(s) {
        if (String(s['職員状態コード'] || '') !== 'ENROLLED') return;
        rows.push(buildStaffRow_(m, s, fiscalSnapshot, memberId, feeStatus, feeHistories));
      });
    } else {
      // MIXED: 個人/賛助は会員行、事業所は職員行（事業所自身も 1 行追加して代表者欄を可視化したい場合は別途検討）
      if (mtype === 'BUSINESS') {
        var sArr = staffByMemberId[memberId] || [];
        sArr.forEach(function(s) {
          if (String(s['職員状態コード'] || '') !== 'ENROLLED') return;
          rows.push(buildStaffRow_(m, s, fiscalSnapshot, memberId, feeStatus, feeHistories));
        });
      } else {
        rows.push(buildMemberRow_(m, fiscalSnapshot, memberId, feeStatus, feeHistories));
      }
    }
  });

  return { rows: rows, years: allFeeYears, year: year, outputUnit: outputUnit };
}

/**
 * ROSTER_TEMPLATE_LIBRARY_V2 の読み込み（T_システム設定 から JSON 取得）。
 */
function loadRosterTemplatesV2_() {
  var ss = getOrCreateDatabase_();
  var raw = String(getSystemSettingValue_(ss, 'ROSTER_TEMPLATE_LIBRARY_V2') || '[]');
  var list = [];
  try { list = JSON.parse(raw); } catch (e) { list = []; }
  if (!Array.isArray(list)) list = [];
  return { templates: list };
}

function saveRosterTemplateV2_(payload) {
  var p = payload || {};
  var template = p.template;
  if (!template || typeof template !== 'object') throw new Error('テンプレートが指定されていません。');
  if (!template.id || typeof template.id !== 'string') throw new Error('テンプレートIDが必要です。');
  if (!template.name || typeof template.name !== 'string') throw new Error('テンプレート名が必要です。');
  if (!Array.isArray(template.columns)) throw new Error('columns 配列が必要です。');

  var ss = getOrCreateDatabase_();
  var current = loadRosterTemplatesV2_().templates;
  var now = new Date().toISOString();
  var found = false;
  current = current.map(function(t) {
    if (t.id === template.id) {
      found = true;
      return Object.assign({}, t, template, { updatedAt: now });
    }
    return t;
  });
  if (!found) {
    template.createdAt = template.createdAt || now;
    template.updatedAt = now;
    current.push(template);
  }
  // isDefault 排他処理
  if (template.isDefault) {
    current = current.map(function(t) {
      return Object.assign({}, t, { isDefault: t.id === template.id });
    });
  }
  batchUpsertSystemSettings_(ss, [{
    key: 'ROSTER_TEMPLATE_LIBRARY_V2',
    value: JSON.stringify(current),
    description: '名簿テンプレートライブラリ V2（Visual Designer 用）',
  }]);
  return { ok: true, templates: current };
}

function deleteRosterTemplateV2_(payload) {
  var id = String((payload || {}).id || '').trim();
  if (!id) throw new Error('テンプレートIDが必要です。');
  var ss = getOrCreateDatabase_();
  var current = loadRosterTemplatesV2_().templates.filter(function(t){ return t.id !== id; });
  batchUpsertSystemSettings_(ss, [{
    key: 'ROSTER_TEMPLATE_LIBRARY_V2',
    value: JSON.stringify(current),
    description: '名簿テンプレートライブラリ V2（Visual Designer 用）',
  }]);
  return { ok: true, templates: current };
}

function duplicateRosterTemplateV2_(payload) {
  var id = String((payload || {}).id || '').trim();
  if (!id) throw new Error('テンプレートIDが必要です。');
  var current = loadRosterTemplatesV2_().templates;
  var src = current.filter(function(t){ return t.id === id; })[0];
  if (!src) throw new Error('テンプレートが見つかりません。');
  var copy = JSON.parse(JSON.stringify(src));
  copy.id = Utilities.getUuid();
  copy.name = (src.name || '名前なし') + ' (コピー)';
  copy.isDefault = false;
  copy.createdAt = new Date().toISOString();
  copy.updatedAt = copy.createdAt;
  return saveRosterTemplateV2_({ template: copy });
}
