// gas-src/10_api_entry.gs — 入口（doGet・processApiRequest）・境界・メニュー権限。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

function doGet(e) {
  try {
    initializeSchemaIfNeeded_();
  } catch (ex) {
    // UI表示を優先し、初期化失敗時もWebアプリは返す
  }

  // v251: scriptId でプロジェクトを識別し配信ページを固定。各 split は自身の HTML のみを返す。
  // v376.32: 公開ポータルは URL パラメータでディープリンクする（下部で __DEEPLINK__ を注入）。
  // AGENTS §3: Script ID は Script Properties の SCRIPT_ID_MEMBER / SCRIPT_ID_ADMIN /
  // SCRIPT_ID_PUBLIC で上書き可能（未設定時は現行3プロジェクトの既定値。移行時にコード改変不要）。
  var routeIdMember = '1ZKFJKNr4IzbguZvO4KbtSOE1BzkrzOG8OV2tF0RFdk28EnZTCL4Sx3dJ';
  var routeIdAdmin  = '1tlBJ-OJjqNQQxzb5tY3iRUlS4DmQD9sYqw5j842tXD1SPVHutBUeKTRi';
  var routeIdPublic = '11YRlyWVgWRFw5_zByfLnA_vUlZzLeBSgiaanQCvZZoHMAfay8yK7RdkL';
  try {
    var routeProps = PropertiesService.getScriptProperties();
    routeIdMember = routeProps.getProperty('SCRIPT_ID_MEMBER') || routeIdMember;
    routeIdAdmin  = routeProps.getProperty('SCRIPT_ID_ADMIN')  || routeIdAdmin;
    routeIdPublic = routeProps.getProperty('SCRIPT_ID_PUBLIC') || routeIdPublic;
  } catch (routeErr) {}
  var SCRIPT_ID_ROUTES = {};
  SCRIPT_ID_ROUTES[routeIdMember] = { file: 'index',        title: '会員マイページ｜枚方市ケアマネ協議会',          favicon: 'member' };
  SCRIPT_ID_ROUTES[routeIdAdmin]  = { file: 'index',        title: '管理者ポータル｜枚方市ケアマネ協議会',          favicon: 'member' };
  SCRIPT_ID_ROUTES[routeIdPublic] = { file: 'index_public', title: '研修・入会申込ポータル｜枚方市ケアマネ協議会', favicon: 'public' };
  var route = SCRIPT_ID_ROUTES[ScriptApp.getScriptId()]
    || { file: 'index_public', title: '研修・入会申込ポータル｜枚方市ケアマネ協議会', favicon: 'public' };

  // GAS は外側 iframe で配信するため、HTML 内の <meta viewport> は無視される。
  // モバイル表示（白ページ防止／レスポンシブ動作）には server-side addMetaTag が必須。
  var rawHtml = HtmlService.createHtmlOutputFromFile(route.file).getContent();

  // exec URL を client へ注入する。GAS の二重 iframe では window.location が
  // 内側 iframe を指すため、共有リンク生成は ScriptApp.getService().getUrl() を正本にする。
  try {
    var appUrl = ScriptApp.getService().getUrl();
    if (appUrl) {
      rawHtml = '<script>window.__APP_URL__=' + JSON.stringify(appUrl) + ';</script>' + rawHtml;
    }
  } catch (ex) {
    // getUrl() 失敗時は注入をスキップ
  }

  // v376.32: ディープリンク用 URL パラメータを許可制で client へ注入する。
  //   ?t=<研修ID> → 該当研修の申込画面へ直行 / ?p=<page> → 指定画面へ直行。
  //   GAS 予約語 c / sid は使わない（使用すると 405）。deny-by-default で既知キーのみ反映。
  try {
    var dlParams = (e && e.parameter) || {};
    var deepLink = {};
    var dlT = sanitizeDeepLinkValue_(dlParams.t);
    if (dlT) deepLink.t = dlT;
    var dlP = sanitizeDeepLinkValue_(dlParams.p);
    if (dlP) deepLink.p = dlP;
    rawHtml = '<script>window.__DEEPLINK__=' + JSON.stringify(deepLink) + ';</script>' + rawHtml;
  } catch (ex) {
    // パラメータ解釈失敗時はディープリンクなしで通常起動
  }

  // 2026-11-15 docs/332 §13・TRD §1.3.1: 管理画面は閲覧者を確かめ、完成品を読むだけで初期データを埋め込む（API 0 本で描く）。
  // 公開・会員の build はこの塊ごと削る（removeIfBlock 'adminBootRoute'）。失敗しても今までの API の経路で起動する。
  var adminBootRoute = APP_SECURITY_BOUNDARY === 'admin';
  if (adminBootRoute) {
    try {
      var bootStartedAt = Date.now();
      var bootReport = {};
      var adminBoot = buildAdminBootPayload_(bootReport);
      var bootTag = adminBoot ? adminBootScriptTag_(adminBoot) : '';
      if (bootTag) rawHtml = bootTag + rawHtml;
      // 常時計測（docs/332 §13.11）: 組み立ての時間・埋め込んだか・理由・大きさ（個人を特定する値は入れない）
      perfLog_(bootReport.props || null, 'admin.doGet.boot', {
        ms: Date.now() - bootStartedAt,
        embedded: !!bootTag,
        reason: String(bootReport.reason || ''),
        init: String(bootReport.init || ''),
        chars: bootTag.length,
      });
    } catch (ex) {
      // 埋め込まずに起動する
    }
  }

  // docs/248 M1 是正（2026-07-05）: ALLOWALL は第三者サイト埋込を想定する公開ポータルのみ。
  // member/admin は clickjacking/UI redressing 面を閉じるため DEFAULT（外部 frame 埋込拒否）。
  var xframeMode = route.file === 'index_public'
    ? HtmlService.XFrameOptionsMode.ALLOWALL
    : HtmlService.XFrameOptionsMode.DEFAULT;
  var output = HtmlService.createHtmlOutput(rawHtml)
    .setTitle(route.title)
    .setXFrameOptionsMode(xframeMode)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');

  try {
    var MEMBER_PNG_B64 =
      'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAATUlEQVR42mOQ9btBU8Qwa' +
      'sGoBUjoPxKgsgX/cQDqWPAfLxi14D8RYDQOaG4BzfMBPXLyaGk6agGpFvynABC24D/FY' +
      'KB9MGrBaEYjHQEAAxOEvw9kj6UAAAAASUVORK5CYII=';
    var PUBLIC_PNG_B64 =
      'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAUUlEQVR42mNgnZZJU8Qwa' +
      'sHIs+A/xYCwD6hoOs4gopbpA2cBGXaQnIpobgFJdpCZD2huAZF2UJSTaWjB0E9Fw84C' +
      'MhSMWjBqwdC3YLThRTcLALH0a/3mcrRMAAAAAElFTkSuQmCC';
    output.setFaviconUrl('data:image/png;base64,' + (route.favicon === 'public' ? PUBLIC_PNG_B64 : MEMBER_PNG_B64));
  } catch (ex) {}

  return output;
}

/**
 * v376.32: ディープリンク用 URL パラメータ値の sanitize。
 * deny-by-default。英数・ハイフン・アンダースコアのみ許可し最大 80 文字。
 * 研修ID(UUID) / ページキー(training-list 等) を想定し、注入・XSS の余地を断つ。
 * ※ build pruner 対策で正規表現リテラルは使わない（MEMORY: build_pruner_regex_action_traps）。
 */
function sanitizeDeepLinkValue_(raw) {
  if (raw == null) return '';
  var s = String(raw).trim();
  if (!s) return '';
  if (s.length > 80) s = s.slice(0, 80);
  var allowed = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  for (var i = 0; i < s.length; i++) {
    if (allowed.indexOf(s.charAt(i)) === -1) return '';
  }
  return s;
}

