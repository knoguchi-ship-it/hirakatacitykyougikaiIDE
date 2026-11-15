// gas-src/04_core_settings.gs — システム設定・マスタの選択肢・設定のキャッシュ。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

// ─────────────────────────────────────────────────────────────────────────────

// 公開ポータルの退会確認欄は、手続きに必要な5項目を固定し、表示と文言のみを設定化する。
// 任意行の追加・削除は審査上の説明責任に影響するため、別途仕様化するまで受け付けない。
var WITHDRAWAL_CONFIRMATION_ITEM_IDS_ = ['method', 'effectiveDate', 'memberPortal', 'cancellation', 'approval'];

function normalizeWithdrawalConfirmationItems_(items) {
  if (!Array.isArray(items)) throw new Error('退会確認項目の形式が不正です。');
  var byId = {};
  items.forEach(function(item) {
    if (!item || typeof item !== 'object') throw new Error('退会確認項目の形式が不正です。');
    var id = String(item.id || '');
    if (WITHDRAWAL_CONFIRMATION_ITEM_IDS_.indexOf(id) === -1 || byId[id]) {
      throw new Error('退会確認項目の識別子が不正です。');
    }
    var label = String(item.label == null ? '' : item.label).trim();
    var fiscalYearEndText = String(item.fiscalYearEndText == null ? '' : item.fiscalYearEndText).trim();
    var immediateText = String(item.immediateText == null ? '' : item.immediateText).trim();
    if (typeof item.enabled !== 'boolean' || !label || !fiscalYearEndText || !immediateText ||
        label.length > 80 || fiscalYearEndText.length > 300 || immediateText.length > 300) {
      throw new Error('退会確認項目の入力内容が不正です。');
    }
    byId[id] = {
      id: id,
      enabled: item.enabled,
      label: label,
      fiscalYearEndText: fiscalYearEndText,
      immediateText: immediateText,
    };
  });
  return WITHDRAWAL_CONFIRMATION_ITEM_IDS_.map(function(id) {
    if (!byId[id]) throw new Error('退会確認項目が不足しています。');
    return byId[id];
  });
}

function parseWithdrawalConfirmationItems_(raw) {
  if (raw == null || String(raw).trim() === '') return null;
  try {
    return normalizeWithdrawalConfirmationItems_(JSON.parse(String(raw)));
  } catch (e) {
    return null;
  }
}