/**
 * v217: ファビコン PNG を Drive にアップロードして公開し、Script Properties に記録する。
 *
 * ★ 実行方法: Apps Script エディタ（script.google.com）でこの関数を選択して「実行」ボタンを押す。
 *   - clasp run からは DriveApp が動作しないため必ずエディタから実行すること。
 *   - 初回のみ実行。再実行しても既存 ID をそのまま返す（上書きしない）。
 *   - 実行後に doGet() が Drive URL を使ってファビコンを設定する。
 */
function setupFavicons() {
  var props = PropertiesService.getScriptProperties();
  var existingMemberId = props.getProperty('FAVICON_MEMBER_FILE_ID');
  var existingPublicId = props.getProperty('FAVICON_PUBLIC_FILE_ID');
  if (existingMemberId && existingPublicId) {
    return {
      status: 'already_setup',
      memberUrl: 'https://drive.google.com/uc?export=view&id=' + existingMemberId,
      publicUrl: 'https://drive.google.com/uc?export=view&id=' + existingPublicId
    };
  }

  // Node.js で生成した 32×32 PNG（青背景+人物 / 緑背景+建物）
  var MEMBER_PNG_B64 =
    'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAATUlEQVR42mOQ9btBU8QwasGoBUjoPxKgsgX/cQDqWPAfLxi14D8RY' +
    'DQOaG4BzfMBPXLyaGk6agGpFvynABC24D/FYKB9MGrBaEYjHQEAAxOEvw9kj6UAAAAASUVORK5CYII=';
  var PUBLIC_PNG_B64 =
    'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAUUlEQVR42mNgnZZJU8QwasHIs+A/xYCwD6hoOs4gopbpA2cBGXaQn' +
    'IpobgFJdpCZD2huAZF2UJSTaWjB0E9Fw84CMhSMWjBqwdC3YLThRTcLALH0a/3mcrRMAAAAAElFTkSuQmCC';

  // Drive フォルダ（既存があれば再利用）
  var folderName = 'システムFavicon';
  var folders = DriveApp.getFoldersByName(folderName);
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

  // PNG ファイル生成・公開
  function uploadFavicon(b64, filename) {
    var blob = Utilities.newBlob(Utilities.base64Decode(b64), 'image/png', filename);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getId();
  }

  var memberId = uploadFavicon(MEMBER_PNG_B64, 'favicon-member.png');
  var publicId = uploadFavicon(PUBLIC_PNG_B64, 'favicon-public.png');

  props.setProperty('FAVICON_MEMBER_FILE_ID', memberId);
  props.setProperty('FAVICON_PUBLIC_FILE_ID', publicId);

  return {
    status: 'created',
    memberUrl: 'https://drive.google.com/uc?export=view&id=' + memberId,
    publicUrl: 'https://drive.google.com/uc?export=view&id=' + publicId,
    folderUrl: folder.getUrl()
  };
}

var APP_SECURITY_BOUNDARY = 'public';

var PUBLIC_ALLOWED_ACTIONS = {
  getPublicTrainings: true,
  getPublicPortalSettings: true,
  getFileThumbnail: true,   // v272: Drive ファイルサムネイルを base64 で返す
  applyTrainingExternal: true,
  cancelTrainingExternal: true,
  submitMemberApplication: true,
  // v260: 公開ポータル OTP
  sendPublicOtp: true,          // 退会申請用 OTP（継続使用）
  verifyPublicOtp: true,        // 退会申請用 OTP 検証（継続使用）
  // v264: OTPなし本人確認フロー + 変更申請キュー
  verifyMemberIdentityForPublic: true,
  submitPublicChangeRequest: true,
  // 2026-10-13: 職員の照合（一致したかどうかだけを返す）。旧 getPublicEnrolledStaffList /
  // getPublicAvailableStaffSlots は登録内容を返していたため廃止した。
  checkPublicStaffMatch: true,
};

var MEMBER_ALLOWED_ACTIONS = {
  memberLogin: true,
  requestPasswordReset: true,
  completePasswordReset: true,
  getMemberPortalData: true,
  updateMemberSelf: true,
  changePassword: true,
  applyTraining: true,
  cancelTraining: true,
  withdrawSelf: true,
  cancelWithdrawalSelf: true,
  // v295: 役員自己サービス（役員のみ — サーバー側で isActiveOfficer_ を追加検証）
  getMyOfficerStatus: true,
  saveMyBankAccount: true,
  // v296: 請求（役員のみ — サーバー側で isActiveOfficer_ を追加検証）
  getMyClaims: true,
  submitClaim: true,
  deleteMyClaim: true,
  uploadClaimAttachment: true,
  removeClaimAttachment: true,
  // v331: 請求フォームの選択肢（組織・役職・支払い種別）描画用 — 読み取り専用、会員公開でも安全。
  getOfficerMasterData: true,
  // v344: 案内PDFサムネイルを Drive proxy 経由で取得（drive.google.com/uc?... の hotlink 制限回避）。
  // ファイルは ANYONE_WITH_LINK 共有で既に公開済みのため、追加リーク無し。
  getFileThumbnail: true,
};

// 管理者ログイン専用アクション: Session.getActiveUser() による自己完結型認証のため、
// 事前の admin session 検証を必要としない。関数内で認証を完結させる。
var ADMIN_LOGIN_ACTIONS = {
  checkAdminBySession: true,
  refreshAdminBoot: true, // 2026-11-15 docs/332 §13: doGet の埋め込みで描いた後の取り直し（ログインの記録を含む）
};

// docs/246 Phase 1-A: メニュー単位 RBAC の認可レジストリ。
// 以下 4 vars は build 時に scripts/menu-registry.mjs の serializeMenuRegistryForGas() で
// 上書き注入される。ここではソースの parse 健全性のために空の placeholder を置いている。
// 単一情報源は scripts/menu-registry.mjs（frontend からも import）。
// __MENU_REGISTRY_BUILD_INJECT_START__
var MENU_REGISTRY = [];
var ACTION_TO_MENU = {};
var LEGACY_ROLE_TO_MENUS = {};
var LEGACY_ROLE_TRAINING_SCOPE = {};
var INITIAL_ROLE_DEFINITIONS = [];
var LEGACY_CODE_TO_INITIAL_ROLE_ID = {};
// __MENU_REGISTRY_BUILD_INJECT_END__

// docs/246 Phase 1-A: action 認可判定（legacy 権限コード ベース）。
// Phase 2 hotfix v376.28.2: 主要パスは isActionAllowedForSession_ へ移行。
// この関数は snapshot test / fallback パス用に残置（直接呼び出し非推奨）。
function isActionAllowedByMenu_(action, roleCode) {
  if (roleCode === 'MASTER') return true;
  var menuId = ACTION_TO_MENU[action];
  if (!menuId) return false;
  var allowed = LEGACY_ROLE_TO_MENUS[roleCode] || [];
  for (var i = 0; i < allowed.length; i += 1) {
    if (allowed[i] === menuId) return true;
  }
  return false;
}

// docs/246 Phase 2 hotfix v376.28.2: 認可は checkAdminBySession_ で解決済の
// session (isMaster + allowedMenus) を直接参照する。これにより:
//   - whitelist.ロールID が埋まっていれば T_権限ロール の値が authoritative
//   - 無ければ legacy 権限コードからの fallback（Phase 1-B fallback chain と整合）
//   - カスタムロールの allowedMenus が実トラフィックの認可判定に反映される
// MASTER は session.isMaster=true により従来通り全許可（user 確認済の設計意図）。
function isActionAllowedForSession_(action, sessionResult) {
  if (!sessionResult) return false;
  if (sessionResult.isMaster) return true;
  var menuId = ACTION_TO_MENU[action];
  if (!menuId) return false;
  var allowed = sessionResult.allowedMenus || [];
  for (var i = 0; i < allowed.length; i += 1) {
    if (allowed[i] === menuId) return true;
  }
  return false;
}

var ADMIN_ACTION_PERMISSIONS = {
  'getDbInfo': ['MASTER','ADMIN'],
  'getSystemSettings': ['MASTER','ADMIN'],
  'checkSystemSettingsPatch': ['MASTER','ADMIN'],
  'updateSystemSettings': ['MASTER','ADMIN'],
  'saveScreenTextTemplate': ['MASTER','ADMIN'],
  'deleteScreenTextTemplate': ['MASTER','ADMIN'],
  'getAdminPermissionData': ['MASTER','ADMIN'],
  'saveAdminPermission': ['MASTER','ADMIN'],
  'deleteAdminPermission': ['MASTER','ADMIN'],
  // docs/246 Phase 2-A: ロール CRUD（listRoles は ADMIN/MASTER、書込系は server で MASTER only を二重防御）
  'listRoles': ['MASTER','ADMIN'],
  'saveRole': ['MASTER','ADMIN'],
  'deleteRole': ['MASTER','ADMIN'],
  'duplicateRole': ['MASTER','ADMIN'],
  'seedDemoData': ['MASTER'],
  'getAdminDashboardData': ['MASTER','ADMIN'],
  'getAdminInitData': ['MASTER','ADMIN'],
  'updateMember': ['MASTER','ADMIN'],
  // v376.55/56: 会員認証アカウント一覧（read）+ パスワードリセット + 新規発行（重要操作のため MASTER/ADMIN のみ・会員管理メニュー配下）
  'getMemberAuthAccounts': ['MASTER','ADMIN'],
  'adminResetMemberPassword': ['MASTER','ADMIN'],
  'adminUnlockMemberAccount': ['MASTER','ADMIN'],
  'adminIssueMemberCredential': ['MASTER','ADMIN'],
  'withdrawMember': ['MASTER','ADMIN'],
  'scheduleWithdrawMember': ['MASTER','ADMIN'],
  'cancelScheduledWithdraw': ['MASTER','ADMIN'],
  'removeStaffFromOffice': ['MASTER','ADMIN'],
  'updateStaff': ['MASTER','ADMIN'],
  'getAdminPersonList': ['MASTER','ADMIN'],
  'updatePersonsBatch': ['MASTER','ADMIN'],
  'convertMemberType': ['MASTER','ADMIN'],
  'getMemberConversionResult': ['MASTER','ADMIN'],
  'getAnnualFeeAdminData': ['MASTER','ADMIN'],
  'saveAnnualFeeRecord': ['MASTER','ADMIN'],
  'saveAnnualFeeRecordsBatch': ['MASTER','ADMIN'],
  'saveTraining': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  // v376.7: soft delete / restore は MASTER/ADMIN/TRAINING_MANAGER のみ（REGISTRAR は登録専用で削除権限なし）
  'softDeleteTraining': ['MASTER','ADMIN','TRAINING_MANAGER'],
  'restoreTraining': ['MASTER','ADMIN','TRAINING_MANAGER'],
  'uploadTrainingFile': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  // v350: 失敗時の手動サムネイル再生成
  'regenerateThumbnailForTraining': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  'setupTrainingFileFolder': ['MASTER','ADMIN'],
  'getTrainingManagementData': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  'getTrainingApplicants': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  'sendTrainingReminder': ['MASTER','ADMIN','TRAINING_MANAGER'],
  'getAdminEmailAliases': ['MASTER','ADMIN','TRAINING_MANAGER'],
  'sendTrainingMail': ['MASTER','ADMIN','TRAINING_MANAGER'],
  'generateTrainingEmail': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  // v373.7 (S5 Phase 2): getMembersForRoster / generateRosterZip / validateTemplateSpreadsheet 撤去（旧 RosterExport 関連）
  'getMembersForBulkMail': ['MASTER','ADMIN'],
  'sendBulkMemberMail': ['MASTER','ADMIN'],
  'getEmailSendLog': ['MASTER','ADMIN'],
  'getCredentialEmailTemplates': ['MASTER','ADMIN'],
  'saveCredentialEmailTemplate': ['MASTER','ADMIN'],
  'deleteCredentialEmailTemplate': ['MASTER','ADMIN'],
  // v376.68: 汎用データエクスポートは既定で MASTER のみ。
  // 会員の個人情報を丸ごと持ち出せる操作のため deny-by-default とし、
  // 事務局へ渡す場合は MASTER が 権限管理 から data-export メニューを明示的に付与する。
  'listExportableTables': ['MASTER'],
  'exportTableCsv': ['MASTER'],
  'listRegulations': ['MASTER','ADMIN'],
  'saveRegulation': ['MASTER','ADMIN'],
  'saveRegulationsBatch': ['MASTER','ADMIN'],
  'deleteRegulation': ['MASTER','ADMIN'],
  'listMailTemplates': ['MASTER','ADMIN'],
  'saveMailTemplate': ['MASTER','ADMIN'],
  'deleteMailTemplate': ['MASTER','ADMIN'],
  'getBulkMailTemplates': ['MASTER','ADMIN'],
  'saveBulkMailTemplate': ['MASTER','ADMIN'],
  'deleteBulkMailTemplate': ['MASTER','ADMIN'],
  'searchMembersForDelete': ['MASTER'],
  'previewDeleteMember': ['MASTER'],
  'executeDeleteMember': ['MASTER'],
  'getDeleteLogs': ['MASTER'],
  'repairDuplicateStaffRecords': ['MASTER'],
  'repairTrainingApplicationApplicantIds': ['MASTER'],
  'repairMemberCareManagerDuplicates': ['MASTER'],
  'backupMigrationTargets': ['MASTER'],
  'fetchAllData': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  // v373.7 (S5 Phase 2): initRosterExport / processRosterChunk / finalizeRosterExport / cleanupRosterExport 撤去
  'getMailingListTargets': ['MASTER','ADMIN'],
  'generateMailingListExcel': ['MASTER','ADMIN'],
  // v264: 変更申請管理
  'getAdminChangeRequests': ['MASTER','ADMIN'],
  'approveAdminChangeRequest': ['MASTER','ADMIN'],
  'rejectAdminChangeRequest': ['MASTER','ADMIN'],
  // v295: 役員管理マスタ（システム設定から管理）
  'getOfficerMasterData': ['MASTER','ADMIN'],
  'saveOrganization': ['MASTER','ADMIN'],
  'deleteOrganization': ['MASTER','ADMIN'],
  'saveOfficerRole': ['MASTER','ADMIN'],
  'deleteOfficerRole': ['MASTER','ADMIN'],
  'savePaymentType': ['MASTER','ADMIN'],
  'deletePaymentType': ['MASTER','ADMIN'],
  'saveWorkCategory': ['MASTER','ADMIN'],
  'deleteWorkCategory': ['MASTER','ADMIN'],
  // v295/v297: 役員割当て管理（管理コンソール）
  'getOfficerManagementData': ['MASTER','ADMIN'],
  'assignOfficer': ['MASTER','ADMIN'],
  'resignOfficer': ['MASTER','ADMIN'],
  'updateOfficerLinkage': ['MASTER','ADMIN'],
  'updateOfficerRecord': ['MASTER','ADMIN'],
  // v295: 振込口座管理（管理者用）
  'getAdminBankAccount': ['MASTER','ADMIN'],
  'saveAdminBankAccount': ['MASTER','ADMIN'],
  'deleteAdminBankAccount': ['MASTER','ADMIN'],
  // v295: 支払い履歴管理
  'getPaymentHistory': ['MASTER','ADMIN'],
  'savePayment': ['MASTER','ADMIN'],
  'deletePayment': ['MASTER','ADMIN'],
  // v296: 請求管理（管理者）
  'getClaims': ['MASTER','ADMIN'],
  'approveClaim': ['MASTER','ADMIN'],
  'rejectClaim': ['MASTER','ADMIN'],
  'adminDeleteClaim': ['MASTER','ADMIN'],
  // v309: 共有メモ（年会費コンソール申し送りホワイトボード）
  'getSharedMemo': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR','GENERAL'],
  'saveSharedMemo': ['MASTER','ADMIN'],
  // v344: 案内PDFサムネイルを管理者画面でも Drive proxy 経由で取得（hotlink 制限回避）。
  'getFileThumbnail': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR','GENERAL'],
  // v373.7 (S5 Phase 2): 旧 v316 テンプレートライブラリ ACTION 群撤去
  // v372: 名簿出力 Visual Template Designer
  'getRosterFieldDictionary': ['MASTER','ADMIN'],
  'getRosterDesignerData': ['MASTER','ADMIN'],
  'loadRosterTemplatesV2': ['MASTER','ADMIN'],
  'saveRosterTemplateV2': ['MASTER','ADMIN'],
  'deleteRosterTemplateV2': ['MASTER','ADMIN'],
  'duplicateRosterTemplateV2': ['MASTER','ADMIN'],
  // v374.1: 公式LINE投稿依頼
  'listLinePostRequests': ['MASTER','ADMIN'],
  'getLinePostRequest': ['MASTER','ADMIN'],
  'saveLinePostRequest': ['MASTER','ADMIN'],
  'uploadLinePostAttachment': ['MASTER','ADMIN'],
  'transitionLinePostRequest': ['MASTER','ADMIN'],
  'deleteLinePostRequest': ['MASTER','ADMIN'],
  // v360: 研修名簿・出欠・受講履歴・一括メール明細
  'getTrainingRosterDetail': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  'saveAttendance': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  'saveAttendanceBatch': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  'addRosterEntry': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  'addGuestRosterEntry': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  'cancelRosterEntry': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  'updateRosterEntry': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
  'getTrainingStats': ['MASTER','ADMIN','TRAINING_MANAGER','TRAINING_REGISTRAR'],
};