function getSystemSettings_() {
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  apiProfileMark_('settings.schemaCheck');
  // 全設定を1回の読み込みで取得（N+1問題を解消）
  var m = getSystemSettingMap_(ss);
  apiProfileMark_('settings.map');
  var mailDeliveryState = getMailDeliveryState_(m);
  var raw = Number(m['DEFAULT_BUSINESS_STAFF_LIMIT'] || 10);
  var lookbackRaw = Number(m['TRAINING_HISTORY_LOOKBACK_MONTHS'] || 18);
  var guidanceRaw = m['ANNUAL_FEE_PAYMENT_GUIDANCE'];
  // 振込先設定をマップから直接パース
  var transferAccount = DEMO_TRANSFER_ACCOUNT;
  var transferRaw = m['ANNUAL_FEE_TRANSFER_ACCOUNT'];
  if (transferRaw) {
    try {
      var tParsed = JSON.parse(String(transferRaw));
      if (tParsed && tParsed.bankName && tParsed.accountNumber && tParsed.accountName) {
        transferAccount = {
          bankName: String(tParsed.bankName || ''),
          branchName: String(tParsed.branchName || ''),
          accountType: String(tParsed.accountType || '普通') === '当座' ? '当座' : '普通',
          accountNumber: String(tParsed.accountNumber || ''),
          accountName: String(tParsed.accountName || ''),
          note: String(tParsed.note || ''),
        };
      }
    } catch (e) {}
  }
  var value = Math.floor(raw);
  var lookback = Math.floor(lookbackRaw);
  var guidance = guidanceRaw == null
    ? '年会費が未納の場合は、下記の振込先をご確認のうえお手続きください。\n振込名義は会員番号と氏名を記載してください。'
    : String(guidanceRaw);
  if (!isFinite(value) || value < 1) value = 10;
  if (!isFinite(lookback) || lookback < 1) lookback = 18;
  var trainingDefaultFieldConfig = null;
  var trainingDefaultFieldConfigRaw = m['TRAINING_DEFAULT_FIELD_CONFIG'];
  if (trainingDefaultFieldConfigRaw) {
    try { trainingDefaultFieldConfig = JSON.parse(trainingDefaultFieldConfigRaw); } catch (e) {}
  }
  // v194: PDF名簿出力 & 一括メール設定
  // v373.7 (S5 Phase 2): ROSTER_TEMPLATE_SS_ID / REMINDER_TEMPLATE_SS_ID は撤去（旧 RosterExport 関連）
  // データ自体は T_システム設定 に残置（rollback 容易・データ保全）
  var bulkMailAutoAttachFolderId = String(m['BULK_MAIL_AUTO_ATTACH_FOLDER_ID'] || '');
  var emailLogViewerRole = String(m['EMAIL_LOG_VIEWER_ROLE'] || 'MASTER');
  // v209: 入会時認証情報メール設定
  var ownerEmail = Session.getEffectiveUser().getEmail();
  apiProfileMark_('settings.effectiveUser');
  var credentialEmailEnabledRaw = m['CREDENTIAL_EMAIL_ENABLED'];
  var credentialEmailEnabled = credentialEmailEnabledRaw === '' || credentialEmailEnabledRaw === null
    ? true
    : String(credentialEmailEnabledRaw) !== 'false';
  var credentialEmailFrom = String(m['CREDENTIAL_EMAIL_FROM'] || '').trim() || ownerEmail;
  var credentialEmailSubject = String(m['CREDENTIAL_EMAIL_SUBJECT'] || '');
  var credentialEmailBody = String(m['CREDENTIAL_EMAIL_BODY'] || '');
  // v210: 公開ポータル メニュー表示設定
  var trainingMenuEnabledRaw = m['PUBLIC_PORTAL_TRAINING_MENU_ENABLED'];
  var publicPortalTrainingMenuEnabled = !trainingMenuEnabledRaw
    ? true
    : String(trainingMenuEnabledRaw) !== 'false';
  var membershipMenuEnabledRaw = m['PUBLIC_PORTAL_MEMBERSHIP_MENU_ENABLED'];
  var publicPortalMembershipMenuEnabled = !membershipMenuEnabledRaw
    ? true
    : String(membershipMenuEnabledRaw) !== 'false';
  var heroBadgeEnabledRaw = m['PUBLIC_PORTAL_HERO_BADGE_ENABLED'];
  var publicPortalHeroBadgeEnabled = heroBadgeEnabledRaw === undefined || heroBadgeEnabledRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.heroBadgeEnabled
    : String(heroBadgeEnabledRaw) !== 'false';
  var publicPortalHeroBadgeLabel = String(m['PUBLIC_PORTAL_HERO_BADGE_LABEL'] || '');
  var publicPortalPrivacyPolicyUrl = String(m['PUBLIC_PORTAL_PRIVACY_POLICY_URL'] || '');
  var publicPortalHeroTitle = String(m['PUBLIC_PORTAL_HERO_TITLE'] || '');
  var heroDescriptionEnabledRaw = m['PUBLIC_PORTAL_HERO_DESCRIPTION_ENABLED'];
  var publicPortalHeroDescriptionEnabled = heroDescriptionEnabledRaw === undefined || heroDescriptionEnabledRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.heroDescriptionEnabled
    : String(heroDescriptionEnabledRaw) !== 'false';
  var publicPortalHeroDescription = String(m['PUBLIC_PORTAL_HERO_DESCRIPTION'] || '');
  var membershipBadgeEnabledRaw = m['PUBLIC_PORTAL_MEMBERSHIP_BADGE_ENABLED'];
  var publicPortalMembershipBadgeEnabled = membershipBadgeEnabledRaw === undefined || membershipBadgeEnabledRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.membershipBadgeEnabled
    : String(membershipBadgeEnabledRaw) !== 'false';
  var publicPortalMembershipBadgeLabel = String(m['PUBLIC_PORTAL_MEMBERSHIP_BADGE_LABEL'] || '');
  var membershipTitleEnabledRaw = m['PUBLIC_PORTAL_MEMBERSHIP_TITLE_ENABLED'];
  var publicPortalMembershipTitleEnabled = membershipTitleEnabledRaw === undefined || membershipTitleEnabledRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.membershipTitleEnabled
    : String(membershipTitleEnabledRaw) !== 'false';
  var publicPortalMembershipTitle = String(m['PUBLIC_PORTAL_MEMBERSHIP_TITLE'] || '');
  var membershipDescriptionEnabledRaw = m['PUBLIC_PORTAL_MEMBERSHIP_DESCRIPTION_ENABLED'];
  var publicPortalMembershipDescriptionEnabled = membershipDescriptionEnabledRaw === undefined || membershipDescriptionEnabledRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.membershipDescriptionEnabled
    : String(membershipDescriptionEnabledRaw) !== 'false';
  var publicPortalMembershipDescription = String(m['PUBLIC_PORTAL_MEMBERSHIP_DESCRIPTION'] || '');
  var publicPortalMembershipCtaLabel = String(m['PUBLIC_PORTAL_MEMBERSHIP_CTA_LABEL'] || '');
  var completionGuidanceVisibleRaw = m['PUBLIC_PORTAL_COMPLETION_GUIDANCE_VISIBLE'];
  var publicPortalCompletionGuidanceVisible = completionGuidanceVisibleRaw === undefined || completionGuidanceVisibleRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.completionGuidanceVisible
    : String(completionGuidanceVisibleRaw) !== 'false';
  var completionLoginInfoVisibleRaw = m['PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_VISIBLE'];
  var publicPortalCompletionLoginInfoVisible = completionLoginInfoVisibleRaw === undefined || completionLoginInfoVisibleRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.completionLoginInfoVisible
    : String(completionLoginInfoVisibleRaw) !== 'false';
  var completionLoginInfoBlockVisibleRaw = m['PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BLOCK_VISIBLE'];
  var publicPortalCompletionLoginInfoBlockVisible = completionLoginInfoBlockVisibleRaw === undefined || completionLoginInfoBlockVisibleRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBlockVisible
    : String(completionLoginInfoBlockVisibleRaw) !== 'false';
  // 2026-10-25 docs/313: 案内文は選んだ定型文（T_画面文テンプレート）の本文。見つからなければ空（補わない）
  var screenText = resolveScreenTextTemplates_(ss, m);
  apiProfileMark_('settings.screenText');
  var publicPortalCompletionGuidanceBodyWhenCredentialSent = screenText.bodies.COMPLETION_GUIDANCE_SENT;
  var publicPortalCompletionGuidanceBodyWhenCredentialNotSent = screenText.bodies.COMPLETION_GUIDANCE_NOT_SENT;
  var publicPortalCompletionLoginInfoBodyWhenCredentialSent = screenText.bodies.COMPLETION_LOGIN_INFO_SENT;
  var publicPortalCompletionLoginInfoBodyWhenCredentialNotSent = screenText.bodies.COMPLETION_LOGIN_INFO_NOT_SENT;
  var trainingBadgeEnabledRaw = m['PUBLIC_PORTAL_TRAINING_BADGE_ENABLED'];
  var publicPortalTrainingBadgeEnabled = trainingBadgeEnabledRaw === undefined || trainingBadgeEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.trainingBadgeEnabled : String(trainingBadgeEnabledRaw) !== 'false';
  var publicPortalTrainingBadgeLabel = String(m['PUBLIC_PORTAL_TRAINING_BADGE_LABEL'] || '');
  var trainingTitleEnabledRaw = m['PUBLIC_PORTAL_TRAINING_TITLE_ENABLED'];
  var publicPortalTrainingTitleEnabled = trainingTitleEnabledRaw === undefined || trainingTitleEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.trainingTitleEnabled : String(trainingTitleEnabledRaw) !== 'false';
  var publicPortalTrainingTitle = String(m['PUBLIC_PORTAL_TRAINING_TITLE'] || '');
  var trainingDescriptionEnabledRaw = m['PUBLIC_PORTAL_TRAINING_DESCRIPTION_ENABLED'];
  var publicPortalTrainingDescriptionEnabled = trainingDescriptionEnabledRaw === undefined || trainingDescriptionEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.trainingDescriptionEnabled : String(trainingDescriptionEnabledRaw) !== 'false';
  var publicPortalTrainingDescription = String(m['PUBLIC_PORTAL_TRAINING_DESCRIPTION'] || '');
  var publicPortalTrainingCtaLabel = String(m['PUBLIC_PORTAL_TRAINING_CTA_LABEL'] || '');
  var memberUpdateMenuEnabledRaw = m['PUBLIC_PORTAL_MEMBER_UPDATE_MENU_ENABLED'];
  var publicPortalMemberUpdateMenuEnabled = memberUpdateMenuEnabledRaw === undefined || memberUpdateMenuEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.memberUpdateMenuEnabled : String(memberUpdateMenuEnabledRaw) !== 'false';
  var memberUpdateBadgeEnabledRaw = m['PUBLIC_PORTAL_MEMBER_UPDATE_BADGE_ENABLED'];
  var publicPortalMemberUpdateBadgeEnabled = memberUpdateBadgeEnabledRaw === undefined || memberUpdateBadgeEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.memberUpdateBadgeEnabled : String(memberUpdateBadgeEnabledRaw) !== 'false';
  var publicPortalMemberUpdateBadgeLabel = String(m['PUBLIC_PORTAL_MEMBER_UPDATE_BADGE_LABEL'] || '');
  var memberUpdateTitleEnabledRaw = m['PUBLIC_PORTAL_MEMBER_UPDATE_TITLE_ENABLED'];
  var publicPortalMemberUpdateTitleEnabled = memberUpdateTitleEnabledRaw === undefined || memberUpdateTitleEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.memberUpdateTitleEnabled : String(memberUpdateTitleEnabledRaw) !== 'false';
  var publicPortalMemberUpdateTitle = String(m['PUBLIC_PORTAL_MEMBER_UPDATE_TITLE'] || '');
  var memberUpdateDescriptionEnabledRaw = m['PUBLIC_PORTAL_MEMBER_UPDATE_DESCRIPTION_ENABLED'];
  var publicPortalMemberUpdateDescriptionEnabled = memberUpdateDescriptionEnabledRaw === undefined || memberUpdateDescriptionEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.memberUpdateDescriptionEnabled : String(memberUpdateDescriptionEnabledRaw) !== 'false';
  var publicPortalMemberUpdateDescription = String(m['PUBLIC_PORTAL_MEMBER_UPDATE_DESCRIPTION'] || '');
  var publicPortalMemberUpdateCtaLabel = String(m['PUBLIC_PORTAL_MEMBER_UPDATE_CTA_LABEL'] || '');
  var withdrawalMenuEnabledRaw = m['PUBLIC_PORTAL_WITHDRAWAL_MENU_ENABLED'];
  var publicPortalWithdrawalMenuEnabled = withdrawalMenuEnabledRaw === undefined || withdrawalMenuEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.withdrawalMenuEnabled : String(withdrawalMenuEnabledRaw) !== 'false';
  var withdrawalBadgeEnabledRaw = m['PUBLIC_PORTAL_WITHDRAWAL_BADGE_ENABLED'];
  var publicPortalWithdrawalBadgeEnabled = withdrawalBadgeEnabledRaw === undefined || withdrawalBadgeEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.withdrawalBadgeEnabled : String(withdrawalBadgeEnabledRaw) !== 'false';
  var publicPortalWithdrawalBadgeLabel = String(m['PUBLIC_PORTAL_WITHDRAWAL_BADGE_LABEL'] || '');
  var withdrawalTitleEnabledRaw = m['PUBLIC_PORTAL_WITHDRAWAL_TITLE_ENABLED'];
  var publicPortalWithdrawalTitleEnabled = withdrawalTitleEnabledRaw === undefined || withdrawalTitleEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.withdrawalTitleEnabled : String(withdrawalTitleEnabledRaw) !== 'false';
  var publicPortalWithdrawalTitle = String(m['PUBLIC_PORTAL_WITHDRAWAL_TITLE'] || '');
  var withdrawalDescriptionEnabledRaw = m['PUBLIC_PORTAL_WITHDRAWAL_DESCRIPTION_ENABLED'];
  var publicPortalWithdrawalDescriptionEnabled = withdrawalDescriptionEnabledRaw === undefined || withdrawalDescriptionEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.withdrawalDescriptionEnabled : String(withdrawalDescriptionEnabledRaw) !== 'false';
  var publicPortalWithdrawalDescription = String(m['PUBLIC_PORTAL_WITHDRAWAL_DESCRIPTION'] || '');
  var publicPortalWithdrawalCtaLabel = String(m['PUBLIC_PORTAL_WITHDRAWAL_CTA_LABEL'] || '');
  var withdrawalConfirmationItems = parseWithdrawalConfirmationItems_(m['PUBLIC_PORTAL_WITHDRAWAL_CONFIRMATION_ITEMS']);
  // v376.64: 会費設定（金額の正本は M_会員種別.年会費金額）
  var memberTypeMaster = readMemberTypeMaster_(ss);
  apiProfileMark_('settings.memberTypes');
  var memberTypeAnnualFees = annualFeesByMemberType_(memberTypeMaster);
  var membershipFeePublicVisibleRaw = m['MEMBERSHIP_FEE_PUBLIC_VISIBLE'];
  var membershipFeePublicVisible = membershipFeePublicVisibleRaw === undefined || membershipFeePublicVisibleRaw === ''
    ? MEMBERSHIP_FEE_DEFAULTS.publicVisible
    : String(membershipFeePublicVisibleRaw) !== 'false';
  var membershipFeeNote = m['MEMBERSHIP_FEE_NOTE'] == null ? MEMBERSHIP_FEE_DEFAULTS.note : String(m['MEMBERSHIP_FEE_NOTE']);
  return {
    defaultBusinessStaffLimit: value,
    trainingHistoryLookbackMonths: lookback,
    annualFeePaymentGuidance: guidance,
    annualFeeTransferAccount: transferAccount,
    memberTypeAnnualFees: memberTypeAnnualFees,
    memberTypes: memberTypeMaster,
    // マスタ定義 の全表の選択肢（画面の選択肢・名称の正本）。マスタを足せば自動で乗る
    masters: masterOptionsForClient_(ss, 'ADMIN'),
    membershipFeePublicVisible: membershipFeePublicVisible,
    membershipFeeNote: membershipFeeNote,
    trainingDefaultFieldConfig: trainingDefaultFieldConfig,
    // v373.7 (S5 Phase 2): rosterTemplateSsId / reminderTemplateSsId / rosterTemplates 撤去
    bulkMailAutoAttachFolderId: bulkMailAutoAttachFolderId,
    emailLogViewerRole: emailLogViewerRole,
    credentialEmailEnabled: credentialEmailEnabled,
    credentialEmailFrom: credentialEmailFrom,
    credentialEmailSubject: credentialEmailSubject,
    credentialEmailBody: credentialEmailBody,
    publicPortalTrainingMenuEnabled: publicPortalTrainingMenuEnabled,
    publicPortalMembershipMenuEnabled: publicPortalMembershipMenuEnabled,
    publicPortalPrivacyPolicyUrl: publicPortalPrivacyPolicyUrl,
    publicPortalHeroBadgeEnabled: publicPortalHeroBadgeEnabled,
    publicPortalHeroBadgeLabel: publicPortalHeroBadgeLabel,
    publicPortalHeroTitle: publicPortalHeroTitle,
    publicPortalHeroDescriptionEnabled: publicPortalHeroDescriptionEnabled,
    publicPortalHeroDescription: publicPortalHeroDescription,
    publicPortalMembershipBadgeEnabled: publicPortalMembershipBadgeEnabled,
    publicPortalMembershipBadgeLabel: publicPortalMembershipBadgeLabel,
    publicPortalMembershipTitleEnabled: publicPortalMembershipTitleEnabled,
    publicPortalMembershipTitle: publicPortalMembershipTitle,
    publicPortalMembershipDescriptionEnabled: publicPortalMembershipDescriptionEnabled,
    publicPortalMembershipDescription: publicPortalMembershipDescription,
    publicPortalMembershipCtaLabel: publicPortalMembershipCtaLabel,
    publicPortalCompletionGuidanceVisible: publicPortalCompletionGuidanceVisible,
    publicPortalCompletionGuidanceBodyWhenCredentialSent: publicPortalCompletionGuidanceBodyWhenCredentialSent,
    publicPortalCompletionGuidanceBodyWhenCredentialNotSent: publicPortalCompletionGuidanceBodyWhenCredentialNotSent,
    publicPortalCompletionLoginInfoBlockVisible: publicPortalCompletionLoginInfoBlockVisible,
    publicPortalCompletionLoginInfoVisible: publicPortalCompletionLoginInfoVisible,
    publicPortalCompletionLoginInfoBodyWhenCredentialSent: publicPortalCompletionLoginInfoBodyWhenCredentialSent,
    publicPortalCompletionLoginInfoBodyWhenCredentialNotSent: publicPortalCompletionLoginInfoBodyWhenCredentialNotSent,
    publicPortalCompletionGuidanceTemplateIdWhenCredentialSent: screenText.ids.COMPLETION_GUIDANCE_SENT,
    publicPortalCompletionGuidanceTemplateIdWhenCredentialNotSent: screenText.ids.COMPLETION_GUIDANCE_NOT_SENT,
    publicPortalCompletionLoginInfoTemplateIdWhenCredentialSent: screenText.ids.COMPLETION_LOGIN_INFO_SENT,
    publicPortalCompletionLoginInfoTemplateIdWhenCredentialNotSent: screenText.ids.COMPLETION_LOGIN_INFO_NOT_SENT,
    screenTextTemplates: screenText.templates,
    screenTextTemplateWarnings: screenText.warnings,
    publicPortalCredentialEmailEnabled: credentialEmailEnabled,
    publicPortalTrainingBadgeEnabled: publicPortalTrainingBadgeEnabled,
    publicPortalTrainingBadgeLabel: publicPortalTrainingBadgeLabel,
    publicPortalTrainingTitleEnabled: publicPortalTrainingTitleEnabled,
    publicPortalTrainingTitle: publicPortalTrainingTitle,
    publicPortalTrainingDescriptionEnabled: publicPortalTrainingDescriptionEnabled,
    publicPortalTrainingDescription: publicPortalTrainingDescription,
    publicPortalTrainingCtaLabel: publicPortalTrainingCtaLabel,
    publicPortalMemberUpdateMenuEnabled: publicPortalMemberUpdateMenuEnabled,
    publicPortalMemberUpdateBadgeEnabled: publicPortalMemberUpdateBadgeEnabled,
    publicPortalMemberUpdateBadgeLabel: publicPortalMemberUpdateBadgeLabel,
    publicPortalMemberUpdateTitleEnabled: publicPortalMemberUpdateTitleEnabled,
    publicPortalMemberUpdateTitle: publicPortalMemberUpdateTitle,
    publicPortalMemberUpdateDescriptionEnabled: publicPortalMemberUpdateDescriptionEnabled,
    publicPortalMemberUpdateDescription: publicPortalMemberUpdateDescription,
    publicPortalMemberUpdateCtaLabel: publicPortalMemberUpdateCtaLabel,
    publicPortalWithdrawalMenuEnabled: publicPortalWithdrawalMenuEnabled,
    publicPortalWithdrawalBadgeEnabled: publicPortalWithdrawalBadgeEnabled,
    publicPortalWithdrawalBadgeLabel: publicPortalWithdrawalBadgeLabel,
    publicPortalWithdrawalTitleEnabled: publicPortalWithdrawalTitleEnabled,
    publicPortalWithdrawalTitle: publicPortalWithdrawalTitle,
    publicPortalWithdrawalDescriptionEnabled: publicPortalWithdrawalDescriptionEnabled,
    publicPortalWithdrawalDescription: publicPortalWithdrawalDescription,
    publicPortalWithdrawalCtaLabel: publicPortalWithdrawalCtaLabel,
    withdrawalConfirmationItems: withdrawalConfirmationItems,
    trainingFileFolderId: String(m['TRAINING_FILE_FOLDER_ID'] || '').trim(),
    claimAttachmentFolderId: String(m['CLAIM_ATTACHMENT_FOLDER_ID'] || '').trim(),
    // v265: 個人・賛助会員 入会時メール ON/OFF
    indSuppEmailEnabled: (function(){ var v = m['IND_SUPP_EMAIL_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    // v265: 事業所入会・職員追加メール設定
    bizRepEmailEnabled:        String(m['BIZ_REP_EMAIL_ENABLED'] || '') !== 'false',
    bizRepEmailSubject:        String(m['BIZ_REP_EMAIL_SUBJECT'] || ''),
    bizRepEmailBody:           String(m['BIZ_REP_EMAIL_BODY'] || ''),
    bizStaffEmailEnabled:      (function(){ var v = m['BIZ_STAFF_EMAIL_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    bizStaffEmailSubject:      String(m['BIZ_STAFF_EMAIL_SUBJECT'] || ''),
    bizStaffEmailBody:         String(m['BIZ_STAFF_EMAIL_BODY'] || ''),
    staffAddStaffEmailEnabled: (function(){ var v = m['STAFF_ADD_STAFF_EMAIL_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    staffAddStaffEmailSubject: String(m['STAFF_ADD_STAFF_EMAIL_SUBJECT'] || ''),
    staffAddStaffEmailBody:    String(m['STAFF_ADD_STAFF_EMAIL_BODY'] || ''),
    staffAddRepEmailEnabled:   (function(){ var v = m['STAFF_ADD_REP_EMAIL_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    staffAddRepEmailSubject:   String(m['STAFF_ADD_REP_EMAIL_SUBJECT'] || ''),
    staffAddRepEmailBody:      String(m['STAFF_ADD_REP_EMAIL_BODY'] || ''),
    // v368: 変更申請ワークフローメール
    applicationReceiptEnabled:    (function(){ var v = m['APPLICATION_RECEIPT_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    applicationReceiptSubject:    String(m['APPLICATION_RECEIPT_SUBJECT'] || ''),
    applicationReceiptBody:       String(m['APPLICATION_RECEIPT_BODY'] || ''),
    approvalNotificationEnabled:  (function(){ var v = m['APPROVAL_NOTIFICATION_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    approvalNotificationSubject:  String(m['APPROVAL_NOTIFICATION_SUBJECT'] || ''),
    approvalNotificationBody:     String(m['APPROVAL_NOTIFICATION_BODY'] || ''),
    rejectionNotificationEnabled: (function(){ var v = m['REJECTION_NOTIFICATION_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    rejectionNotificationSubject: String(m['REJECTION_NOTIFICATION_SUBJECT'] || ''),
    rejectionNotificationBody:    String(m['REJECTION_NOTIFICATION_BODY'] || ''),
    // v376.43 (Phase B): 従来ハードコード6メールの件名/本文
    trainingApplyReceiptSubject:  String(m['TRAINING_APPLY_RECEIPT_SUBJECT'] || ''),
    trainingApplyReceiptBody:     String(m['TRAINING_APPLY_RECEIPT_BODY'] || ''),
    trainingReminderSubject:      String(m['TRAINING_REMINDER_SUBJECT'] || ''),
    trainingReminderBody:         String(m['TRAINING_REMINDER_BODY'] || ''),
    authOtpSubject:               String(m['AUTH_OTP_SUBJECT'] || ''),
    authOtpBody:                  String(m['AUTH_OTP_BODY'] || ''),
    loginIdChangedSubject:        String(m['LOGIN_ID_CHANGED_SUBJECT'] || ''),
    loginIdChangedBody:           String(m['LOGIN_ID_CHANGED_BODY'] || ''),
    contactEmailChangedSubject:   String(m['CONTACT_EMAIL_CHANGED_SUBJECT'] || ''),
    contactEmailChangedBody:      String(m['CONTACT_EMAIL_CHANGED_BODY'] || ''),
    memberUpdateConfirmSubject:   String(m['MEMBER_UPDATE_CONFIRM_SUBJECT'] || ''),
    memberUpdateConfirmBody:      String(m['MEMBER_UPDATE_CONFIRM_BODY'] || ''),
    withdrawalConfirmSubject:     String(m['WITHDRAWAL_CONFIRM_SUBJECT'] || ''),
    withdrawalConfirmBody:        String(m['WITHDRAWAL_CONFIRM_BODY'] || ''),
    passwordResetSubject:         String(m['PASSWORD_RESET_SUBJECT'] || ''),
    passwordResetBody:            String(m['PASSWORD_RESET_BODY'] || ''),
    // メール配信状態は MAIL_DELIVERY_STATE を正本とする。旧3キーは既存クライアントとの互換用。
    mailDeliveryState:            mailDeliveryState,
    mailGlobalEnabled:            mailDeliveryState !== 'STOPPED',
    mailDeliveryMode:             mailDeliveryState === 'REDIRECT' ? 'REDIRECT' : 'LIVE',
    mailRedirectAllowlist:        String(m['MAIL_REDIRECT_ALLOWLIST'] || ''),
    trainingApplyReceiptEnabled:  (function(){ var v = m['TRAINING_APPLY_RECEIPT_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    trainingReminderEnabled:      (function(){ var v = m['TRAINING_REMINDER_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    bulkMailEnabled:              (function(){ var v = m['BULK_MAIL_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    authOtpEnabled:               (function(){ var v = m['AUTH_OTP_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    loginIdChangedEnabled:        (function(){ var v = m['LOGIN_ID_CHANGED_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    contactEmailChangedEnabled:   (function(){ var v = m['CONTACT_EMAIL_CHANGED_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    memberUpdateConfirmEnabled:   (function(){ var v = m['MEMBER_UPDATE_CONFIRM_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    withdrawalConfirmEnabled:     (function(){ var v = m['WITHDRAWAL_CONFIRM_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    passwordResetEnabled:         (function(){ var v = m['PASSWORD_RESET_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    // Google Chat 会員手続き通知。Webhook URL は Script Properties にのみ保持する。
    chatMembershipNotificationEnabled: (function(){ var v = m['CHAT_MEMBERSHIP_NOTIFICATION_ENABLED']; return String(v) === 'true'; })(),
    chatMembershipRequestEnabled:      (function(){ var v = m['CHAT_MEMBERSHIP_REQUEST_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    chatMembershipFinalEnabled:        (function(){ var v = m['CHAT_MEMBERSHIP_FINAL_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    chatMembershipAnomalyEnabled:      (function(){ var v = m['CHAT_MEMBERSHIP_ANOMALY_ENABLED']; return (v===''||v===null||v===undefined)?true:String(v)!=='false'; })(),
    chatMembershipRequestBody: String(m['CHAT_MEMBERSHIP_REQUEST_BODY'] || '') || CHAT_MEMBERSHIP_REQUEST_DEFAULT_BODY,
    chatMembershipFinalBody:   String(m['CHAT_MEMBERSHIP_FINAL_BODY'] || '') || CHAT_MEMBERSHIP_FINAL_DEFAULT_BODY,
    chatMembershipAnomalyBody: String(m['CHAT_MEMBERSHIP_ANOMALY_BODY'] || '') || CHAT_MEMBERSHIP_ANOMALY_DEFAULT_BODY,
  };
}

// MASTER のみ変更可能な設定キー（v194）
var MASTER_ONLY_SETTING_KEYS = ['EMAIL_LOG_VIEWER_ROLE'];

// T_システム設定のスネークアッパーケースキーを camelCase に変換する
// 例: 'EMAIL_LOG_VIEWER_ROLE' → 'emailLogViewerRole'
function convertSettingKeyToCamel_(key) {
  return key.toLowerCase().replace(/_([a-z])/g, function(_, c) { return c.toUpperCase(); });
}

// メールの既定文面は初期データを投入するときだけ使う。設定の保存・読取り・送信では
// 空欄を既定文面で補わず、事務局が保存した内容を唯一の文面として扱う。
function requireConfiguredMailText_(value, label, trimValue) {
  var text = value == null ? '' : String(value);
  var stored = trimValue ? text.trim() : text;
  if (!stored.trim()) throw new Error('「' + label + '」は空欄にできません。');
  return stored;
}

function hasOwnSettingField_(value, key) {
  return !!value && Object.prototype.hasOwnProperty.call(value, key);
}

// `clasp run` の引数長に依存せず、現在の本番設定を機能群ごとに検証するための正本。
// 戻り値は件数だけで、設定値・メール本文・送信元などは返さない。
var SYSTEM_SETTINGS_VERIFICATION_SUITES_ = {
  core: ['defaultBusinessStaffLimit', 'trainingHistoryLookbackMonths', 'annualFeePaymentGuidance', 'annualFeeTransferAccount', 'memberTypeAnnualFees', 'membershipFeePublicVisible', 'membershipFeeNote', 'trainingDefaultFieldConfig', 'bulkMailAutoAttachFolderId', 'emailLogViewerRole', 'trainingFileFolderId', 'claimAttachmentFolderId'],
  publicPortal: ['publicPortalTrainingMenuEnabled', 'publicPortalMembershipMenuEnabled', 'publicPortalHeroBadgeEnabled', 'publicPortalHeroBadgeLabel', 'publicPortalPrivacyPolicyUrl', 'publicPortalHeroTitle', 'publicPortalHeroDescriptionEnabled', 'publicPortalHeroDescription', 'publicPortalMembershipBadgeEnabled', 'publicPortalMembershipBadgeLabel', 'publicPortalMembershipTitleEnabled', 'publicPortalMembershipTitle', 'publicPortalMembershipDescriptionEnabled', 'publicPortalMembershipDescription', 'publicPortalMembershipCtaLabel', 'publicPortalCompletionGuidanceVisible', 'publicPortalCompletionGuidanceTemplateIdWhenCredentialSent', 'publicPortalCompletionGuidanceTemplateIdWhenCredentialNotSent', 'publicPortalCompletionLoginInfoBlockVisible', 'publicPortalCompletionLoginInfoVisible', 'publicPortalCompletionLoginInfoTemplateIdWhenCredentialSent', 'publicPortalCompletionLoginInfoTemplateIdWhenCredentialNotSent', 'publicPortalTrainingBadgeEnabled', 'publicPortalTrainingBadgeLabel', 'publicPortalTrainingTitleEnabled', 'publicPortalTrainingTitle', 'publicPortalTrainingDescriptionEnabled', 'publicPortalTrainingDescription', 'publicPortalTrainingCtaLabel', 'publicPortalMemberUpdateMenuEnabled', 'publicPortalMemberUpdateBadgeEnabled', 'publicPortalMemberUpdateBadgeLabel', 'publicPortalMemberUpdateTitleEnabled', 'publicPortalMemberUpdateTitle', 'publicPortalMemberUpdateDescriptionEnabled', 'publicPortalMemberUpdateDescription', 'publicPortalMemberUpdateCtaLabel', 'publicPortalWithdrawalMenuEnabled', 'publicPortalWithdrawalBadgeEnabled', 'publicPortalWithdrawalBadgeLabel', 'publicPortalWithdrawalTitleEnabled', 'publicPortalWithdrawalTitle', 'publicPortalWithdrawalDescriptionEnabled', 'publicPortalWithdrawalDescription', 'publicPortalWithdrawalCtaLabel', 'withdrawalConfirmationItems'],
  mail: ['credentialEmailEnabled', 'credentialEmailFrom', 'credentialEmailSubject', 'credentialEmailBody', 'indSuppEmailEnabled', 'bizRepEmailEnabled', 'bizRepEmailSubject', 'bizRepEmailBody', 'bizStaffEmailEnabled', 'bizStaffEmailSubject', 'bizStaffEmailBody', 'staffAddStaffEmailEnabled', 'staffAddStaffEmailSubject', 'staffAddStaffEmailBody', 'staffAddRepEmailEnabled', 'staffAddRepEmailSubject', 'staffAddRepEmailBody', 'applicationReceiptEnabled', 'applicationReceiptSubject', 'applicationReceiptBody', 'approvalNotificationEnabled', 'approvalNotificationSubject', 'approvalNotificationBody', 'rejectionNotificationEnabled', 'rejectionNotificationSubject', 'rejectionNotificationBody', 'trainingApplyReceiptSubject', 'trainingApplyReceiptBody', 'trainingReminderSubject', 'trainingReminderBody', 'authOtpSubject', 'authOtpBody', 'loginIdChangedSubject', 'loginIdChangedBody', 'contactEmailChangedSubject', 'contactEmailChangedBody', 'memberUpdateConfirmSubject', 'memberUpdateConfirmBody', 'withdrawalConfirmSubject', 'withdrawalConfirmBody', 'passwordResetSubject', 'passwordResetBody', 'mailDeliveryState', 'mailRedirectAllowlist', 'trainingApplyReceiptEnabled', 'trainingReminderEnabled', 'bulkMailEnabled', 'authOtpEnabled', 'memberUpdateConfirmEnabled', 'withdrawalConfirmEnabled', 'passwordResetEnabled', 'loginIdChangedEnabled', 'contactEmailChangedEnabled'],
  chat: ['chatMembershipNotificationEnabled', 'chatMembershipRequestEnabled', 'chatMembershipFinalEnabled', 'chatMembershipAnomalyEnabled', 'chatMembershipRequestBody', 'chatMembershipFinalBody', 'chatMembershipAnomalyBody'],
};

function checkSystemSettingsPatch_(payload, callerPermLevel) {
  var suite = String((payload && payload.suite) || '').trim();
  var fields = SYSTEM_SETTINGS_VERIFICATION_SUITES_[suite];
  if (!fields) throw new Error('確認対象の機能群が正しくありません。');
  var current = getSystemSettings_();
  var request = { __dryRun: true };
  fields.forEach(function(field) { request[field] = current[field]; });
  var plan = updateSystemSettings_(request, callerPermLevel);
  return { suite: suite, valid: true, checkedFieldCount: fields.length, plannedSettingCount: plan.plannedSettingCount, plannedMemberFeeCodeCount: plan.plannedMemberFeeCodeCount, writes: 0 };
}

function updateSystemSettings_(request, callerPermLevel) {
  if (!request) throw new Error('settings が空です。');
  var isDryRun = request.__dryRun === true;
  if (isDryRun) {
    request = Object.assign({}, request);
    delete request.__dryRun;
  }
  if (Object.keys(request).length === 0) throw new Error('変更する設定がありません。');
  // MASTER 限定キーのチェック
  var effectivePermLevel = callerPermLevel || 'ADMIN';
  var masterOnlyRequested = MASTER_ONLY_SETTING_KEYS.some(function(k) {
    return request[convertSettingKeyToCamel_(k)] !== undefined;
  });
  if (masterOnlyRequested && effectivePermLevel !== 'MASTER') {
    throw new Error('この設定はマスター権限のみ変更できます。');
  }
  // 差分 API: 送られなかった項目は現在値を使って検証するが、更新配列には入れない。
  // これにより同時編集の未変更項目を上書きせず、`clasp run` の引数も小さく保てる。
  var currentSettings = getSystemSettings_();
  var next = hasOwnSettingField_(request, 'defaultBusinessStaffLimit') ? Number(request.defaultBusinessStaffLimit) : Number(currentSettings.defaultBusinessStaffLimit);
  var lookbackRaw = hasOwnSettingField_(request, 'trainingHistoryLookbackMonths') ? request.trainingHistoryLookbackMonths : currentSettings.trainingHistoryLookbackMonths;
  var lookback = Number(lookbackRaw);
  var guidance = hasOwnSettingField_(request, 'annualFeePaymentGuidance') ? String(request.annualFeePaymentGuidance == null ? '' : request.annualFeePaymentGuidance) : String(currentSettings.annualFeePaymentGuidance == null ? '' : currentSettings.annualFeePaymentGuidance);
  var transferAccount = validateAnnualFeeTransferAccount_(hasOwnSettingField_(request, 'annualFeeTransferAccount') ? request.annualFeeTransferAccount : currentSettings.annualFeeTransferAccount);
  if (!isFinite(next) || next < 1 || next > 200) {
    throw new Error('事業所メンバー上限（全体）は 1〜200 の範囲で設定してください。');
  }
  if (!isFinite(lookback) || lookback < 1 || lookback > 60) {
    throw new Error('履歴表示期間（月）は 1〜60 の範囲で設定してください。');
  }
  if (guidance.length > 2000) {
    throw new Error('年会費の納入案内は 2000 文字以内で設定してください。');
  }
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  // 全更新を1配列に収集し batchUpsertSystemSettings_ で一括書き込み（N+1問題解消）
  var updates = [];
  if (hasOwnSettingField_(request, 'defaultBusinessStaffLimit')) updates.push({ key: 'DEFAULT_BUSINESS_STAFF_LIMIT', value: String(Math.floor(next)), description: '事業所会員メンバー上限（全体デフォルト）' });
  if (hasOwnSettingField_(request, 'trainingHistoryLookbackMonths')) updates.push({ key: 'TRAINING_HISTORY_LOOKBACK_MONTHS', value: String(Math.floor(lookback)), description: '研修履歴の表示期間（月）' });
  if (hasOwnSettingField_(request, 'annualFeePaymentGuidance')) updates.push({ key: 'ANNUAL_FEE_PAYMENT_GUIDANCE', value: guidance, description: '年会費未納時の会員向け納入案内' });
  if (hasOwnSettingField_(request, 'annualFeeTransferAccount')) updates.push({ key: 'ANNUAL_FEE_TRANSFER_ACCOUNT', value: JSON.stringify(transferAccount), description: '年会費未納時の共通振込先' });
  if (request.trainingDefaultFieldConfig != null) {
    updates.push({ key: 'TRAINING_DEFAULT_FIELD_CONFIG', value: JSON.stringify(request.trainingDefaultFieldConfig), description: '研修フォームのデフォルト表示項目設定' });
  }
  // v376.64: 会費設定（金額の正本は M_会員種別.年会費金額・表示可否と補足は T_システム設定）
  // 検証を先に済ませてからシートへ書く（途中失敗で金額だけ書き換わるのを防ぐ）
  if (request.membershipFeePublicVisible != null) {
    updates.push({ key: 'MEMBERSHIP_FEE_PUBLIC_VISIBLE', value: request.membershipFeePublicVisible ? 'true' : 'false', description: '公開ポータルの入会申込画面に年会費を表示するか' });
  }
  if (request.membershipFeeNote != null) {
    var feeNote = String(request.membershipFeeNote);
    if (feeNote.length > 200) throw new Error('会費の補足説明は 200 文字以内で設定してください。');
    updates.push({ key: 'MEMBERSHIP_FEE_NOTE', value: feeNote, description: '入会申込画面に表示する会費の補足説明' });
  }
  if (request.memberTypeAnnualFees != null) {
    // 2026-10-26: ここでは確かめるだけ。書くのは最後（以前はここで書いていたため、後の検証で止まっても金額だけ変わった）
    Object.keys(request.memberTypeAnnualFees).forEach(function(code) { normalizeAnnualFeeAmount_(request.memberTypeAnnualFees[code], code); });
  }
  // v194: PDF名簿出力 & 一括メール設定（MASTER/ADMIN 共通可変）
  // v373.7 (S5 Phase 2): rosterTemplateSsId / reminderTemplateSsId pass-through 撤去
  if (request.bulkMailAutoAttachFolderId != null) {
    updates.push({ key: 'BULK_MAIL_AUTO_ATTACH_FOLDER_ID', value: String(request.bulkMailAutoAttachFolderId).trim(), description: '一括メール個別自動添付DriveフォルダID' });
  }
  // v194: MASTER のみ変更可能
  if (request.emailLogViewerRole != null && effectivePermLevel === 'MASTER') {
    var allowedRoles = ['MASTER', 'MASTER,ADMIN'];
    var roleVal = String(request.emailLogViewerRole).trim();
    if (allowedRoles.indexOf(roleVal) < 0) roleVal = 'MASTER';
    updates.push({ key: 'EMAIL_LOG_VIEWER_ROLE', value: roleVal, description: 'メール送信ログ閲覧権限' });
  }
  // v209: 入会時認証情報メール設定（MASTER/ADMIN 共通可変）
  if (request.credentialEmailEnabled != null) {
    updates.push({ key: 'CREDENTIAL_EMAIL_ENABLED', value: request.credentialEmailEnabled ? 'true' : 'false', description: '入会申込時にログイン情報メールを送信するか' });
  }
  if (request.credentialEmailFrom != null) {
    var ownerEmail = Session.getEffectiveUser().getEmail();
    var requestedFrom = String(request.credentialEmailFrom || '').trim();
    var validatedFrom = validateRequestedFromAddress_(requestedFrom, ownerEmail);
    updates.push({ key: 'CREDENTIAL_EMAIL_FROM', value: validatedFrom === ownerEmail ? '' : validatedFrom, description: '自動通知メール共通の送信元アドレス' });
  }
  if (request.credentialEmailSubject != null) {
    updates.push({ key: 'CREDENTIAL_EMAIL_SUBJECT', value: requireConfiguredMailText_(request.credentialEmailSubject, '入会時認証情報メールの件名', true), description: '入会時認証情報メールの件名' });
  }
  if (request.credentialEmailBody != null) {
    updates.push({ key: 'CREDENTIAL_EMAIL_BODY', value: requireConfiguredMailText_(request.credentialEmailBody, '入会時認証情報メールの本文', false), description: '入会時認証情報メールの本文（マージタグ: {{氏名}} {{ログインID}} {{パスワード}} {{会員マイページURL}}）' });
  }
  // v210: 公開ポータル メニュー表示設定
  if (request.publicPortalTrainingMenuEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_TRAINING_MENU_ENABLED', value: request.publicPortalTrainingMenuEnabled ? 'true' : 'false', description: '公開ポータル：研修申込メニューを表示するか' });
  }
  if (request.publicPortalMembershipMenuEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBERSHIP_MENU_ENABLED', value: request.publicPortalMembershipMenuEnabled ? 'true' : 'false', description: '公開ポータル：入会申込メニューを表示するか' });
  }
  if (request.publicPortalHeroBadgeEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_HERO_BADGE_ENABLED', value: request.publicPortalHeroBadgeEnabled ? 'true' : 'false', description: '公開ポータル：トップ補助ラベルを表示するか' });
  }
  // 2026-10-26: 見出し・説明・ボタン名 19 項目（空欄はまとめて知らせる）。項目の一覧は PUBLIC_PORTAL_REQUIRED_TEXTS_
  updates = updates.concat(collectRequiredPublicPortalTexts_(request));
  if (request.publicPortalPrivacyPolicyUrl != null) {
    // 既定へ戻さない（|| を使わない）。空で保存＝リンクを出さない、という意思表示。
    updates.push({ key: 'PUBLIC_PORTAL_PRIVACY_POLICY_URL', value: String(request.publicPortalPrivacyPolicyUrl).trim(), description: '公開ポータル：プライバシーポリシーの掲載先URL（空ならリンクを出さない）' });
  }
  if (request.publicPortalHeroDescriptionEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_HERO_DESCRIPTION_ENABLED', value: request.publicPortalHeroDescriptionEnabled ? 'true' : 'false', description: '公開ポータル：トップ説明文を表示するか' });
  }
  if (request.publicPortalMembershipBadgeEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBERSHIP_BADGE_ENABLED', value: request.publicPortalMembershipBadgeEnabled ? 'true' : 'false', description: '公開ポータル：入会カード補助ラベルを表示するか' });
  }
  if (request.publicPortalMembershipTitleEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBERSHIP_TITLE_ENABLED', value: request.publicPortalMembershipTitleEnabled ? 'true' : 'false', description: '公開ポータル：入会カード見出しを表示するか' });
  }
  if (request.publicPortalMembershipDescriptionEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBERSHIP_DESCRIPTION_ENABLED', value: request.publicPortalMembershipDescriptionEnabled ? 'true' : 'false', description: '公開ポータル：入会カード説明文を表示するか' });
  }
  if (request.publicPortalCompletionGuidanceVisible != null) {
    updates.push({ key: 'PUBLIC_PORTAL_COMPLETION_GUIDANCE_VISIBLE', value: request.publicPortalCompletionGuidanceVisible ? 'true' : 'false', description: '公開ポータル：入会完了画面の今後のご案内ブロックを表示するか' });
  }
  if (request.publicPortalCompletionLoginInfoBlockVisible != null) {
    updates.push({ key: 'PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BLOCK_VISIBLE', value: request.publicPortalCompletionLoginInfoBlockVisible ? 'true' : 'false', description: '公開ポータル：入会完了画面のログイン情報ブロックを表示するか' });
  }
  if (request.publicPortalCompletionLoginInfoVisible != null) {
    updates.push({ key: 'PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_VISIBLE', value: request.publicPortalCompletionLoginInfoVisible ? 'true' : 'false', description: '公開ポータル：入会完了画面のログイン情報を表示するか' });
  }
  if (request.publicPortalTrainingBadgeEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_TRAINING_BADGE_ENABLED', value: request.publicPortalTrainingBadgeEnabled ? 'true' : 'false', description: '公開ポータル：研修カード補助ラベルを表示するか' });
  }
  if (request.publicPortalTrainingTitleEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_TRAINING_TITLE_ENABLED', value: request.publicPortalTrainingTitleEnabled ? 'true' : 'false', description: '公開ポータル：研修カード見出しを表示するか' });
  }
  if (request.publicPortalTrainingDescriptionEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_TRAINING_DESCRIPTION_ENABLED', value: request.publicPortalTrainingDescriptionEnabled ? 'true' : 'false', description: '公開ポータル：研修カード説明文を表示するか' });
  }
  if (request.publicPortalMemberUpdateMenuEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBER_UPDATE_MENU_ENABLED', value: request.publicPortalMemberUpdateMenuEnabled ? 'true' : 'false', description: '公開ポータル：登録情報変更メニューを表示するか' });
  }
  if (request.publicPortalMemberUpdateBadgeEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBER_UPDATE_BADGE_ENABLED', value: request.publicPortalMemberUpdateBadgeEnabled ? 'true' : 'false', description: '公開ポータル：登録情報変更カード補助ラベルを表示するか' });
  }
  if (request.publicPortalMemberUpdateTitleEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBER_UPDATE_TITLE_ENABLED', value: request.publicPortalMemberUpdateTitleEnabled ? 'true' : 'false', description: '公開ポータル：登録情報変更カード見出しを表示するか' });
  }
  if (request.publicPortalMemberUpdateDescriptionEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_MEMBER_UPDATE_DESCRIPTION_ENABLED', value: request.publicPortalMemberUpdateDescriptionEnabled ? 'true' : 'false', description: '公開ポータル：登録情報変更カード説明文を表示するか' });
  }
  if (request.publicPortalWithdrawalMenuEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_WITHDRAWAL_MENU_ENABLED', value: request.publicPortalWithdrawalMenuEnabled ? 'true' : 'false', description: '公開ポータル：退会申込メニューを表示するか' });
  }
  if (request.publicPortalWithdrawalBadgeEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_WITHDRAWAL_BADGE_ENABLED', value: request.publicPortalWithdrawalBadgeEnabled ? 'true' : 'false', description: '公開ポータル：退会カード補助ラベルを表示するか' });
  }
  if (request.publicPortalWithdrawalTitleEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_WITHDRAWAL_TITLE_ENABLED', value: request.publicPortalWithdrawalTitleEnabled ? 'true' : 'false', description: '公開ポータル：退会カード見出しを表示するか' });
  }
  if (request.publicPortalWithdrawalDescriptionEnabled != null) {
    updates.push({ key: 'PUBLIC_PORTAL_WITHDRAWAL_DESCRIPTION_ENABLED', value: request.publicPortalWithdrawalDescriptionEnabled ? 'true' : 'false', description: '公開ポータル：退会カード説明文を表示するか' });
  }
  if (request.withdrawalConfirmationItems != null) {
    updates.push({ key: 'PUBLIC_PORTAL_WITHDRAWAL_CONFIRMATION_ITEMS', value: JSON.stringify(normalizeWithdrawalConfirmationItems_(request.withdrawalConfirmationItems)), description: '公開ポータル：退会確認項目の表示・文言設定' });
  }
  if (request.trainingFileFolderId != null) {
    updates.push({ key: 'TRAINING_FILE_FOLDER_ID', value: String(request.trainingFileFolderId || '').trim(), description: '研修ファイル保存先 Google Drive フォルダ ID' });
    // Script Properties にも保存（書くのは最後）
  }
  // v296: 請求添付ファイル保存先フォルダ
  if (request.claimAttachmentFolderId != null) {
    updates.push({ key: 'CLAIM_ATTACHMENT_FOLDER_ID', value: String(request.claimAttachmentFolderId || '').trim(), description: '請求添付ファイル保存先 Google Drive フォルダ ID' });
  }
  // v265: 個人・賛助会員 入会時メール ON/OFF
  if (request.indSuppEmailEnabled != null) {
    updates.push({ key: 'IND_SUPP_EMAIL_ENABLED', value: request.indSuppEmailEnabled ? 'true' : 'false', description: '入会時：個人・賛助会員メール送信ON/OFF' });
  }
  // v265: 事業所入会・職員追加メール設定
  if (request.bizRepEmailEnabled != null) {
    updates.push({ key: 'BIZ_REP_EMAIL_ENABLED', value: request.bizRepEmailEnabled ? 'true' : 'false', description: '事業所入会時：代表者メール送信ON/OFF' });
  }
  if (request.bizRepEmailSubject != null) {
    updates.push({ key: 'BIZ_REP_EMAIL_SUBJECT', value: requireConfiguredMailText_(request.bizRepEmailSubject, '事業所入会時：代表者メール件名', true), description: '事業所入会時：代表者メール件名' });
  }
  if (request.bizRepEmailBody != null) {
    updates.push({ key: 'BIZ_REP_EMAIL_BODY', value: requireConfiguredMailText_(request.bizRepEmailBody, '事業所入会時：代表者メール本文', false), description: '事業所入会時：代表者メール本文' });
  }
  if (request.bizStaffEmailEnabled != null) {
    updates.push({ key: 'BIZ_STAFF_EMAIL_ENABLED', value: request.bizStaffEmailEnabled ? 'true' : 'false', description: '事業所入会時：メンバーメール送信ON/OFF' });
  }
  if (request.bizStaffEmailSubject != null) {
    updates.push({ key: 'BIZ_STAFF_EMAIL_SUBJECT', value: requireConfiguredMailText_(request.bizStaffEmailSubject, '事業所入会時：メンバーメール件名', true), description: '事業所入会時：メンバーメール件名' });
  }
  if (request.bizStaffEmailBody != null) {
    updates.push({ key: 'BIZ_STAFF_EMAIL_BODY', value: requireConfiguredMailText_(request.bizStaffEmailBody, '事業所入会時：メンバーメール本文', false), description: '事業所入会時：メンバーメール本文' });
  }
  if (request.staffAddStaffEmailEnabled != null) {
    updates.push({ key: 'STAFF_ADD_STAFF_EMAIL_ENABLED', value: request.staffAddStaffEmailEnabled ? 'true' : 'false', description: '職員追加承認時：追加職員メール送信ON/OFF' });
  }
  if (request.staffAddStaffEmailSubject != null) {
    updates.push({ key: 'STAFF_ADD_STAFF_EMAIL_SUBJECT', value: requireConfiguredMailText_(request.staffAddStaffEmailSubject, '職員追加承認時：追加職員メール件名', true), description: '職員追加承認時：追加職員メール件名' });
  }
  if (request.staffAddStaffEmailBody != null) {
    updates.push({ key: 'STAFF_ADD_STAFF_EMAIL_BODY', value: requireConfiguredMailText_(request.staffAddStaffEmailBody, '職員追加承認時：追加職員メール本文', false), description: '職員追加承認時：追加職員メール本文' });
  }
  if (request.staffAddRepEmailEnabled != null) {
    updates.push({ key: 'STAFF_ADD_REP_EMAIL_ENABLED', value: request.staffAddRepEmailEnabled ? 'true' : 'false', description: '職員追加承認時：代表者通知メール送信ON/OFF' });
  }
  if (request.staffAddRepEmailSubject != null) {
    updates.push({ key: 'STAFF_ADD_REP_EMAIL_SUBJECT', value: requireConfiguredMailText_(request.staffAddRepEmailSubject, '職員追加承認時：代表者通知メール件名', true), description: '職員追加承認時：代表者通知メール件名' });
  }
  if (request.staffAddRepEmailBody != null) {
    updates.push({ key: 'STAFF_ADD_REP_EMAIL_BODY', value: requireConfiguredMailText_(request.staffAddRepEmailBody, '職員追加承認時：代表者通知メール本文', false), description: '職員追加承認時：代表者通知メール本文' });
  }
  // v368: 変更申請ワークフローメール 3 種 × ENABLED/SUBJECT/BODY
  if (request.applicationReceiptEnabled != null) {
    updates.push({ key: 'APPLICATION_RECEIPT_ENABLED', value: request.applicationReceiptEnabled ? 'true' : 'false', description: '公開ポータル申請受付時：受付確認メール送信ON/OFF' });
  }
  if (request.applicationReceiptSubject != null) {
    updates.push({ key: 'APPLICATION_RECEIPT_SUBJECT', value: requireConfiguredMailText_(request.applicationReceiptSubject, '公開ポータル申請受付時：受付確認メール件名', true), description: '公開ポータル申請受付時：受付確認メール件名' });
  }
  if (request.applicationReceiptBody != null) {
    updates.push({ key: 'APPLICATION_RECEIPT_BODY', value: requireConfiguredMailText_(request.applicationReceiptBody, '公開ポータル申請受付時：受付確認メール本文', false), description: '公開ポータル申請受付時：受付確認メール本文' });
  }
  if (request.approvalNotificationEnabled != null) {
    updates.push({ key: 'APPROVAL_NOTIFICATION_ENABLED', value: request.approvalNotificationEnabled ? 'true' : 'false', description: '管理者承認時：承認通知メール送信ON/OFF' });
  }
  if (request.approvalNotificationSubject != null) {
    updates.push({ key: 'APPROVAL_NOTIFICATION_SUBJECT', value: requireConfiguredMailText_(request.approvalNotificationSubject, '管理者承認時：承認通知メール件名', true), description: '管理者承認時：承認通知メール件名' });
  }
  if (request.approvalNotificationBody != null) {
    updates.push({ key: 'APPROVAL_NOTIFICATION_BODY', value: requireConfiguredMailText_(request.approvalNotificationBody, '管理者承認時：承認通知メール本文', false), description: '管理者承認時：承認通知メール本文' });
  }
  if (request.rejectionNotificationEnabled != null) {
    updates.push({ key: 'REJECTION_NOTIFICATION_ENABLED', value: request.rejectionNotificationEnabled ? 'true' : 'false', description: '管理者却下時：却下通知メール送信ON/OFF' });
  }
  if (request.rejectionNotificationSubject != null) {
    updates.push({ key: 'REJECTION_NOTIFICATION_SUBJECT', value: requireConfiguredMailText_(request.rejectionNotificationSubject, '管理者却下時：却下通知メール件名', true), description: '管理者却下時：却下通知メール件名' });
  }
  if (request.rejectionNotificationBody != null) {
    updates.push({ key: 'REJECTION_NOTIFICATION_BODY', value: requireConfiguredMailText_(request.rejectionNotificationBody, '管理者却下時：却下通知メール本文', false), description: '管理者却下時：却下通知メール本文' });
  }
  // v376.43 (Phase B): 従来ハードコード6メールの件名/本文
  if (request.trainingApplyReceiptSubject != null) {
    updates.push({ key: 'TRAINING_APPLY_RECEIPT_SUBJECT', value: requireConfiguredMailText_(request.trainingApplyReceiptSubject, '研修申込確認メール件名', true), description: '研修申込確認メール件名' });
  }
  if (request.trainingApplyReceiptBody != null) {
    updates.push({ key: 'TRAINING_APPLY_RECEIPT_BODY', value: requireConfiguredMailText_(request.trainingApplyReceiptBody, '研修申込確認メール本文', false), description: '研修申込確認メール本文' });
  }
  if (request.trainingReminderSubject != null) {
    updates.push({ key: 'TRAINING_REMINDER_SUBJECT', value: requireConfiguredMailText_(request.trainingReminderSubject, '研修リマインダーメール件名', true), description: '研修リマインダーメール件名' });
  }
  if (request.trainingReminderBody != null) {
    updates.push({ key: 'TRAINING_REMINDER_BODY', value: requireConfiguredMailText_(request.trainingReminderBody, '研修リマインダーメール本文', false), description: '研修リマインダーメール本文' });
  }
  if (request.authOtpSubject != null) {
    updates.push({ key: 'AUTH_OTP_SUBJECT', value: requireConfiguredMailText_(request.authOtpSubject, '公開ポータルOTPメール件名', true), description: '公開ポータルOTPメール件名' });
  }
  if (request.authOtpBody != null) {
    updates.push({ key: 'AUTH_OTP_BODY', value: requireConfiguredMailText_(request.authOtpBody, '公開ポータルOTPメール本文', false), description: '公開ポータルOTPメール本文' });
  }
  if (request.loginIdChangedSubject != null) {
    updates.push({ key: 'LOGIN_ID_CHANGED_SUBJECT', value: requireConfiguredMailText_(request.loginIdChangedSubject, 'ログインID変更のお知らせ件名', true), description: 'ログインID変更のお知らせ件名' });
  }
  if (request.loginIdChangedBody != null) {
    updates.push({ key: 'LOGIN_ID_CHANGED_BODY', value: requireConfiguredMailText_(request.loginIdChangedBody, 'ログインID変更のお知らせ本文', false), description: 'ログインID変更のお知らせ本文' });
  }
  if (request.contactEmailChangedSubject != null) {
    updates.push({ key: 'CONTACT_EMAIL_CHANGED_SUBJECT', value: requireConfiguredMailText_(request.contactEmailChangedSubject, 'メールアドレス変更のお知らせ件名', true), description: 'メールアドレス変更のお知らせ件名' });
  }
  if (request.contactEmailChangedBody != null) {
    updates.push({ key: 'CONTACT_EMAIL_CHANGED_BODY', value: requireConfiguredMailText_(request.contactEmailChangedBody, 'メールアドレス変更のお知らせ本文', false), description: 'メールアドレス変更のお知らせ本文' });
  }
  if (request.memberUpdateConfirmSubject != null) {
    updates.push({ key: 'MEMBER_UPDATE_CONFIRM_SUBJECT', value: requireConfiguredMailText_(request.memberUpdateConfirmSubject, '会員情報変更確認メール件名', true), description: '会員情報変更確認メール件名' });
  }
  if (request.memberUpdateConfirmBody != null) {
    updates.push({ key: 'MEMBER_UPDATE_CONFIRM_BODY', value: requireConfiguredMailText_(request.memberUpdateConfirmBody, '会員情報変更確認メール本文', false), description: '会員情報変更確認メール本文' });
  }
  if (request.withdrawalConfirmSubject != null) {
    updates.push({ key: 'WITHDRAWAL_CONFIRM_SUBJECT', value: requireConfiguredMailText_(request.withdrawalConfirmSubject, '退会申請受付確認メール件名', true), description: '退会申請受付確認メール件名' });
  }
  if (request.withdrawalConfirmBody != null) {
    updates.push({ key: 'WITHDRAWAL_CONFIRM_BODY', value: requireConfiguredMailText_(request.withdrawalConfirmBody, '退会申請受付確認メール本文', false), description: '退会申請受付確認メール本文' });
  }
  if (request.passwordResetSubject != null) {
    updates.push({ key: 'PASSWORD_RESET_SUBJECT', value: requireConfiguredMailText_(request.passwordResetSubject, 'パスワード再設定コードメール件名', true), description: 'パスワード再設定コードメール件名' });
  }
  if (request.passwordResetBody != null) {
    updates.push({ key: 'PASSWORD_RESET_BODY', value: requireConfiguredMailText_(request.passwordResetBody, 'パスワード再設定コードメール本文', false), description: 'パスワード再設定コードメール本文' });
  }
  // メール配信状態は一つだけを正本とする。旧キーも同時更新し、ロールバック時も挙動を保つ。
  if (request.mailDeliveryState != null) {
    var mailDeliveryState = normalizeMailDeliveryState_(request.mailDeliveryState);
    var legacyMailState = legacyMailDispatchValues_(mailDeliveryState);
    updates.push({ key: 'MAIL_DELIVERY_STATE', value: mailDeliveryState, description: 'メール配信状態: 停止 / 通常送信 / テスト集約' });
    updates.push({ key: 'MAIL_GLOBAL_ENABLED', value: legacyMailState.globalEnabled, description: '旧互換: メール送信全体状態' });
    updates.push({ key: 'MAIL_DELIVERY_MODE', value: legacyMailState.deliveryMode, description: '旧互換: メール配信方法' });
  } else {
    // 旧クライアントからの更新を受ける間だけ、従来キーを受理する。
    if (request.mailGlobalEnabled != null) {
      updates.push({ key: 'MAIL_GLOBAL_ENABLED', value: request.mailGlobalEnabled ? 'true' : 'false', description: '旧互換: メール送信全体状態' });
    }
    if (request.mailDeliveryMode != null) {
      var rawMode = String(request.mailDeliveryMode || 'LIVE').toUpperCase();
      if (['LIVE', 'REDIRECT', 'SUPPRESS'].indexOf(rawMode) < 0) rawMode = 'LIVE';
      updates.push({ key: 'MAIL_DELIVERY_MODE', value: rawMode, description: '旧互換: メール配信方法' });
    }
  }
  if (request.mailRedirectAllowlist != null) {
    // 入力サニタイズ: トリム + カンマ区切り正規化
    var allowlistRaw = String(request.mailRedirectAllowlist || '');
    var normalized = allowlistRaw.split(',').map(function(s){ return s.trim(); }).filter(function(s){ return s.length > 0; }).join(',');
    updates.push({ key: 'MAIL_REDIRECT_ALLOWLIST', value: normalized, description: 'REDIRECT モード時の送信先（カンマ区切り）' });
  }
  if (request.trainingApplyReceiptEnabled != null) {
    updates.push({ key: 'TRAINING_APPLY_RECEIPT_ENABLED', value: request.trainingApplyReceiptEnabled ? 'true' : 'false', description: '研修申込確認メール送信ON/OFF' });
  }
  if (request.trainingReminderEnabled != null) {
    updates.push({ key: 'TRAINING_REMINDER_ENABLED', value: request.trainingReminderEnabled ? 'true' : 'false', description: '研修リマインダーメール送信ON/OFF' });
  }
  if (request.bulkMailEnabled != null) {
    updates.push({ key: 'BULK_MAIL_ENABLED', value: request.bulkMailEnabled ? 'true' : 'false', description: '一括メール送信ON/OFF' });
  }
  if (request.authOtpEnabled != null) {
    updates.push({ key: 'AUTH_OTP_ENABLED', value: request.authOtpEnabled ? 'true' : 'false', description: '公開ポータル OTP メール送信ON/OFF' });
  }
  if (request.loginIdChangedEnabled != null) {
    updates.push({ key: 'LOGIN_ID_CHANGED_ENABLED', value: request.loginIdChangedEnabled ? 'true' : 'false', description: 'ログインID変更のお知らせ送信ON/OFF' });
  }
  if (request.contactEmailChangedEnabled != null) {
    updates.push({ key: 'CONTACT_EMAIL_CHANGED_ENABLED', value: request.contactEmailChangedEnabled ? 'true' : 'false', description: 'メールアドレス変更のお知らせ送信ON/OFF' });
  }
  if (request.memberUpdateConfirmEnabled != null) {
    updates.push({ key: 'MEMBER_UPDATE_CONFIRM_ENABLED', value: request.memberUpdateConfirmEnabled ? 'true' : 'false', description: '会員情報変更確認メール送信ON/OFF' });
  }
  if (request.withdrawalConfirmEnabled != null) {
    updates.push({ key: 'WITHDRAWAL_CONFIRM_ENABLED', value: request.withdrawalConfirmEnabled ? 'true' : 'false', description: '退会申請受付確認メール送信ON/OFF' });
  }
  if (request.passwordResetEnabled != null) {
    updates.push({ key: 'PASSWORD_RESET_ENABLED', value: request.passwordResetEnabled ? 'true' : 'false', description: 'パスワード再設定確認コードメール送信ON/OFF' });
  }
  if (request.chatMembershipNotificationEnabled != null) {
    updates.push({ key: 'CHAT_MEMBERSHIP_NOTIFICATION_ENABLED', value: request.chatMembershipNotificationEnabled ? 'true' : 'false', description: 'Google Chat 会員手続き通知の全体有効化' });
  }
  if (request.chatMembershipRequestEnabled != null) {
    updates.push({ key: 'CHAT_MEMBERSHIP_REQUEST_ENABLED', value: request.chatMembershipRequestEnabled ? 'true' : 'false', description: 'Google Chat 会員手続きの受付通知' });
  }
  if (request.chatMembershipFinalEnabled != null) {
    updates.push({ key: 'CHAT_MEMBERSHIP_FINAL_ENABLED', value: request.chatMembershipFinalEnabled ? 'true' : 'false', description: 'Google Chat 会員手続きの確定通知' });
  }
  if (request.chatMembershipAnomalyEnabled != null) {
    updates.push({ key: 'CHAT_MEMBERSHIP_ANOMALY_ENABLED', value: request.chatMembershipAnomalyEnabled ? 'true' : 'false', description: 'Google Chat 会員手続きの異常通知' });
  }
  var chatTemplateSettings = [
    ['chatMembershipRequestBody', 'CHAT_MEMBERSHIP_REQUEST_BODY', CHAT_MEMBERSHIP_REQUEST_DEFAULT_BODY, 'Google Chat 会員手続きの受付通知本文'],
    ['chatMembershipFinalBody', 'CHAT_MEMBERSHIP_FINAL_BODY', CHAT_MEMBERSHIP_FINAL_DEFAULT_BODY, 'Google Chat 会員手続きの確定通知本文'],
    ['chatMembershipAnomalyBody', 'CHAT_MEMBERSHIP_ANOMALY_BODY', CHAT_MEMBERSHIP_ANOMALY_DEFAULT_BODY, 'Google Chat 会員手続きの異常通知本文'],
  ];
  chatTemplateSettings.forEach(function(item) {
    if (request[item[0]] == null) return;
    var template = String(request[item[0]] || '').trim() || item[2];
    validateChatMembershipTemplate_(template);
    updates.push({ key: item[1], value: template, description: item[3] });
  });
  // 2026-10-26: ここまでで確かめ終え、書くのはこの下だけ（途中で止まって一部だけ保存されるのを防ぐ）。
  // 定型文の選択は、削除と食い違わないようロックの中で確かめる。
  // 2 人が同時に保存したときは、後から保存した方の内容になる（後勝ち・operator 決定 2026-10-26・docs/313 §4）。
  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_WAIT_TIMEOUT_MS);
  try {
    // 2026-10-25 docs/313: 案内文は定型文の ID だけを保存する（存在する・削除済みでない・同じ用途であること）。
    // 旧い本文のキーは書き換えない（前の版へ戻したとき、旧いコードが本文として読む）。
    SCREEN_TEXT_TEMPLATE_PURPOSES_.forEach(function(purpose) {
      if (request[purpose.requestKey] == null) return;
      updates.push({ key: purpose.settingKey, value: validateScreenTextTemplateSelection_(ss, purpose, request[purpose.requestKey]),
        description: '公開ポータル：入会完了画面・' + purpose.label + 'に使う定型文（T_画面文テンプレート）' });
    });
    if (isDryRun) {
      return {
        plannedSettingCount: updates.length,
        plannedMemberFeeCodeCount: request.memberTypeAnnualFees == null ? 0 : Object.keys(request.memberTypeAnnualFees).length,
      };
    }
    if (request.memberTypeAnnualFees != null) {
      setMemberTypeAnnualFeeAmounts_(ss, request.memberTypeAnnualFees);
    }
    batchUpsertSystemSettings_(ss, updates);
    var scriptProperties = PropertiesService.getScriptProperties();
    if (request.trainingFileFolderId != null) {
      scriptProperties.setProperty('TRAINING_FILE_FOLDER_ID', String(request.trainingFileFolderId || '').trim());
    }
    if (request.claimAttachmentFolderId != null) {
      scriptProperties.setProperty('CLAIM_ATTACHMENT_FOLDER_ID', String(request.claimAttachmentFolderId || '').trim());
    }
    if (hasOwnSettingField_(request, 'defaultBusinessStaffLimit')) scriptProperties.setProperty(DEFAULT_BUSINESS_STAFF_LIMIT_KEY, String(Math.floor(next))); // backward compatibility
    if (hasOwnSettingField_(request, 'trainingHistoryLookbackMonths')) scriptProperties.setProperty(TRAINING_HISTORY_LOOKBACK_MONTHS_KEY, String(Math.floor(lookback))); // backward compatibility
  } finally {
    lock.releaseLock();
  }
  return getSystemSettings_();
}

function getSystemSettingValue_(ss, key) {
  var sheet = ss.getSheetByName('T_システム設定');
  if (!sheet) return '';
  var found = findRowByColumnValue_(sheet, '設定キー', key);
  if (!found) return '';
  var idx = found.columns['設定値'];
  // Boolean false は設定値として有効であり、未設定ではない。
  // `value || ''` にすると false が空文字へ化け、OFF の通知が送信される。
  var value = idx == null ? null : found.row[idx];
  return value === null || value === undefined ? '' : String(value);
}

// T_システム設定を1回の読み込みで全設定を {key: value} マップとして返す（N+1回避）
function getSystemSettingMap_(ss) {
  var rows = getRowsAsObjects_(ss, 'T_システム設定');
  var map = {};
  for (var i = 0; i < rows.length; i++) {
    var k = String(rows[i]['設定キー'] || '');
    if (!k) continue;
    var v = rows[i]['設定値'];
    map[k] = (v === null || v === undefined) ? '' : String(v);
  }
  return map;
}

// 複数の設定を一括書き込み：読み2回＋書き1回で完結（N+1問題を解消）
// docs/307 S41（2026-10-24）: シートや列が無ければ止める。以前は黙って戻り、呼び出し元は「保存しました」と返した。
function batchUpsertSystemSettings_(ss, updates) {
  if (!updates || updates.length === 0) return;
  var sheet = ss.getSheetByName('T_システム設定');
  if (!sheet) throw new Error('T_システム設定 シートが無いため、設定を保存できませんでした。');
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) throw new Error('T_システム設定 に見出しが無いため、設定を保存できませんでした。');
  var headerValues = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var columns = {};
  for (var i = 0; i < headerValues.length; i++) {
    columns[String(headerValues[i] || '')] = i;
  }
  var keyCol = columns['設定キー'];
  var valueCol = columns['設定値'];
  var descCol = columns['説明'];
  var updatedAtCol = columns['更新日時'];
  if (keyCol === undefined || valueCol === undefined) {
    throw new Error('T_システム設定 に「設定キー」「設定値」の列が無いため、設定を保存できませんでした。');
  }
  var data = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];
  // key → row index マップ
  var keyToIndex = {};
  for (var r = 0; r < data.length; r++) {
    var k = String(data[r][keyCol] || '');
    if (k) keyToIndex[k] = r;
  }
  var now = new Date().toISOString();
  var modified = false;
  var toAppend = [];
  for (var u = 0; u < updates.length; u++) {
    var upd = updates[u];
    if (keyToIndex[upd.key] !== undefined) {
      var ri = keyToIndex[upd.key];
      if (valueCol !== undefined) data[ri][valueCol] = upd.value;
      if (descCol !== undefined) data[ri][descCol] = upd.description || '';
      if (updatedAtCol !== undefined) data[ri][updatedAtCol] = now;
      modified = true;
    } else {
      toAppend.push(upd);
    }
  }
  // 変更行を一括書き戻し（1回の setValues）
  if (modified && data.length > 0) {
    sheet.getRange(2, 1, data.length, lastCol).setValues(data);
  }
  // 新規行はアペンド
  for (var ap = 0; ap < toAppend.length; ap++) {
    appendRowsByHeaders_(ss, 'T_システム設定', [{
      '設定キー': toAppend[ap].key,
      '設定値': toAppend[ap].value,
      '説明': toAppend[ap].description || '',
      '更新日時': now,
    }]);
  }
  invalidateSettingsCache_(); // docs/330 §4.2: 書いた後に設定のキャッシュを捨てる
}

function upsertSystemSetting_(ss, key, value, description) {
  var sheet = ss.getSheetByName('T_システム設定');
  if (!sheet) return;
  var found = findRowByColumnValue_(sheet, '設定キー', key);
  var now = new Date().toISOString();
  if (!found) {
    appendRowsByHeaders_(ss, 'T_システム設定', [{
      設定キー: key,
      設定値: value,
      説明: description || '',
      更新日時: now,
    }]);
    invalidateSettingsCache_(); // docs/330 §4.2: 書いた後に設定のキャッシュを捨てる
    return;
  }
  var row = found.row.slice();
  if (found.columns['設定値'] != null) row[found.columns['設定値']] = value;
  if (found.columns['説明'] != null) row[found.columns['説明']] = description || '';
  if (found.columns['更新日時'] != null) row[found.columns['更新日時']] = now;
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  invalidateSettingsCache_(); // docs/330 §4.2: 書いた後に設定のキャッシュを捨てる
}

// シート由来の設定値は文字列だけでなく Boolean になる場合がある。
// Boolean false を `|| true` で既定値へすり替えないよう、未設定だけを既定値にする。
function isSystemSettingValueEnabled_(raw, defaultValue) {
  if (raw === '' || raw === null || raw === undefined) return !!defaultValue;
  return String(raw).trim().toLowerCase() !== 'false';
}

function isSystemSettingEnabled_(ss, key, defaultValue) {
  return isSystemSettingValueEnabled_(getSystemSettingValue_(ss, key), defaultValue);
}

// ── マスタの選択肢（2026-10-19・operator 指示: DRY／ハードコード禁止／マスタは今後も増える） ──
// マスタ定義 にある M_ 表すべてを、同じ形で読む。1 列目がコード、2 列目が名称（どのマスタも同じ並び）。
// 有効フラグが false・削除フラグが true の行を除き、表示順に並べる。
// 画面の選択肢・名称、GAS の名称表はすべてここから引く。マスタ定義 に表を足せば、コードを変えずに乗る。
// 書き込みの検査は isKnownMasterCode_（シートを直接読む）を使う。こちらはキャッシュを通すため。
var MASTER_OPTIONS_CACHE_KEY_ = 'master_options_v1';
var MASTER_OPTIONS_CACHE_TTL_ = 600;
var MASTER_BOOKKEEPING_COLUMNS_ = ['表示順', '有効フラグ', '削除フラグ', '作成日時', '更新日時'];

function masterOptionsFromRows_(masterName, rows) {
  var columns = マスタ定義[masterName] || [];
  var codeCol = columns[0];
  var labelCol = columns[1];
  var extraCols = columns.slice(2).filter(function(c) { return MASTER_BOOKKEEPING_COLUMNS_.indexOf(c) < 0; });
  return rows
    .filter(function(r) {
      if (!String(r[codeCol] || '').trim()) return false;
      if (r['削除フラグ'] !== undefined && toBoolean_(r['削除フラグ'])) return false;
      if (r['有効フラグ'] !== undefined && !toBoolean_(r['有効フラグ'])) return false;
      return true;
    })
    .sort(function(a, b) { return Number(a['表示順'] || 0) - Number(b['表示順'] || 0); })
    .map(function(r) {
      var code = String(r[codeCol]).trim();
      var attrs = {};
      extraCols.forEach(function(c) { attrs[c] = r[c] === undefined ? '' : r[c]; });
      return { code: code, label: String(r[labelCol] || '').trim() || code, order: Number(r['表示順'] || 0), attrs: attrs };
    });
}

/** マスタ名 → 選択肢の配列（マスタ定義 の全表）。スクリプトキャッシュを通す */
// 1 回の実行の中では読んだ結果を覚えておく（行ごとの正規化で何度呼ばれてもキャッシュを引き直さない）
var MASTER_OPTIONS_MEMO_ = null;
function readAllMasterOptions_(ss) {
  if (MASTER_OPTIONS_MEMO_) return MASTER_OPTIONS_MEMO_;
  // 2026-11-12 docs/332 S1: 期限で消えるキャッシュは冷えた状態に効かない（権限名 1 つのために 34 表を 1 枚ずつ読み 7.2 秒）。
  // 完成品（プロパティ）に置き、作るときは REST 1 回で 34 表を読む
  var result = getOrBuildSnapshot_('masters', mastersSnapshotMaxAgeMs_(), function() {
    return buildAllMasterOptions_(ss || getOrCreateDatabase_());
  });
  MASTER_OPTIONS_MEMO_ = result;
  return result;
}

function buildAllMasterOptions_(db) {
  var names = Object.keys(マスタ定義);
  var result = {};
  var valuesList = fetchSheetsValuesBatch_(db, names.map(function(n) { return "'" + n + "'"; }), 'ROWS');
  if (valuesList) {
    for (var i = 0; i < names.length; i += 1) result[names[i]] = masterOptionsFromRows_(names[i], rowsFromValues_(valuesList[i]));
    return result;
  }
  names.forEach(function(name) {
    result[name] = masterOptionsFromRows_(name, getRowsAsObjects_(db, name));
  });
  return result;
}

/** 有効なコードか（キャッシュを通す。行ごとの正規化向け。1 件の書き込みの検査は isKnownMasterCode_） */
function hasMasterOption_(ss, masterName, code) {
  var value = String(code == null ? '' : code);
  return readMasterOptions_(ss, masterName).some(function(o) { return o.code === value; });
}

// 会員の発送方法・郵送先区分を、マスタに無い値のまま保存しない。
// 2026-10-19: 公開ポータルの変更申請が 'MAIL'（M_発送方法 に無い）を送り、承認でそのまま書かれていた。
function assertMemberMailingCodes_(ss, mailingCode, destinationCode) {
  if (mailingCode && !isKnownMasterCode_(ss, 'M_発送方法', mailingCode)) {
    throw new Error('発送方法の値が不正です: ' + mailingCode);
  }
  if (destinationCode && !isKnownMasterCode_(ss, 'M_郵送先区分', destinationCode)) {
    throw new Error('郵送先区分の値が不正です: ' + destinationCode);
  }
}

function readMasterOptions_(ss, masterName) {
  return readAllMasterOptions_(ss)[masterName] || [];
}

/** コードの表示名（マスタの名称）。マスタに無い・無効なコードはコードのまま返す */
function masterLabel_(ss, masterName, code) {
  var value = String(code == null ? '' : code);
  var hit = readMasterOptions_(ss, masterName).filter(function(o) { return o.code === value; })[0];
  return hit ? hit.label : value;
}

/** マスタのシートを書き換えた関数は必ず呼ぶ（test:master-options が書き換える関数を見つけて確かめる） */
function invalidateMasterOptionsCache_() {
  MASTER_OPTIONS_MEMO_ = null;
  removeChunkedCache_(CacheService.getScriptCache(), MASTER_OPTIONS_CACHE_KEY_);
  markSnapshotStale_('masters'); // docs/332 S1
  // マスタ（会員種別の年会費を含む）は設定の中身でもある（docs/330 §4.2）
  invalidateSettingsCache_();
}

// ─── 2026-11-12 docs/330 §4: 設定のキャッシュ（表示のための読みだけ・TRD §3.2.2） ─────────────────
// 判断のための読み（getSystemSettings_：保存の競合確認・保存後の応答）は常に正本を読む。キャッシュするのは画面に出す読みだけ。
var SETTINGS_CACHE_MAX_CHARS_ = 30720; // 上限 90 KB ÷ 3（UTF-8 の日本語 1 文字は最大 3 バイト）
var ADMIN_SETTINGS_CACHE_TTL_SECONDS_ = 300;
var PUBLIC_SETTINGS_CACHE_TTL_SECONDS_ = 600; // operator 了承（2026-11-12）: 公開ポータルは最大 10 分遅れてよい

function adminSettingsCacheKey_() { return 'settings_admin_v1:' + DB_SCHEMA_VERSION; }
function publicSettingsCacheKey_() { return 'settings_public_v1:' + DB_SCHEMA_VERSION; }

// キャッシュにあればそれを、無ければ作って入れて返す。上限を超えうる値は入れずに警告する（黙って毎回作り直さない）。
function getOrBuildCachedText_(key, ttlSeconds, buildFn) {
  var cache = null;
  try {
    cache = CacheService.getScriptCache();
    var hit = cache.get(key);
    if (hit !== null && hit !== undefined) return hit;
  } catch (e) {
    cache = null;
  }
  var text = buildFn();
  if (!cache || typeof text !== 'string') return text;
  if (text.length > SETTINGS_CACHE_MAX_CHARS_) {
    console.warn('キャッシュの上限（90 KB）を超えうるため入れません: ' + key + '（' + text.length + ' 文字）');
    return text;
  }
  try {
    cache.put(key, text, ttlSeconds);
  } catch (e) {
    console.warn('キャッシュに入れられませんでした: ' + key + '（' + (e && e.message ? e.message : e) + '）');
  }
  return text;
}

// 設定の源（T_システム設定・M_*・T_画面文テンプレート）を書き換えたら呼ぶ。このプロジェクトの管理と公開の両方を捨てる。
function invalidateSettingsCache_() {
  try {
    CacheService.getScriptCache().removeAll([adminSettingsCacheKey_(), publicSettingsCacheKey_()]);
  } catch (e) {}
  markSnapshotStale_('settings'); // docs/332 S1
}

function getSystemSettingsForDisplay_() {
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss); // 版が上がったときの整備の入口は完成品の前に残す
  // 2026-11-12 docs/332 S1: 期限で消えるキャッシュから、消えない完成品（プロパティ）へ
  return getOrBuildSnapshot_('settings', SNAPSHOT_MAX_AGE_SETTINGS_MS_, function() { return getSystemSettings_(); });
}

function getPublicPortalSettingsForDisplay_() {
  return getOrBuildCachedText_(publicSettingsCacheKey_(), PUBLIC_SETTINGS_CACHE_TTL_SECONDS_, getPublicPortalSettings_);
}

/**
 * 画面へ渡すマスタ。管理は全表（属性つき）、公開・会員は名前を許可した表だけ・属性なし。
 * 公開側に属性（M_業務分類.単価 など）を出さないための許可リスト。新しいマスタは管理には自動で乗る。
 */
var PUBLIC_MASTER_NAMES_ = ['M_会員種別', 'M_発送方法', 'M_郵送先区分', 'M_職員権限', 'M_職員状態', 'M_会員状態'];
function masterOptionsForClient_(ss, scope) {
  var all = readAllMasterOptions_(ss);
  if (scope === 'ADMIN') return all;
  var result = {};
  PUBLIC_MASTER_NAMES_.forEach(function(name) {
    result[name] = (all[name] || []).map(function(o) { return { code: o.code, label: o.label, order: o.order }; });
  });
  return result;
}

// 会員種別の正本は M_会員種別。種別の検査・「全種別」の既定値・画面の会費欄と入会カードはここから引く。
// 金額が不正なときだけコード側の既定額（src/shared/memberTypes.mjs）。
function readMemberTypeMaster_(ss) {
  return readMasterOptions_(ss, 'M_会員種別').map(function(o) {
    var amount = Number(o.attrs['年会費金額']);
    return {
      code: o.code,
      label: o.label,
      order: o.order,
      annualFee: isFinite(amount) && amount >= 0 ? Math.floor(amount) : Number(MEMBER_TYPE_ANNUAL_FEE_DEFAULTS[o.code] || 0),
    };
  });
}

function getActiveMemberTypeCodes_(ss) {
  return readMemberTypeMaster_(ss).map(function(t) { return t.code; });
}