function getActionRegistryForCurrentApp_() {
  if (APP_SECURITY_BOUNDARY === 'public') {
    return {
      publicActions: PUBLIC_ALLOWED_ACTIONS,
      memberActions: {},
      adminLoginActions: {},
      adminPermissions: {},
    };
  }
  if (APP_SECURITY_BOUNDARY === 'member') {
    return {
      publicActions: {},
      memberActions: MEMBER_ALLOWED_ACTIONS,
      adminLoginActions: {},
      adminPermissions: {},
    };
  }
  if (APP_SECURITY_BOUNDARY === 'admin') {
    return {
      publicActions: {},
      memberActions: {},
      adminLoginActions: ADMIN_LOGIN_ACTIONS,
      adminPermissions: ADMIN_ACTION_PERMISSIONS,
    };
  }
  return { publicActions: {}, memberActions: {}, adminLoginActions: {}, adminPermissions: {} };
}

// 2026-11-12 docs/325 手順 0b（一度きり・段 1 のリリースで撤去）: web app 経由で部品ごとの時間を計る。
// 依頼に __profile: true があるときだけ、時間の内訳（部品名と ms だけ・値は含めない）をログへ 1 行出す。
// 応答は変えない。ログを読めるのはスクリプトの編集者だけ。
var _apiProfile = null;
function apiProfileMark_(label) {
  if (_apiProfile) _apiProfile.marks.push([label, Date.now() - _apiProfile.t0]);
}
function flushApiProfile_(action) {
  var p = _apiProfile;
  _apiProfile = null;
  if (!p) return;
  console.log('[apiProfile] ' + JSON.stringify({
    action: action,
    boundary: APP_SECURITY_BOUNDARY,
    evalMs: p.t0 - API_PROFILE_EVAL_STARTED_AT_MS_,
    totalMs: Date.now() - p.t0,
    marks: p.marks,
  }));
}

function processApiRequest(action, payload) {
  var apiEnteredAtMs = Date.now();
  _apiProfile = null;
  try {
    var parsedPayload = parsePayload_(payload) || {};
    var profileRequested = parsedPayload.__profile === true;
    delete parsedPayload.__profile;
    var actionRegistry = getActionRegistryForCurrentApp_();
    // ロール視点プレビューのロールID。業務処理へは渡さない。
    var previewRoleId = String(parsedPayload.__previewRoleId || '').trim();
    delete parsedPayload.__previewRoleId;
    var isPublicAction = !!actionRegistry.publicActions[action];
    var isMemberAction = !!actionRegistry.memberActions[action];
    var isAdminLoginAction = !!actionRegistry.adminLoginActions[action];
    var requiredPerms = actionRegistry.adminPermissions[action];
    if (!isPublicAction && !isMemberAction && !isAdminLoginAction && !requiredPerms) {
      return JSON.stringify({ success: false, error: 'unsupported_action' });
    }
    // 許可リストにある action だけ計る（ログに任意の文字列を残さない）
    if (profileRequested) {
      _apiProfile = { t0: apiEnteredAtMs, marks: [] };
      apiProfileMark_('parsed');
    }
    if (requiredPerms) {
      // ロール視点プレビュー: 以降の判定と処理はすべてそのロールの権限で行う（buildPreviewAdminSession_）。
      // このブロックは公開・会員 split のビルドで丸ごと削られるので、管理 split でしか効かない。
      _previewAdminSession = null;
      if (previewRoleId) {
        _previewAdminSession = buildPreviewAdminSession_(previewRoleId);
        if (!isPreviewReadAction_(action)) appendPreviewAuditLog_(_previewAdminSession, action);
      }
      apiProfileMark_('preview');
      var sessionResult = checkAdminBySession_();
      apiProfileMark_('checkAdminBySession');
      if (!sessionResult) {
        return JSON.stringify({ success: false, error: 'unauthorized' });
      }
      // docs/246 Phase 2 hotfix v376.28.2: 認可判定を session resolved ロールベースへ。
      // checkAdminBySession_ 内で:
      //   - whitelist.ロールID 埋まり → T_権限ロール の値が authoritative
      //   - 無ければ → legacy 権限コードからの fallback
      // どちらの場合も sessionResult.isMaster / allowedMenus が正しく設定されているので、
      // これを直接見ることでカスタムロールの allowedMenus を実トラフィックに反映する。
      if (!isActionAllowedForSession_(action, sessionResult)) {
        return JSON.stringify({ success: false, error: 'insufficient_permission' });
      }
      apiProfileMark_('isActionAllowed');
      parsedPayload.__adminSession = sessionResult;
      // 2026-11-02: 研修ごとの操作は、研修登録者は自分の研修だけ（他の研修は見られるが操作できない）
      try {
        assertTrainingOperationAllowed_(action, parsedPayload, sessionResult, getOrCreateDatabase_);
      } catch (scopeErr) {
        return JSON.stringify({ success: false, error: scopeErr && scopeErr.message ? scopeErr.message : String(scopeErr) });
      }
      apiProfileMark_('assertTrainingOperation');
    }
    // 会員セッショントークン検証: ログイン以外の MEMBER_ALLOWED_ACTIONS は
    // サーバー側セッションキャッシュからのみ principal を解決し、クライアント申告を信頼しない
    var LOGIN_ONLY_MEMBER_ACTIONS = { memberLogin: true, requestPasswordReset: true, completePasswordReset: true };
    if (isMemberAction && !LOGIN_ONLY_MEMBER_ACTIONS[action]) {
      var memberToken = String(parsedPayload.sessionToken || '').trim();
      if (!memberToken) {
        return JSON.stringify({ success: false, error: 'member_unauthorized' });
      }
      var cachedMemberSession = CacheService.getScriptCache().get('ms_' + memberToken);
      if (!cachedMemberSession) {
        return JSON.stringify({ success: false, error: 'member_session_expired' });
      }
      var memberSession = JSON.parse(cachedMemberSession);
      // クライアント申告の識別子をサーバー検証済み値で上書きして IDOR を防止する
      parsedPayload.loginId = memberSession.loginId;
      parsedPayload.memberId = memberSession.memberId;
      parsedPayload.staffId = memberSession.staffId || '';
      parsedPayload.__memberSession = memberSession;
      apiProfileMark_('memberSession');
    }
    // ─────────────────────────────────────────────────────────

    if (action === 'fetchAllData') {
      return JSON.stringify({
        success: true,
        data: fetchAllDataFromDb_(),
      });
    }

    if (action === 'getAdminDashboardData') {
      return JSON.stringify({
        success: true,
        data: getAdminDashboardData_(),
      });
    }

    // v150: 管理者初期データ統合API（dashboard + settings を1回のround-tripで返す）
    if (action === 'getAdminInitData') {
      var initSnapshot = getDashboardSnapshotData_();
      var initDashboard = initSnapshot.dashboard;
      apiProfileMark_('init.dashboard');
      var initSettings = getSystemSettingsForDisplay_();
      apiProfileMark_('init.settings');
      // 2026-09-27: 定期ジョブの死活をここで評価する。トリガーで見張ると
      // 見張り役が死んだときに誰も気づけないため、人が開く経路に載せる。
      var initScheduledJobs = reportOverdueScheduledJobs_();
      apiProfileMark_('init.scheduledJobs');
      // docs/330 §3: 未処理件数を同梱する（変更申請の権限があるときだけ）。数えられなければ null（画面は個別に取る）
      // docs/332 S1: 件数はダッシュボードの完成品と一緒に作ってある。権限で絞るのは応答のとき
      var initPendingCount = null;
      if (isActionAllowedForSession_('getAdminChangeRequests', parsedPayload.__adminSession)) {
        initPendingCount = typeof initSnapshot.pendingChangeRequestCount === 'number' ? initSnapshot.pendingChangeRequestCount : null;
      }
      apiProfileMark_('init.pendingCount');
      var initJson = JSON.stringify({
        success: true,
        data: {
          dashboard: initDashboard,
          settings: initSettings,
          scheduledJobs: initScheduledJobs,
          pendingChangeRequestCount: initPendingCount,
        },
      });
      apiProfileMark_('init.stringify');
      return initJson;
    }

    if (action === 'getTrainingManagementData') {
      return JSON.stringify({
        success: true,
        data: getTrainingManagementData_(),
      });
    }

    if (action === 'getMemberPortalData') {
      return JSON.stringify({
        success: true,
        data: getMemberPortalData_(parsedPayload),
      });
    }

    // v295: 役員自己サービス（sessionToken 検証済み → payload.memberId 確定済み）
    if (action === 'getMyOfficerStatus') {
      return JSON.stringify({ success: true, data: getMemberOfficerStatus_(parsedPayload) });
    }
    if (action === 'saveMyBankAccount') {
      return JSON.stringify({ success: true, data: saveMemberBankAccount_(parsedPayload) });
    }
    // v296: 請求（役員のみ）
    if (action === 'getMyClaims') {
      return JSON.stringify({ success: true, data: getMyClaims_(parsedPayload) });
    }
    if (action === 'submitClaim') {
      return JSON.stringify({ success: true, data: saveClaim_(parsedPayload) });
    }
    if (action === 'deleteMyClaim') {
      return JSON.stringify({ success: true, data: deleteMyClaim_(parsedPayload) });
    }
    if (action === 'uploadClaimAttachment') {
      return JSON.stringify({ success: true, data: uploadClaimAttachment_(parsedPayload) });
    }
    if (action === 'removeClaimAttachment') {
      return JSON.stringify({ success: true, data: removeClaimAttachment_(parsedPayload) });
    }

    if (action === 'updateMember') {
      // v143: 管理者用 allowlist でサニタイズしてから委譲
      var sanitizedMemberPayload = sanitizeAdminMemberPayload_(parsedPayload);
      sanitizedMemberPayload.__adminSession = parsedPayload.__adminSession;
      var adminUpdateResult = updateMember_(sanitizedMemberPayload);
      notifyMembershipChatForMember_(getOrCreateDatabase_(), 'FINAL', sanitizedMemberPayload.id, {
        '手続種別': '会員情報変更（管理者操作）',
        '申請ID': '',
        '変更内容': '管理画面から会員情報が更新されました。',
        '異常内容': '',
      });
      return JSON.stringify({
        success: true,
        data: adminUpdateResult,
      });
    }

    if (action === 'withdrawMember') {
      var adminWithdrawalResult = withdrawMember_(parsedPayload);
      notifyMembershipChatForMember_(getOrCreateDatabase_(), 'FINAL', parsedPayload.memberId, {
        '手続種別': '退会（管理者処理）',
        '申請ID': '',
        '変更内容': '管理画面から会員を退会処理しました。',
        '異常内容': '',
      });
      return JSON.stringify({ success: true, data: adminWithdrawalResult });
    }

    if (action === 'removeStaffFromOffice') {
      var removeStaffResult = removeStaffFromOffice_(parsedPayload);
      notifyMembershipChatForMember_(getOrCreateDatabase_(), 'FINAL', parsedPayload.memberId, {
        '手続種別': '職員除籍（管理者操作）',
        '申請ID': '',
        '変更内容': '管理画面から職員を除籍しました。',
        '異常内容': '',
      });
      return JSON.stringify({ success: true, data: removeStaffResult });
    }

    if (action === 'getAdminPersonList') {
      return JSON.stringify({ success: true, data: getAdminPersonList_() });
    }

    if (action === 'updatePersonsBatch') {
      return JSON.stringify({ success: true, data: updatePersonsBatch_(parsedPayload) });
    }

    if (action === 'convertMemberType') {
      return JSON.stringify({ success: true, data: convertMemberType_(parsedPayload) });
    }

    // 2026-10-31: 移行の応答が失われたときの照会（読むだけ・docs/316 §6）
    if (action === 'getMemberConversionResult') {
      return JSON.stringify({ success: true, data: getMemberConversionResult_(parsedPayload) });
    }

    if (action === 'scheduleWithdrawMember') {
      return JSON.stringify({ success: true, data: scheduleWithdrawMember_(parsedPayload) });
    }

    if (action === 'cancelScheduledWithdraw') {
      return JSON.stringify({ success: true, data: cancelScheduledWithdraw_(parsedPayload) });
    }

    if (action === 'updateStaff') {
      var updateStaffResult = updateStaff_(parsedPayload);
      // memberId は更新済み職員レコードから確定した値を使う。呼出しpayloadの任意項目に依存しない。
      notifyMembershipChatForMember_(getOrCreateDatabase_(), 'FINAL', updateStaffResult.memberId, {
        '手続種別': '職員情報変更（管理者操作）',
        '申請ID': '',
        '変更内容': '管理画面から職員情報が更新されました。',
        '異常内容': '',
      });
      return JSON.stringify({ success: true, data: updateStaffResult });
    }

    if (action === 'submitMemberApplication') {
      return JSON.stringify({ success: true, data: submitMemberApplication_(parsedPayload) });
    }

    if (action === 'getDbInfo') {
      return JSON.stringify({ success: true, data: getDbInfo_() });
    }

    if (action === 'updateMemberSelf') {
      return JSON.stringify({ success: true, data: updateMemberSelfByPrincipal_(parsedPayload) });
    }

    if (action === 'changePassword') {
      return JSON.stringify({ success: true, data: changePassword_(parsedPayload) });
    }

    if (action === 'getMemberAuthAccounts') {
      return JSON.stringify({ success: true, data: getMemberAuthAccounts_(parsedPayload) });
    }

    if (action === 'adminUnlockMemberAccount') {
    return JSON.stringify({ success: true, data: adminUnlockMemberAccount_(parsedPayload) });
  }
  if (action === 'adminResetMemberPassword') {
      return JSON.stringify({ success: true, data: adminResetMemberPassword_(parsedPayload) });
    }

    if (action === 'adminIssueMemberCredential') {
      return JSON.stringify({ success: true, data: adminIssueMemberCredential_(parsedPayload) });
    }

    if (action === 'requestPasswordReset') {
      return JSON.stringify({ success: true, data: requestPasswordReset_(parsedPayload) });
    }

    if (action === 'completePasswordReset') {
      return JSON.stringify({ success: true, data: completePasswordReset_(parsedPayload) });
    }

    if (action === 'memberLogin') {
      return JSON.stringify({ success: true, data: memberLogin_(parsedPayload) });
    }

    if (action === 'checkAdminBySession') {
      var adminLogin = checkAdminBySession_({ recordLogin: true });
      // マスタの選択肢・名称はログインの応答で渡す（getSystemSettings は MASTER/ADMIN だけなので、研修管理者などに届かない）。
      // セッションのオブジェクトは書き換えない（キャッシュされ、他の API の認可にも使われる）
      var adminLoginData = adminLogin && typeof adminLogin === 'object'
        ? Object.assign({}, adminLogin, { masters: masterOptionsForClient_(null, 'ADMIN') })
        : adminLogin;
      return JSON.stringify({ success: true, data: adminLoginData });
    }

    // 2026-11-15 docs/332 §13・データ・IF §5.6: doGet の埋め込みで描いた後に 1 回だけ。ログイン成功を記録し、
    // 版（knownInitVersion）が変わっていたときだけ初期データを返す。入力はほかに受け取らない
    if (action === 'refreshAdminBoot') {
      var refreshStartedAt = Date.now();
      var refreshSession = checkAdminBySession_({ recordLogin: true });
      var refreshReport = {};
      var refreshData = buildAdminBootRefresh_(refreshSession, String(parsedPayload.knownInitVersion || ''), refreshReport);
      // 常時計測（docs/332 §13.11）: 取り直しの時間・送ったか・作り直したもの・画面の計時（個人を特定する値は入れない）
      perfLog_(refreshReport.props || null, 'admin.refresh', {
        ms: Date.now() - refreshStartedAt,
        initSent: !!refreshData.init,
        initUnchanged: !!refreshData.initUnchanged,
        rebuilt: refreshReport.rebuilt || [],
        renderedMs: sanitizePerfMs_(parsedPayload.renderedMs),
      });
      return JSON.stringify({ success: true, data: refreshData });
    }

    if (action === 'getSystemSettings') {
      return JSON.stringify({ success: true, data: getSystemSettingsForDisplay_() });
    }

    if (action === 'checkSystemSettingsPatch') {
      var checkSettingsPermLevel = parsedPayload.__adminSession
        ? String(parsedPayload.__adminSession.adminPermissionLevel || 'ADMIN')
        : 'ADMIN';
      return JSON.stringify({ success: true, data: checkSystemSettingsPatch_(parsedPayload, checkSettingsPermLevel) });
    }

    if (action === 'updateSystemSettings') {
      var settingsPermLevel = parsedPayload.__adminSession
        ? String(parsedPayload.__adminSession.adminPermissionLevel || 'ADMIN')
        : 'ADMIN';
      return JSON.stringify({ success: true, data: updateSystemSettings_(parsedPayload, settingsPermLevel) });
    }
    // 2026-10-25 docs/313: 公開ポータルの案内文の定型文
    if (action === 'saveScreenTextTemplate') {
      return JSON.stringify({ success: true, data: saveScreenTextTemplate_(parsedPayload) });
    }
    if (action === 'deleteScreenTextTemplate') {
      return JSON.stringify({ success: true, data: deleteScreenTextTemplate_(parsedPayload) });
    }

    if (action === 'getAdminPermissionData') {
      return JSON.stringify({ success: true, data: getAdminPermissionData_(parsedPayload.__adminSession) });
    }

    if (action === 'saveAdminPermission') {
      return JSON.stringify({ success: true, data: saveAdminPermission_(parsedPayload) });
    }

    if (action === 'deleteAdminPermission') {
      return JSON.stringify({ success: true, data: deleteAdminPermission_(parsedPayload) });
    }

    // docs/246 Phase 2-A: ロール CRUD
    if (action === 'listRoles') {
      return JSON.stringify({ success: true, data: listRoles_(parsedPayload) });
    }
    if (action === 'saveRole') {
      return JSON.stringify({ success: true, data: saveRole_(parsedPayload) });
    }
    if (action === 'deleteRole') {
      return JSON.stringify({ success: true, data: deleteRole_(parsedPayload) });
    }
    if (action === 'duplicateRole') {
      return JSON.stringify({ success: true, data: duplicateRole_(parsedPayload) });
    }

    if (action === 'getAnnualFeeAdminData') {
      return JSON.stringify({ success: true, data: getAnnualFeeAdminData_(parsedPayload) });
    }

    if (action === 'saveAnnualFeeRecord') {
      return JSON.stringify({ success: true, data: saveAnnualFeeRecord_(parsedPayload) });
    }

    if (action === 'saveAnnualFeeRecordsBatch') {
      return JSON.stringify({ success: true, data: saveAnnualFeeRecordsBatch_(parsedPayload) });
    }

    if (action === 'getSharedMemo') {
      return JSON.stringify({ success: true, data: getSharedMemo_(parsedPayload) });
    }

    if (action === 'saveSharedMemo') {
      return JSON.stringify({ success: true, data: saveSharedMemo_(parsedPayload) });
    }

    // v373.7 (S5 Phase 2): 旧 v316 RosterTemplate dispatcher 撤去
    // v372: 名簿出力 全面刷新（Visual Template Designer）
    if (action === 'getRosterFieldDictionary') {
      return JSON.stringify({ success: true, data: getRosterFieldDictionary_(getOrCreateDatabase_()) });
    }
    if (action === 'getRosterDesignerData') {
      return JSON.stringify({ success: true, data: getRosterDesignerData_(parsedPayload) });
    }
    if (action === 'loadRosterTemplatesV2') {
      return JSON.stringify({ success: true, data: loadRosterTemplatesV2_() });
    }
    if (action === 'saveRosterTemplateV2') {
      return JSON.stringify({ success: true, data: saveRosterTemplateV2_(parsedPayload) });
    }
    if (action === 'deleteRosterTemplateV2') {
      return JSON.stringify({ success: true, data: deleteRosterTemplateV2_(parsedPayload) });
    }
    if (action === 'duplicateRosterTemplateV2') {
      return JSON.stringify({ success: true, data: duplicateRosterTemplateV2_(parsedPayload) });
    }

    // v374.1: 公式LINE投稿依頼
    if (action === 'listLinePostRequests') {
      return JSON.stringify({ success: true, data: listLinePostRequests_(parsedPayload) });
    }
    if (action === 'getLinePostRequest') {
      return JSON.stringify({ success: true, data: getLinePostRequest_(parsedPayload) });
    }
    if (action === 'saveLinePostRequest') {
      return JSON.stringify({ success: true, data: saveLinePostRequest_(parsedPayload) });
    }
    if (action === 'uploadLinePostAttachment') {
      return JSON.stringify({ success: true, data: uploadLinePostAttachment_(parsedPayload) });
    }
    if (action === 'transitionLinePostRequest') {
      return JSON.stringify({ success: true, data: transitionLinePostRequest_(parsedPayload) });
    }
    if (action === 'deleteLinePostRequest') {
      return JSON.stringify({ success: true, data: deleteLinePostRequest_(parsedPayload) });
    }

    if (action === 'sendTrainingReminder') {
      return JSON.stringify({ success: true, data: sendTrainingReminder_(parsedPayload) });
    }

    if (action === 'seedDemoData') {
      return JSON.stringify({ success: true, data: seedDemoData() });
    }

    if (action === 'saveTraining') {
      try {
        var saveResult = saveTraining_(parsedPayload);
        return JSON.stringify({ success: true, data: saveResult });
      } catch (saveErr) {
        Logger.log('[saveTraining error] ' + (saveErr && saveErr.message ? saveErr.message : String(saveErr)));
        return JSON.stringify({ success: false, error: saveErr && saveErr.message ? saveErr.message : String(saveErr) });
      }
    }

    // v376.7: 研修 soft delete / restore
    if (action === 'softDeleteTraining') {
      try {
        assertTrainingDeleteAllowed_(parsedPayload.__adminSession);
        return JSON.stringify({ success: true, data: softDeleteTraining_(parsedPayload) });
      } catch (delErr) {
        return JSON.stringify({ success: false, error: delErr && delErr.message ? delErr.message : String(delErr) });
      }
    }
    if (action === 'restoreTraining') {
      try {
        assertTrainingDeleteAllowed_(parsedPayload.__adminSession);
        return JSON.stringify({ success: true, data: restoreTraining_(parsedPayload) });
      } catch (resErr) {
        return JSON.stringify({ success: false, error: resErr && resErr.message ? resErr.message : String(resErr) });
      }
    }

    if (action === 'uploadTrainingFile') {
      return JSON.stringify({ success: true, data: uploadTrainingFile_(parsedPayload) });
    }

    if (action === 'regenerateThumbnailForTraining') {
      return JSON.stringify({ success: true, data: regenerateThumbnailForTraining_(parsedPayload) });
    }

    if (action === 'setupTrainingFileFolder') {
      return JSON.stringify({ success: true, data: setupTrainingFileFolder_(parsedPayload) });
    }

    if (action === 'applyTraining') {
      return JSON.stringify({ success: true, data: applyTraining_(parsedPayload) });
    }

    if (action === 'cancelTraining') {
      return JSON.stringify({ success: true, data: cancelTraining_(parsedPayload) });
    }

    if (action === 'getPublicTrainings') {
      return getPublicTrainings_();
    }

    if (action === 'getFileThumbnail') {
      return JSON.stringify({ success: true, data: getFileThumbnail_(parsedPayload) });
    }

    if (action === 'getPublicPortalSettings') {
      return getPublicPortalSettingsForDisplay_();
    }

    if (action === 'applyTrainingExternal') {
      return applyTrainingExternal_(parsedPayload);
    }

    if (action === 'cancelTrainingExternal') {
      return cancelTrainingExternal_(parsedPayload);
    }

    // v260: 公開ポータル OTP
    if (action === 'sendPublicOtp') {
      return JSON.stringify({ success: true, data: sendPublicOtp_(parsedPayload) });
    }

    if (action === 'verifyPublicOtp') {
      return JSON.stringify({ success: true, data: verifyPublicOtp_(parsedPayload) });
    }

    // v264: OTPなし本人確認フロー
    if (action === 'verifyMemberIdentityForPublic') {
      return JSON.stringify({ success: true, data: verifyMemberIdentityForPublic_(parsedPayload) });
    }
    if (action === 'submitPublicChangeRequest') {
      return JSON.stringify({ success: true, data: submitPublicChangeRequest_(parsedPayload) });
    }
    if (action === 'checkPublicStaffMatch') {
      return JSON.stringify({ success: true, data: checkPublicStaffMatch_(parsedPayload) });
    }
    if (action === 'getAdminChangeRequests') {
      return JSON.stringify({ success: true, data: getAdminChangeRequests_(parsedPayload) });
    }
    if (action === 'approveAdminChangeRequest') {
      // v367: inner が {success:false, error:...} を返した場合は outer に伝播し
      // client 側で正しく失敗として扱えるようにする（旧: 常に success:true で包んでいた）
      var approveResult = withChangeRequestDecisionLock_(function() { return approveAdminChangeRequest_(parsedPayload); });
      if (approveResult && approveResult.success === false) {
        return JSON.stringify({ success: false, error: approveResult.error || 'approve failed' });
      }
      return JSON.stringify({ success: true, data: approveResult });
    }
    if (action === 'rejectAdminChangeRequest') {
      var rejectResult = withChangeRequestDecisionLock_(function() { return rejectAdminChangeRequest_(parsedPayload); });
      if (rejectResult && rejectResult.success === false) {
        return JSON.stringify({ success: false, error: rejectResult.error || 'reject failed' });
      }
      return JSON.stringify({ success: true, data: rejectResult });
    }

    if (action === 'getTrainingApplicants') {
      return getTrainingApplicants_(parsedPayload);
    }

    if (action === 'getAdminEmailAliases') {
      return getAdminEmailAliases_();
    }

    if (action === 'sendTrainingMail') {
      return sendTrainingMail_(parsedPayload);
    }

    // ── v360: 研修名簿・出欠・受講履歴・一括メール明細 ───────────────
    if (action === 'getTrainingRosterDetail') {
      return JSON.stringify({ success: true, data: getTrainingRosterDetail_(parsedPayload) });
    }
    if (action === 'saveAttendance') {
      return JSON.stringify({ success: true, data: saveAttendance_(parsedPayload) });
    }
    if (action === 'saveAttendanceBatch') {
      return JSON.stringify({ success: true, data: saveAttendanceBatch_(parsedPayload) });
    }
    if (action === 'addRosterEntry') {
      return JSON.stringify({ success: true, data: addRosterEntry_(parsedPayload) });
    }
    if (action === 'addGuestRosterEntry') {
      return JSON.stringify({ success: true, data: addGuestRosterEntry_(parsedPayload) });
    }
    if (action === 'cancelRosterEntry') {
      return JSON.stringify({ success: true, data: cancelRosterEntry_(parsedPayload) });
    }
    if (action === 'updateRosterEntry') {
      return JSON.stringify({ success: true, data: updateRosterEntry_(parsedPayload) });
    }
    if (action === 'getTrainingStats') {
      return JSON.stringify({ success: true, data: getTrainingStats_(parsedPayload) });
    }

    // v188: Gemini AI案内メール生成（APIキーはScriptPropertiesで管理、フロントに露出しない）
    if (action === 'generateTrainingEmail') {
      return JSON.stringify({ success: true, data: generateTrainingEmailWithAI_(parsedPayload) });
    }

    // v373.7 (S5 Phase 2): 旧 PDF 名簿出力 dispatcher 群撤去（v194 getMembersForRoster /
    // v205 initRosterExport / processRosterChunk / finalizeRosterExport / cleanupRosterExport /
    // validateTemplateSpreadsheet）。新 Visual Template Designer に統合済み。

    // v194: 会員一括メール送信
    if (action === 'getMembersForBulkMail') {
      return JSON.stringify({ success: true, data: getMembersForBulkMail_(parsedPayload) });
    }

    if (action === 'sendBulkMemberMail') {
      return JSON.stringify({ success: true, data: sendBulkMemberMail_(parsedPayload) });
    }

    if (action === 'getEmailSendLog') {
      return JSON.stringify({ success: true, data: getEmailSendLog_(parsedPayload) });
    }

    // v219: 入会メール テンプレート管理
    if (action === 'getCredentialEmailTemplates') {
      return JSON.stringify({ success: true, data: getCredentialEmailTemplates_() });
    }
    if (action === 'saveCredentialEmailTemplate') {
      return JSON.stringify({ success: true, data: saveCredentialEmailTemplate_(parsedPayload) });
    }
    if (action === 'deleteCredentialEmailTemplate') {
      return JSON.stringify({ success: true, data: deleteCredentialEmailTemplate_(parsedPayload) });
    }

    // v376.42: 全メール種別 テンプレート管理（汎用・カテゴリ別）
    // v376.68: 汎用データエクスポート（CSV）
    if (action === 'listExportableTables') {
      return JSON.stringify({ success: true, data: listExportableTables_(parsedPayload.__adminSession) });
    }
    if (action === 'exportTableCsv') {
      return JSON.stringify({ success: true, data: exportTableCsv_(parsedPayload, parsedPayload.__adminSession) });
    }

    // v376.65（案C Phase 1）: 規程・重要事項マスタ CRUD
    if (action === 'listRegulations') {
      return JSON.stringify({ success: true, data: listRegulations_(null, false) });
    }
    if (action === 'saveRegulationsBatch') {
    return JSON.stringify({ success: true, data: saveRegulationsBatch_(parsedPayload, parsedPayload.__adminSession ? parsedPayload.__adminSession.loginId : '') });
  }
  if (action === 'saveRegulation') {
      return JSON.stringify({ success: true, data: saveRegulation_(parsedPayload, parsedPayload.__adminSession ? parsedPayload.__adminSession.loginId : '') });
    }
    if (action === 'deleteRegulation') {
      return JSON.stringify({ success: true, data: deleteRegulation_(parsedPayload, parsedPayload.__adminSession ? parsedPayload.__adminSession.loginId : '') });
    }
    if (action === 'listMailTemplates') {
      return JSON.stringify({ success: true, data: listMailTemplates_(parsedPayload) });
    }
    if (action === 'saveMailTemplate') {
      return JSON.stringify({ success: true, data: saveMailTemplate_(parsedPayload) });
    }
    if (action === 'deleteMailTemplate') {
      return JSON.stringify({ success: true, data: deleteMailTemplate_(parsedPayload) });
    }

    // v224: 一括メール テンプレート管理
    if (action === 'getBulkMailTemplates') {
      return JSON.stringify({ success: true, data: getBulkMailTemplates_() });
    }
    if (action === 'saveBulkMailTemplate') {
      return JSON.stringify({ success: true, data: saveBulkMailTemplate_(parsedPayload) });
    }
    if (action === 'deleteBulkMailTemplate') {
      return JSON.stringify({ success: true, data: deleteBulkMailTemplate_(parsedPayload) });
    }

    // v207: 宛名リスト Excel 出力
    if (action === 'getMailingListTargets') {
      return JSON.stringify({ success: true, data: getMailingListTargets_(parsedPayload) });
    }
    if (action === 'generateMailingListExcel') {
      return JSON.stringify({ success: true, data: generateMailingListExcel_(parsedPayload) });
    }

    // v295: 役員管理マスタ
    if (action === 'getOfficerMasterData') {
      return JSON.stringify({ success: true, data: getOfficerMasterData_() });
    }
    if (action === 'saveOrganization') {
      return JSON.stringify({ success: true, data: saveOrganization_(parsedPayload) });
    }
    if (action === 'deleteOrganization') {
      return JSON.stringify({ success: true, data: deleteOrganization_(parsedPayload) });
    }
    if (action === 'saveOfficerRole') {
      return JSON.stringify({ success: true, data: saveOfficerRole_(parsedPayload) });
    }
    if (action === 'deleteOfficerRole') {
      return JSON.stringify({ success: true, data: deleteOfficerRole_(parsedPayload) });
    }
    if (action === 'savePaymentType') {
      return JSON.stringify({ success: true, data: savePaymentType_(parsedPayload) });
    }
    if (action === 'deletePaymentType') {
      return JSON.stringify({ success: true, data: deletePaymentType_(parsedPayload) });
    }
    if (action === 'saveWorkCategory') {
      return JSON.stringify({ success: true, data: saveWorkCategory_(parsedPayload) });
    }
    if (action === 'deleteWorkCategory') {
      return JSON.stringify({ success: true, data: deleteWorkCategory_(parsedPayload) });
    }
    // v295: 役員割当て管理
    if (action === 'getOfficerManagementData') {
      return JSON.stringify({ success: true, data: getOfficerManagementData_() });
    }
    if (action === 'assignOfficer') {
      return JSON.stringify({ success: true, data: assignOfficer_(parsedPayload) });
    }
    if (action === 'resignOfficer') {
      return JSON.stringify({ success: true, data: resignOfficer_(parsedPayload) });
    }
    if (action === 'updateOfficerLinkage') {
      return JSON.stringify({ success: true, data: updateOfficerLinkage_(parsedPayload) });
    }
    if (action === 'updateOfficerRecord') {
      return JSON.stringify({ success: true, data: updateOfficerRecord_(parsedPayload) });
    }
    // v295: 振込口座管理（管理者用）
    if (action === 'getAdminBankAccount') {
      return JSON.stringify({ success: true, data: getBankAccount_(parsedPayload) });
    }
    if (action === 'saveAdminBankAccount') {
      return JSON.stringify({ success: true, data: saveBankAccount_(parsedPayload) });
    }
    if (action === 'deleteAdminBankAccount') {
      return JSON.stringify({ success: true, data: deleteBankAccount_(parsedPayload) });
    }
    // v295: 支払い履歴管理
    if (action === 'getPaymentHistory') {
      return JSON.stringify({ success: true, data: getPaymentHistory_(parsedPayload) });
    }
    if (action === 'savePayment') {
      return JSON.stringify({ success: true, data: savePayment_(parsedPayload) });
    }
    if (action === 'deletePayment') {
      return JSON.stringify({ success: true, data: deletePayment_(parsedPayload) });
    }
    // v296: 請求管理（管理者）
    if (action === 'getClaims') {
      return JSON.stringify({ success: true, data: getClaims_(parsedPayload) });
    }
    if (action === 'approveClaim') {
      return JSON.stringify({ success: true, data: approveClaim_(parsedPayload) });
    }
    if (action === 'rejectClaim') {
      return JSON.stringify({ success: true, data: rejectClaim_(parsedPayload) });
    }
    if (action === 'adminDeleteClaim') {
      return JSON.stringify({ success: true, data: adminDeleteClaim_(parsedPayload) });
    }

    // v232: 物理削除（MASTER専用）
    if (action === 'searchMembersForDelete') {
      return JSON.stringify({ success: true, data: searchMembersForDelete_(parsedPayload) });
    }
    if (action === 'previewDeleteMember') {
      return JSON.stringify({ success: true, data: previewDeleteMember_(parsedPayload) });
    }
    if (action === 'executeDeleteMember') {
      return JSON.stringify({ success: true, data: executeDeleteMember_(parsedPayload) });
    }
    if (action === 'getDeleteLogs') {
      return JSON.stringify({ success: true, data: getDeleteLogs_(parsedPayload) });
    }
    if (action === 'repairDuplicateStaffRecords') {
      return JSON.stringify({ success: true, data: repairDuplicateStaffRecords_() });
    }
    if (action === 'repairTrainingApplicationApplicantIds') {
      return JSON.stringify({ success: true, data: repairTrainingApplicationApplicantIds_() });
    }
    if (action === 'repairMemberCareManagerDuplicates') {
      return JSON.stringify({ success: true, data: repairMemberCareManagerDuplicates_() });
    }
    if (action === 'backupMigrationTargets') {
      return JSON.stringify({ success: true, data: backupMigrationTargets_() });
    }

    // ── 会員セルフサービス（管理者認証不要・パスワード再認証必須）──
    if (action === 'withdrawSelf') {
      return JSON.stringify({ success: true, data: withdrawSelfByPrincipal_(parsedPayload) });
    }

    if (action === 'cancelWithdrawalSelf') {
      return JSON.stringify({ success: true, data: cancelWithdrawalSelfByPrincipal_(parsedPayload) });
    }

    // 2026-10-13: 許可リストにあるのに処理の分岐が無い action を「成功」と返していた。失敗として返す。
    return JSON.stringify({ success: false, error: '未実装アクションです: ' + action });
  } catch (error) {
    Logger.log('[processApiRequest catch] action=' + action + ' error=' + (error && error.message ? error.message : String(error)));
    return JSON.stringify({
      success: false,
      error: error && error.message ? error.message : String(error),
    });
  } finally {
    flushApiProfile_(action);
  }
}
