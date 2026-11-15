// gas-src/50_public_portal.gs — 公開ポータル（設定・研修・本人確認・変更申請の受付）。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

var PUBLIC_PORTAL_DEFAULTS = {
  // 2026-10-02: プライバシーポリシーの掲載先。**既定は空**にする。
  // URL は外部サイト（Google Sites）にあり移動しうるので、コードではなくデータで持つ。
  // 空のときは画面にリンクを出さない（押せるのにどこへも飛ばない状態を作らない）。
  // 定款の掲載先が変わってリンクが古くなった件（T_規程 REG-005）と同じ轍を踏まないため。
  privacyPolicyUrl: '',
  heroBadgeEnabled: false,
  heroBadgeLabel: 'お申込みポータル',
  heroTitle: '研修申込・申込取消・新規入会申込を受け付けています',
  heroDescriptionEnabled: false,
  heroDescription: 'ご希望の手続きを選択し、そのまま申込画面へ進んでください。',
  membershipBadgeEnabled: true,
  membershipBadgeLabel: '入会申込',
  membershipTitleEnabled: true,
  membershipTitle: '新規入会を申し込む',
  membershipDescriptionEnabled: true,
  membershipDescription: '個人会員・事業所会員・賛助会員の入会申込を受け付けています。',
  membershipCtaLabel: '入会申込へ進む',
  completionGuidanceVisible: true,
  completionGuidanceBodyWhenCredentialSent: [
    '申込内容を事務局で確認し、承認後にログイン情報をご登録のメールアドレスへお送りします。',
    '年会費や振込先などのご案内は、登録メールアドレスをご確認ください。',
    '追加確認が必要な場合のみ、事務局からご連絡します。'
  ].join('\n'),
  completionGuidanceBodyWhenCredentialNotSent: [
    'ログイン情報メールは現在送信していません。会員ページの公開準備後にご案内します。',
    '年会費や振込先などのご案内は、登録メールアドレスをご確認ください。',
    '追加確認が必要な場合のみ、事務局からご連絡します。'
  ].join('\n'),
  completionLoginInfoBlockVisible: true,
  completionLoginInfoVisible: true,
  completionLoginInfoBodyWhenCredentialSent: 'ログイン情報は画面に表示していません。登録済みのメールをご確認ください。',
  completionLoginInfoBodyWhenCredentialNotSent: 'ログイン情報メールは現在送信していません。公開準備後にご案内します。',
  completionNoCredentialNotice: 'ログイン情報メールは現在送信していません。会員ページの公開準備後にご案内します。',
  completionCredentialNotice: '申込内容を事務局で確認し、承認後にログイン情報をご登録のメールアドレスへお送りします。',
  trainingBadgeEnabled: true,
  trainingBadgeLabel: '研修申込',
  trainingTitleEnabled: true,
  trainingTitle: '研修を申し込む',
  trainingDescriptionEnabled: true,
  trainingDescription: '受付中の研修一覧を確認し、そのまま申込できます。申込後の取消も研修ページから行えます。',
  trainingCtaLabel: '進む',
  memberUpdateMenuEnabled: true,
  memberUpdateBadgeEnabled: true,
  memberUpdateBadgeLabel: '登録情報変更',
  memberUpdateTitleEnabled: true,
  memberUpdateTitle: '会員登録情報を変更する',
  memberUpdateDescriptionEnabled: true,
  memberUpdateDescription: '住所・電話番号・メールアドレスなど、ご登録情報の変更を申し込めます。会員種別ごとに、氏名または事業所名と、番号または電話番号でご本人確認を行います。',
  memberUpdateCtaLabel: '変更手続きへ進む',
  withdrawalMenuEnabled: true,
  withdrawalBadgeEnabled: true,
  withdrawalBadgeLabel: '退会',
  withdrawalTitleEnabled: true,
  withdrawalTitle: '退会を申し込む',
  withdrawalDescriptionEnabled: true,
  withdrawalDescription: '退会申請を行います。年度末退会または即時退会を選択できます。会員種別ごとに、氏名または事業所名と、番号または電話番号でご本人確認を行います。',
  withdrawalCtaLabel: '退会手続きへ進む',
};
// 2026-10-25 docs/313: 上の文面は初期データ（新しく DB を作るとき・移し替え）にだけ使う。読むときに補わない。

// 2026-10-25 docs/313: 案内文（長い文章）は T_画面文テンプレート から選ぶ。設定には選んだ定型文の ID だけを持つ。
// legacyKey は v376.134 までの本文の設定キー。移し替えの元にだけ使い、書き換えない（前の版へ戻したとき、旧いコードが本文として読む）。
// legacyNoticeKey は、旧い本文が空のときの補完に使っていた 1 行目（設定画面には出ていなかった）。
var SCREEN_TEXT_TEMPLATE_PURPOSES_ = [
  { code: 'COMPLETION_GUIDANCE_SENT', label: '今後のご案内（ログイン情報メールを送る設定のとき）',
    settingKey: 'PUBLIC_PORTAL_COMPLETION_GUIDANCE_TEMPLATE_ID_WHEN_CREDENTIAL_SENT',
    requestKey: 'publicPortalCompletionGuidanceTemplateIdWhenCredentialSent',
    bodyField: 'publicPortalCompletionGuidanceBodyWhenCredentialSent', publicField: 'completionGuidanceBodyWhenCredentialSent',
    legacyKey: 'PUBLIC_PORTAL_COMPLETION_GUIDANCE_BODY_WHEN_CREDENTIAL_SENT',
    legacyNoticeKey: 'PUBLIC_PORTAL_COMPLETION_CREDENTIAL_NOTICE', defaultKey: 'completionGuidanceBodyWhenCredentialSent' },
  { code: 'COMPLETION_GUIDANCE_NOT_SENT', label: '今後のご案内（ログイン情報メールを送らない設定のとき）',
    settingKey: 'PUBLIC_PORTAL_COMPLETION_GUIDANCE_TEMPLATE_ID_WHEN_CREDENTIAL_NOT_SENT',
    requestKey: 'publicPortalCompletionGuidanceTemplateIdWhenCredentialNotSent',
    bodyField: 'publicPortalCompletionGuidanceBodyWhenCredentialNotSent', publicField: 'completionGuidanceBodyWhenCredentialNotSent',
    legacyKey: 'PUBLIC_PORTAL_COMPLETION_GUIDANCE_BODY_WHEN_CREDENTIAL_NOT_SENT',
    legacyNoticeKey: 'PUBLIC_PORTAL_COMPLETION_NO_CREDENTIAL_NOTICE', defaultKey: 'completionGuidanceBodyWhenCredentialNotSent' },
  { code: 'COMPLETION_LOGIN_INFO_SENT', label: 'ログイン情報の補足（ログイン情報メールを送る設定のとき）',
    settingKey: 'PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_TEMPLATE_ID_WHEN_CREDENTIAL_SENT',
    requestKey: 'publicPortalCompletionLoginInfoTemplateIdWhenCredentialSent',
    bodyField: 'publicPortalCompletionLoginInfoBodyWhenCredentialSent', publicField: 'completionLoginInfoBodyWhenCredentialSent',
    legacyKey: 'PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BODY_WHEN_CREDENTIAL_SENT',
    legacyNoticeKey: '', defaultKey: 'completionLoginInfoBodyWhenCredentialSent' },
  { code: 'COMPLETION_LOGIN_INFO_NOT_SENT', label: 'ログイン情報の補足（ログイン情報メールを送らない設定のとき）',
    settingKey: 'PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_TEMPLATE_ID_WHEN_CREDENTIAL_NOT_SENT',
    requestKey: 'publicPortalCompletionLoginInfoTemplateIdWhenCredentialNotSent',
    bodyField: 'publicPortalCompletionLoginInfoBodyWhenCredentialNotSent', publicField: 'completionLoginInfoBodyWhenCredentialNotSent',
    legacyKey: 'PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BODY_WHEN_CREDENTIAL_NOT_SENT',
    legacyNoticeKey: '', defaultKey: 'completionLoginInfoBodyWhenCredentialNotSent' },
];

// 2026-10-25 docs/313: 見出し・説明・ボタン名。空欄では保存できない（読むときに補わない）。
// toggle は「表示する」の切り替えがあるか（トップの見出しとボタン名には無い）。description は設定の行の説明。
var PUBLIC_PORTAL_REQUIRED_TEXTS_ = [
  { key: 'PUBLIC_PORTAL_HERO_BADGE_LABEL', requestKey: 'publicPortalHeroBadgeLabel', defaultKey: 'heroBadgeLabel', label: 'トップの補助ラベル', toggle: true, description: '公開ポータル：トップ補助ラベル文言' },
  { key: 'PUBLIC_PORTAL_HERO_TITLE', requestKey: 'publicPortalHeroTitle', defaultKey: 'heroTitle', label: 'トップの見出し', toggle: false, description: '公開ポータル：トップ見出し' },
  { key: 'PUBLIC_PORTAL_HERO_DESCRIPTION', requestKey: 'publicPortalHeroDescription', defaultKey: 'heroDescription', label: 'トップの説明文', toggle: true, description: '公開ポータル：トップ説明文' },
  { key: 'PUBLIC_PORTAL_MEMBERSHIP_BADGE_LABEL', requestKey: 'publicPortalMembershipBadgeLabel', defaultKey: 'membershipBadgeLabel', label: '入会カードの補助ラベル', toggle: true, description: '公開ポータル：入会カード補助ラベル文言' },
  { key: 'PUBLIC_PORTAL_MEMBERSHIP_TITLE', requestKey: 'publicPortalMembershipTitle', defaultKey: 'membershipTitle', label: '入会カードの見出し', toggle: true, description: '公開ポータル：入会カード見出し' },
  { key: 'PUBLIC_PORTAL_MEMBERSHIP_DESCRIPTION', requestKey: 'publicPortalMembershipDescription', defaultKey: 'membershipDescription', label: '入会カードの説明文', toggle: true, description: '公開ポータル：入会カード説明文' },
  { key: 'PUBLIC_PORTAL_MEMBERSHIP_CTA_LABEL', requestKey: 'publicPortalMembershipCtaLabel', defaultKey: 'membershipCtaLabel', label: '入会カードのボタン名', toggle: false, description: '公開ポータル：入会カードボタン文言' },
  { key: 'PUBLIC_PORTAL_TRAINING_BADGE_LABEL', requestKey: 'publicPortalTrainingBadgeLabel', defaultKey: 'trainingBadgeLabel', label: '研修カードの補助ラベル', toggle: true, description: '公開ポータル：研修カード補助ラベル文言' },
  { key: 'PUBLIC_PORTAL_TRAINING_TITLE', requestKey: 'publicPortalTrainingTitle', defaultKey: 'trainingTitle', label: '研修カードの見出し', toggle: true, description: '公開ポータル：研修カード見出し' },
  { key: 'PUBLIC_PORTAL_TRAINING_DESCRIPTION', requestKey: 'publicPortalTrainingDescription', defaultKey: 'trainingDescription', label: '研修カードの説明文', toggle: true, description: '公開ポータル：研修カード説明文' },
  { key: 'PUBLIC_PORTAL_TRAINING_CTA_LABEL', requestKey: 'publicPortalTrainingCtaLabel', defaultKey: 'trainingCtaLabel', label: '研修カードのボタン名', toggle: false, description: '公開ポータル：研修カードボタン文言' },
  { key: 'PUBLIC_PORTAL_MEMBER_UPDATE_BADGE_LABEL', requestKey: 'publicPortalMemberUpdateBadgeLabel', defaultKey: 'memberUpdateBadgeLabel', label: '登録情報変更カードの補助ラベル', toggle: true, description: '公開ポータル：登録情報変更カード補助ラベル文言' },
  { key: 'PUBLIC_PORTAL_MEMBER_UPDATE_TITLE', requestKey: 'publicPortalMemberUpdateTitle', defaultKey: 'memberUpdateTitle', label: '登録情報変更カードの見出し', toggle: true, description: '公開ポータル：登録情報変更カード見出し' },
  { key: 'PUBLIC_PORTAL_MEMBER_UPDATE_DESCRIPTION', requestKey: 'publicPortalMemberUpdateDescription', defaultKey: 'memberUpdateDescription', label: '登録情報変更カードの説明文', toggle: true, description: '公開ポータル：登録情報変更カード説明文' },
  { key: 'PUBLIC_PORTAL_MEMBER_UPDATE_CTA_LABEL', requestKey: 'publicPortalMemberUpdateCtaLabel', defaultKey: 'memberUpdateCtaLabel', label: '登録情報変更カードのボタン名', toggle: false, description: '公開ポータル：登録情報変更カードボタン文言' },
  { key: 'PUBLIC_PORTAL_WITHDRAWAL_BADGE_LABEL', requestKey: 'publicPortalWithdrawalBadgeLabel', defaultKey: 'withdrawalBadgeLabel', label: '退会カードの補助ラベル', toggle: true, description: '公開ポータル：退会カード補助ラベル文言' },
  { key: 'PUBLIC_PORTAL_WITHDRAWAL_TITLE', requestKey: 'publicPortalWithdrawalTitle', defaultKey: 'withdrawalTitle', label: '退会カードの見出し', toggle: true, description: '公開ポータル：退会カード見出し' },
  { key: 'PUBLIC_PORTAL_WITHDRAWAL_DESCRIPTION', requestKey: 'publicPortalWithdrawalDescription', defaultKey: 'withdrawalDescription', label: '退会カードの説明文', toggle: true, description: '公開ポータル：退会カード説明文' },
  { key: 'PUBLIC_PORTAL_WITHDRAWAL_CTA_LABEL', requestKey: 'publicPortalWithdrawalCtaLabel', defaultKey: 'withdrawalCtaLabel', label: '退会カードのボタン名', toggle: false, description: '公開ポータル：退会カードボタン文言' },
];

// 設定の保存: 送られてきた見出しなどを確かめて、保存する行にする。空欄はまとめて 1 回で知らせる（1 項目ずつ直させない）。
function collectRequiredPublicPortalTexts_(request) {
  var updates = [];
  var blank = [];
  PUBLIC_PORTAL_REQUIRED_TEXTS_.forEach(function(item) {
    if (request[item.requestKey] == null) return;
    var text = String(request[item.requestKey]).trim();
    if (!text) { blank.push(item); return; }
    updates.push({ key: item.key, value: text, description: item.description });
  });
  if (blank.length) {
    var message = '次の項目は空欄にできません: ' + blank.map(function(item) { return '「' + item.label + '」'; }).join('、') + '。';
    // 「表示する」をオフにしても文言は要る（オンに戻したときに出す文言になる）
    if (blank.some(function(item) { return item.toggle; })) {
      message += '\n表示したくない項目は、文言を残したまま「表示する」のチェックを外してください。';
    }
    throw new Error(message);
  }
  return updates;
}

function findScreenTextTemplatePurpose_(code) {
  for (var i = 0; i < SCREEN_TEXT_TEMPLATE_PURPOSES_.length; i += 1) {
    if (SCREEN_TEXT_TEMPLATE_PURPOSES_[i].code === String(code || '')) return SCREEN_TEXT_TEMPLATE_PURPOSES_[i];
  }
  return null;
}

// v376.134 までの読み方そのまま（移し替えの元）。本文が空なら、旧い 1 行目＋2 行の組み立て、または既定の文面。
function legacyScreenTextBody_(map, purpose) {
  var raw = String(map[purpose.legacyKey] || '');
  if (raw.trim()) return raw;
  if (purpose.legacyNoticeKey) {
    var noticeDefault = purpose.code === 'COMPLETION_GUIDANCE_SENT'
      ? PUBLIC_PORTAL_DEFAULTS.completionCredentialNotice : PUBLIC_PORTAL_DEFAULTS.completionNoCredentialNotice;
    var notice = String(map[purpose.legacyNoticeKey] || '').trim() || noticeDefault;
    return [notice, '年会費や振込先などのご案内は、登録メールアドレスをご確認ください。', '追加確認が必要な場合のみ、事務局からご連絡します。'].join('\n');
  }
  return PUBLIC_PORTAL_DEFAULTS[purpose.defaultKey];
}

function screenTextTemplateRowToObject_(row) {
  return {
    id: String(row['テンプレートID'] || ''),
    purpose: String(row['用途コード'] || ''),
    name: String(row['名前'] || ''),
    body: String(row['本文'] || ''),
    sortOrder: Number(row['表示順'] || 0),
    updatedAt: String(row['更新日時'] || ''),
  };
}

function listScreenTextTemplates_(ss) {
  if (!ss.getSheetByName('T_画面文テンプレート')) return [];
  return getRowsAsObjects_(ss, 'T_画面文テンプレート')
    .filter(function(row) { return String(row['テンプレートID'] || '') && !toBoolean_(row['削除フラグ']); })
    .map(screenTextTemplateRowToObject_)
    .sort(function(a, b) { return a.sortOrder - b.sortOrder || (a.id < b.id ? -1 : 1); });
}

// 設定の ID から本文を引く。見つからなければ空（補わない）。warnings は管理画面に出す。
function resolveScreenTextTemplates_(ss, map) {
  var templates = listScreenTextTemplates_(ss);
  var byId = {};
  templates.forEach(function(t) { byId[t.id] = t; });
  var out = { templates: templates, ids: {}, bodies: {}, warnings: [] };
  SCREEN_TEXT_TEMPLATE_PURPOSES_.forEach(function(p) {
    var id = String(map[p.settingKey] || '');
    var t = byId[id];
    out.ids[p.code] = id;
    if (t && t.purpose === p.code) {
      out.bodies[p.code] = t.body;
    } else {
      out.bodies[p.code] = '';
      out.warnings.push('「' + p.label + '」の定型文が選ばれていないか、見つかりません。公開ポータルではこの枠を表示していません。');
    }
  });
  return out;
}

// スキーマ整備（critical）: 定型文が無い用途に今の表示と同じ文面を 1 件作って選ぶ。見出しの空欄を今の表示で埋める。
// 2 回流しても増えない。
function seedScreenTextTemplates_(ss) {
  var sheet = ss.getSheetByName('T_画面文テンプレート');
  if (!sheet) return;
  var map = getSystemSettingMap_(ss);
  var templates = listScreenTextTemplates_(ss);
  var now = new Date().toISOString();
  var appended = [];
  var updates = [];
  SCREEN_TEXT_TEMPLATE_PURPOSES_.forEach(function(p) {
    var own = templates.filter(function(t) { return t.purpose === p.code; });
    var selected = String(map[p.settingKey] || '');
    if (own.length === 0) {
      var id = 'STT-' + Utilities.getUuid().substring(0, 8);
      appended.push({ 'テンプレートID': id, '用途コード': p.code, '名前': '移行時の文面', '本文': legacyScreenTextBody_(map, p),
        '表示順': 1, '作成日時': now, '更新日時': now, '削除フラグ': false });
      // 定型文が 1 件も無いのに ID が入っているのは、前の版へ戻したとき（旧い整備が定義に無いシートを消す）。
      // その ID はもう無いので、作った 1 件に必ず付け替える（付け替えないと案内文が空になる）。
      updates.push({ key: p.settingKey, value: id, description: '公開ポータル：入会完了画面・' + p.label + 'に使う定型文（T_画面文テンプレート）' });
    } else if (!selected) {
      updates.push({ key: p.settingKey, value: own[0].id, description: '公開ポータル：入会完了画面・' + p.label + 'に使う定型文（T_画面文テンプレート）' });
    }
  });
  PUBLIC_PORTAL_REQUIRED_TEXTS_.forEach(function(item) {
    if (String(map[item.key] || '').trim()) return;
    updates.push({ key: item.key, value: PUBLIC_PORTAL_DEFAULTS[item.defaultKey], description: item.description });
  });
  if (appended.length) appendRowsByHeaders_(ss, 'T_画面文テンプレート', appended);
  if (updates.length) batchUpsertSystemSettings_(ss, updates);
  invalidateSettingsCache_(); // docs/330 §4.2: 書いた後に設定のキャッシュを捨てる
}

function saveScreenTextTemplate_(payload) {
  payload = payload || {};
  var purpose = findScreenTextTemplatePurpose_(payload.purpose);
  if (!purpose) throw new Error('定型文の用途が正しくありません。');
  var name = String(payload.name == null ? '' : payload.name).trim();
  var body = String(payload.body == null ? '' : payload.body);
  if (!name) throw new Error('定型文の名前を入力してください。');
  if (name.length > 100) throw new Error('定型文の名前は 100 文字以内で入力してください。');
  if (!body.trim()) throw new Error('定型文の本文が空です。空の定型文は保存できません。');
  if (body.length > 2000) throw new Error('定型文の本文は 2000 文字以内で入力してください。');
  var sortOrder = Number(payload.sortOrder || 0);
  if (!isFinite(sortOrder) || sortOrder < 0 || sortOrder > 999) sortOrder = 0;

  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var sheet = ss.getSheetByName('T_画面文テンプレート');
  if (!sheet) throw new Error('T_画面文テンプレート が初期化されていません。');
  // 2026-10-26: 削除・設定の保存と食い違わないよう、確かめてから書くまでをロックの中で行う（initializeSchemaIfNeeded_ も同じロックを取るので、その後に取る）
  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_WAIT_TIMEOUT_MS);
  try {
    var now = new Date().toISOString();
    var id = String(payload.id || '').trim();
    // 選ぶときに見分けられるよう、同じ用途の中で同じ名前は付けない
    var sameName = listScreenTextTemplates_(ss).some(function(t) { return t.purpose === purpose.code && t.id !== id && t.name.trim() === name; });
    if (sameName) throw new Error('この用途には「' + name + '」という名前の定型文がすでにあります。別の名前にしてください。');
    if (!id) {
      id = 'STT-' + Utilities.getUuid().substring(0, 8);
      appendRowsByHeaders_(ss, 'T_画面文テンプレート', [{ 'テンプレートID': id, '用途コード': purpose.code, '名前': name, '本文': body,
        '表示順': sortOrder, '作成日時': now, '更新日時': now, '削除フラグ': false }]);
      invalidateSettingsCache_(); // docs/330 §4.2: 書いた後に設定のキャッシュを捨てる
      return { id: id, created: true, templates: listScreenTextTemplates_(ss) };
    }
    var found = findRowByColumnValue_(sheet, 'テンプレートID', id);
    if (!found || toBoolean_(found.row[found.columns['削除フラグ']])) throw new Error('対象の定型文が見つかりません。');
    if (String(found.row[found.columns['用途コード']] || '') !== purpose.code) throw new Error('定型文の用途は変えられません。');
    var row = found.row.slice();
    row[found.columns['名前']] = name;
    row[found.columns['本文']] = body;
    row[found.columns['表示順']] = sortOrder;
    row[found.columns['更新日時']] = now;
    sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
    invalidateSettingsCache_(); // docs/330 §4.2: 書いた後に設定のキャッシュを捨てる
    return { id: id, updated: true, templates: listScreenTextTemplates_(ss) };
  } finally {
    lock.releaseLock();
  }
}

function deleteScreenTextTemplate_(payload) {
  var id = String((payload && payload.id) || '').trim();
  if (!id) throw new Error('定型文の ID が空です。');
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var sheet = ss.getSheetByName('T_画面文テンプレート');
  if (!sheet) throw new Error('T_画面文テンプレート が初期化されていません。');
  // 2026-10-26: 2 人が同じ用途の別の定型文を同時に消して 0 件になる・設定の保存と同時に選ばれた定型文を消す、を防ぐ
  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_WAIT_TIMEOUT_MS);
  try {
    var found = findRowByColumnValue_(sheet, 'テンプレートID', id);
    if (!found || toBoolean_(found.row[found.columns['削除フラグ']])) throw new Error('対象の定型文が見つかりません。');
    var purpose = findScreenTextTemplatePurpose_(found.row[found.columns['用途コード']]);
    var map = getSystemSettingMap_(ss);
    // 書き込む前に止める: 選ばれている定型文・その用途の最後の 1 件
    for (var i = 0; i < SCREEN_TEXT_TEMPLATE_PURPOSES_.length; i += 1) {
      if (String(map[SCREEN_TEXT_TEMPLATE_PURPOSES_[i].settingKey] || '') === id) {
        throw new Error('この定型文は「' + SCREEN_TEXT_TEMPLATE_PURPOSES_[i].label + '」で使われています。先に別の定型文を選んで保存してください。');
      }
    }
    var sameKind = listScreenTextTemplates_(ss).filter(function(t) { return purpose && t.purpose === purpose.code; });
    if (sameKind.length <= 1) throw new Error('この用途の定型文は最後の 1 件なので削除できません。');
    var row = found.row.slice();
    row[found.columns['削除フラグ']] = true;
    row[found.columns['更新日時']] = new Date().toISOString();
    sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
    invalidateSettingsCache_(); // docs/330 §4.2: 書いた後に設定のキャッシュを捨てる
    return { id: id, deleted: true, templates: listScreenTextTemplates_(ss) };
  } finally {
    lock.releaseLock();
  }
}

// 設定の保存で、選んだ定型文の ID を確かめる（存在する・削除済みでない・同じ用途）
function validateScreenTextTemplateSelection_(ss, purpose, id) {
  var value = String(id == null ? '' : id).trim();
  if (!value) throw new Error('「' + purpose.label + '」に使う定型文を選んでください。');
  var templates = listScreenTextTemplates_(ss);
  for (var i = 0; i < templates.length; i += 1) {
    if (templates[i].id !== value) continue;
    if (templates[i].purpose !== purpose.code) throw new Error('「' + purpose.label + '」には、この用途の定型文を選んでください。');
    return value;
  }
  throw new Error('「' + purpose.label + '」に選んだ定型文が見つかりません（削除された可能性があります）。');
}

// 2026-10-13: 公開ポータルの受付メニュー（研修・入会・登録情報変更・退会）が有効か。
// 以前は設定で「受付停止」にしても画面がメニューを隠すだけで、サーバは受け付け続けていた。
// 既定値は画面の表示（PUBLIC_PORTAL_DEFAULTS / 未設定は表示）と同じ。
// 2026-10-13: 公開の受付（研修申込・入会申込・変更申請）の回数制限。以前は無く、
// ①申込済みかどうかを総当たりで確かめられる ②架空の申込で定員を埋められる
// ③任意の宛先へ受付メールを送らせ、1 日の送信上限を使い切ってシステム全体のメールを止められた。
// GAS では送信元 IP が取れないので、「宛先（メール・会員）ごと」と「全体の 1 時間あたり」の 2 段で抑える。
// kind: 'TRAINING' / 'APPLICATION' / 'CHANGE_REQUEST'。key: メールアドレスや会員ID。
function consumePublicSubmissionQuota_(kind, key) {
  var limits = {
    TRAINING: { perKey: 10, perKeySeconds: 3600 },
    APPLICATION: { perKey: 5, perKeySeconds: 3600 },
    CHANGE_REQUEST: { perKey: 5, perKeySeconds: 1800 },
  };
  var limit = limits[kind];
  var cache = CacheService.getScriptCache();
  var keyName = 'pub_submit_' + kind + '_' + String(key || '').toLowerCase().slice(0, 200);
  var used = Number(cache.get(keyName) || 0) || 0;
  if (used >= limit.perKey) throw new Error('短時間に多くの申込がありました。しばらくしてからもう一度お試しください。');
  // 全体: 1 時間あたり 300 件（受付メールの送信上限を守る）。時間帯ごとの箱で数える。
  var hourKey = 'pub_submit_all_' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMddHH');
  var allUsed = Number(cache.get(hourKey) || 0) || 0;
  if (allUsed >= 300) throw new Error('現在、申込が集中しています。しばらくしてからもう一度お試しください。');
  cache.put(keyName, String(used + 1), limit.perKeySeconds);
  cache.put(hourKey, String(allUsed + 1), 3600);
}

function assertPublicPortalIntakeOpen_(ss, kind) {
  // 対応表は関数の中に置く（build の未使用除去が最上位の var を消す罠を避ける）
  var keys = {
    TRAINING: 'PUBLIC_PORTAL_TRAINING_MENU_ENABLED',
    MEMBERSHIP: 'PUBLIC_PORTAL_MEMBERSHIP_MENU_ENABLED',
    MEMBER_UPDATE: 'PUBLIC_PORTAL_MEMBER_UPDATE_MENU_ENABLED',
    WITHDRAWAL: 'PUBLIC_PORTAL_WITHDRAWAL_MENU_ENABLED',
  };
  var raw = getSystemSettingValue_(ss, keys[kind]);
  var enabled = (raw === '' || raw === null || raw === undefined) ? true : String(raw) !== 'false';
  if (!enabled) throw new Error('現在、この受付は停止しています。');
}

// ─── 公開ポータル API ─────────────────────────────────────────────────────────

// v210: 公開ポータルの表示設定（認証不要・公開API）
function getPublicPortalSettings_() {
  var db = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var map = getSystemSettingMap_(db);
  apiProfileMark_('publicSettings.map');
  var trainingMenuEnabledRaw = map['PUBLIC_PORTAL_TRAINING_MENU_ENABLED'];
  var publicPortalTrainingMenuEnabled = trainingMenuEnabledRaw === undefined || trainingMenuEnabledRaw === ''
    ? true
    : String(trainingMenuEnabledRaw) !== 'false';
  var membershipMenuEnabledRaw = map['PUBLIC_PORTAL_MEMBERSHIP_MENU_ENABLED'];
  var publicPortalMembershipMenuEnabled = membershipMenuEnabledRaw === undefined || membershipMenuEnabledRaw === ''
    ? true
    : String(membershipMenuEnabledRaw) !== 'false';
  var heroBadgeEnabledRaw = map['PUBLIC_PORTAL_HERO_BADGE_ENABLED'];
  var publicPortalHeroBadgeEnabled = heroBadgeEnabledRaw === undefined || heroBadgeEnabledRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.heroBadgeEnabled
    : String(heroBadgeEnabledRaw) !== 'false';
  var publicPortalHeroBadgeLabel = String(map['PUBLIC_PORTAL_HERO_BADGE_LABEL'] || '');
  var publicPortalPrivacyPolicyUrl = String(map['PUBLIC_PORTAL_PRIVACY_POLICY_URL'] || '');
  var publicPortalHeroTitle = String(map['PUBLIC_PORTAL_HERO_TITLE'] || '');
  var heroDescriptionEnabledRaw = map['PUBLIC_PORTAL_HERO_DESCRIPTION_ENABLED'];
  var publicPortalHeroDescriptionEnabled = heroDescriptionEnabledRaw === undefined || heroDescriptionEnabledRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.heroDescriptionEnabled
    : String(heroDescriptionEnabledRaw) !== 'false';
  var publicPortalHeroDescription = String(map['PUBLIC_PORTAL_HERO_DESCRIPTION'] || '');
  var membershipBadgeEnabledRaw = map['PUBLIC_PORTAL_MEMBERSHIP_BADGE_ENABLED'];
  var publicPortalMembershipBadgeEnabled = membershipBadgeEnabledRaw === undefined || membershipBadgeEnabledRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.membershipBadgeEnabled
    : String(membershipBadgeEnabledRaw) !== 'false';
  var publicPortalMembershipBadgeLabel = String(map['PUBLIC_PORTAL_MEMBERSHIP_BADGE_LABEL'] || '');
  var membershipTitleEnabledRaw = map['PUBLIC_PORTAL_MEMBERSHIP_TITLE_ENABLED'];
  var publicPortalMembershipTitleEnabled = membershipTitleEnabledRaw === undefined || membershipTitleEnabledRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.membershipTitleEnabled
    : String(membershipTitleEnabledRaw) !== 'false';
  var publicPortalMembershipTitle = String(map['PUBLIC_PORTAL_MEMBERSHIP_TITLE'] || '');
  var membershipDescriptionEnabledRaw = map['PUBLIC_PORTAL_MEMBERSHIP_DESCRIPTION_ENABLED'];
  var publicPortalMembershipDescriptionEnabled = membershipDescriptionEnabledRaw === undefined || membershipDescriptionEnabledRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.membershipDescriptionEnabled
    : String(membershipDescriptionEnabledRaw) !== 'false';
  var publicPortalMembershipDescription = String(map['PUBLIC_PORTAL_MEMBERSHIP_DESCRIPTION'] || '');
  var publicPortalMembershipCtaLabel = String(map['PUBLIC_PORTAL_MEMBERSHIP_CTA_LABEL'] || '');
  var completionGuidanceVisibleRaw = map['PUBLIC_PORTAL_COMPLETION_GUIDANCE_VISIBLE'];
  var publicPortalCompletionGuidanceVisible = completionGuidanceVisibleRaw === undefined || completionGuidanceVisibleRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.completionGuidanceVisible
    : String(completionGuidanceVisibleRaw) !== 'false';
  var completionLoginInfoVisibleRaw = map['PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_VISIBLE'];
  var publicPortalCompletionLoginInfoVisible = completionLoginInfoVisibleRaw === undefined || completionLoginInfoVisibleRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.completionLoginInfoVisible
    : String(completionLoginInfoVisibleRaw) !== 'false';
  var completionLoginInfoBlockVisibleRaw = map['PUBLIC_PORTAL_COMPLETION_LOGIN_INFO_BLOCK_VISIBLE'];
  var publicPortalCompletionLoginInfoBlockVisible = completionLoginInfoBlockVisibleRaw === undefined || completionLoginInfoBlockVisibleRaw === ''
    ? PUBLIC_PORTAL_DEFAULTS.completionLoginInfoBlockVisible
    : String(completionLoginInfoBlockVisibleRaw) !== 'false';
  // 2026-10-25 docs/313: 案内文は選んだ定型文（T_画面文テンプレート）の本文。見つからなければ空（補わない）
  var screenText = resolveScreenTextTemplates_(db, map);
  apiProfileMark_('publicSettings.screenText');
  var publicPortalCompletionGuidanceBodyWhenCredentialSent = screenText.bodies.COMPLETION_GUIDANCE_SENT;
  var publicPortalCompletionGuidanceBodyWhenCredentialNotSent = screenText.bodies.COMPLETION_GUIDANCE_NOT_SENT;
  var publicPortalCompletionLoginInfoBodyWhenCredentialSent = screenText.bodies.COMPLETION_LOGIN_INFO_SENT;
  var publicPortalCompletionLoginInfoBodyWhenCredentialNotSent = screenText.bodies.COMPLETION_LOGIN_INFO_NOT_SENT;
  var credentialEmailEnabledRaw = map['CREDENTIAL_EMAIL_ENABLED'];
  var credentialEmailEnabled = credentialEmailEnabledRaw === '' || credentialEmailEnabledRaw === null
    ? true
    : String(credentialEmailEnabledRaw) !== 'false';
  var ppTrainingBadgeEnabledRaw = map['PUBLIC_PORTAL_TRAINING_BADGE_ENABLED'];
  var ppTrainingBadgeEnabled = ppTrainingBadgeEnabledRaw === undefined || ppTrainingBadgeEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.trainingBadgeEnabled : String(ppTrainingBadgeEnabledRaw) !== 'false';
  var ppTrainingBadgeLabel = String(map['PUBLIC_PORTAL_TRAINING_BADGE_LABEL'] || '');
  var ppTrainingTitleEnabledRaw = map['PUBLIC_PORTAL_TRAINING_TITLE_ENABLED'];
  var ppTrainingTitleEnabled = ppTrainingTitleEnabledRaw === undefined || ppTrainingTitleEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.trainingTitleEnabled : String(ppTrainingTitleEnabledRaw) !== 'false';
  var ppTrainingTitle = String(map['PUBLIC_PORTAL_TRAINING_TITLE'] || '');
  var ppTrainingDescriptionEnabledRaw = map['PUBLIC_PORTAL_TRAINING_DESCRIPTION_ENABLED'];
  var ppTrainingDescriptionEnabled = ppTrainingDescriptionEnabledRaw === undefined || ppTrainingDescriptionEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.trainingDescriptionEnabled : String(ppTrainingDescriptionEnabledRaw) !== 'false';
  var ppTrainingDescription = String(map['PUBLIC_PORTAL_TRAINING_DESCRIPTION'] || '');
  var ppTrainingCtaLabel = String(map['PUBLIC_PORTAL_TRAINING_CTA_LABEL'] || '');
  var ppMemberUpdateMenuEnabledRaw = map['PUBLIC_PORTAL_MEMBER_UPDATE_MENU_ENABLED'];
  var ppMemberUpdateMenuEnabled = ppMemberUpdateMenuEnabledRaw === undefined || ppMemberUpdateMenuEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.memberUpdateMenuEnabled : String(ppMemberUpdateMenuEnabledRaw) !== 'false';
  var ppMemberUpdateBadgeEnabledRaw = map['PUBLIC_PORTAL_MEMBER_UPDATE_BADGE_ENABLED'];
  var ppMemberUpdateBadgeEnabled = ppMemberUpdateBadgeEnabledRaw === undefined || ppMemberUpdateBadgeEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.memberUpdateBadgeEnabled : String(ppMemberUpdateBadgeEnabledRaw) !== 'false';
  var ppMemberUpdateBadgeLabel = String(map['PUBLIC_PORTAL_MEMBER_UPDATE_BADGE_LABEL'] || '');
  var ppMemberUpdateTitleEnabledRaw = map['PUBLIC_PORTAL_MEMBER_UPDATE_TITLE_ENABLED'];
  var ppMemberUpdateTitleEnabled = ppMemberUpdateTitleEnabledRaw === undefined || ppMemberUpdateTitleEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.memberUpdateTitleEnabled : String(ppMemberUpdateTitleEnabledRaw) !== 'false';
  var ppMemberUpdateTitle = String(map['PUBLIC_PORTAL_MEMBER_UPDATE_TITLE'] || '');
  var ppMemberUpdateDescriptionEnabledRaw = map['PUBLIC_PORTAL_MEMBER_UPDATE_DESCRIPTION_ENABLED'];
  var ppMemberUpdateDescriptionEnabled = ppMemberUpdateDescriptionEnabledRaw === undefined || ppMemberUpdateDescriptionEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.memberUpdateDescriptionEnabled : String(ppMemberUpdateDescriptionEnabledRaw) !== 'false';
  var ppMemberUpdateDescription = String(map['PUBLIC_PORTAL_MEMBER_UPDATE_DESCRIPTION'] || '');
  var ppMemberUpdateCtaLabel = String(map['PUBLIC_PORTAL_MEMBER_UPDATE_CTA_LABEL'] || '');
  var ppWithdrawalMenuEnabledRaw = map['PUBLIC_PORTAL_WITHDRAWAL_MENU_ENABLED'];
  var ppWithdrawalMenuEnabled = ppWithdrawalMenuEnabledRaw === undefined || ppWithdrawalMenuEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.withdrawalMenuEnabled : String(ppWithdrawalMenuEnabledRaw) !== 'false';
  var ppWithdrawalBadgeEnabledRaw = map['PUBLIC_PORTAL_WITHDRAWAL_BADGE_ENABLED'];
  var ppWithdrawalBadgeEnabled = ppWithdrawalBadgeEnabledRaw === undefined || ppWithdrawalBadgeEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.withdrawalBadgeEnabled : String(ppWithdrawalBadgeEnabledRaw) !== 'false';
  var ppWithdrawalBadgeLabel = String(map['PUBLIC_PORTAL_WITHDRAWAL_BADGE_LABEL'] || '');
  var ppWithdrawalTitleEnabledRaw = map['PUBLIC_PORTAL_WITHDRAWAL_TITLE_ENABLED'];
  var ppWithdrawalTitleEnabled = ppWithdrawalTitleEnabledRaw === undefined || ppWithdrawalTitleEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.withdrawalTitleEnabled : String(ppWithdrawalTitleEnabledRaw) !== 'false';
  var ppWithdrawalTitle = String(map['PUBLIC_PORTAL_WITHDRAWAL_TITLE'] || '');
  var ppWithdrawalDescriptionEnabledRaw = map['PUBLIC_PORTAL_WITHDRAWAL_DESCRIPTION_ENABLED'];
  var ppWithdrawalDescriptionEnabled = ppWithdrawalDescriptionEnabledRaw === undefined || ppWithdrawalDescriptionEnabledRaw === '' ? PUBLIC_PORTAL_DEFAULTS.withdrawalDescriptionEnabled : String(ppWithdrawalDescriptionEnabledRaw) !== 'false';
  var ppWithdrawalDescription = String(map['PUBLIC_PORTAL_WITHDRAWAL_DESCRIPTION'] || '');
  var ppWithdrawalCtaLabel = String(map['PUBLIC_PORTAL_WITHDRAWAL_CTA_LABEL'] || '');
  var ppWithdrawalConfirmationItems = parseWithdrawalConfirmationItems_(map['PUBLIC_PORTAL_WITHDRAWAL_CONFIRMATION_ITEMS']);
  // v376.65（案C Phase 1）: 入会申込画面に出す規程・重要事項（公開フラグの立った行のみ）
  var ppRegulations = listRegulations_(db, true);
  apiProfileMark_('publicSettings.regulations');
  // v376.64: 入会申込の会員種別カードに表示する年会費（正本は M_会員種別.年会費金額）
  // 種別ごとの年会費は memberTypes[].annualFee に乗る（入会フォームの種別カードはこの一覧から描く）
  var ppMemberTypes = readMemberTypeMaster_(db);
  apiProfileMark_('publicSettings.memberTypes');
  var ppMembershipFeeVisibleRaw = map['MEMBERSHIP_FEE_PUBLIC_VISIBLE'];
  var ppMembershipFeeVisible = ppMembershipFeeVisibleRaw === undefined || ppMembershipFeeVisibleRaw === ''
    ? MEMBERSHIP_FEE_DEFAULTS.publicVisible
    : String(ppMembershipFeeVisibleRaw) !== 'false';
  var ppMembershipFeeNote = map['MEMBERSHIP_FEE_NOTE'] == null ? MEMBERSHIP_FEE_DEFAULTS.note : String(map['MEMBERSHIP_FEE_NOTE']);
  return JSON.stringify({
    success: true,
    data: {
      regulations: ppRegulations,
      memberTypes: ppMemberTypes,
      masters: masterOptionsForClient_(db, 'PUBLIC'),
      membershipFeeVisible: ppMembershipFeeVisible,
      membershipFeeNote: ppMembershipFeeNote,
      trainingMenuEnabled: publicPortalTrainingMenuEnabled,
      membershipMenuEnabled: publicPortalMembershipMenuEnabled,
      privacyPolicyUrl: publicPortalPrivacyPolicyUrl,
      heroBadgeEnabled: publicPortalHeroBadgeEnabled,
      heroBadgeLabel: publicPortalHeroBadgeLabel,
      heroTitle: publicPortalHeroTitle,
      heroDescriptionEnabled: publicPortalHeroDescriptionEnabled,
      heroDescription: publicPortalHeroDescription,
      membershipBadgeEnabled: publicPortalMembershipBadgeEnabled,
      membershipBadgeLabel: publicPortalMembershipBadgeLabel,
      membershipTitleEnabled: publicPortalMembershipTitleEnabled,
      membershipTitle: publicPortalMembershipTitle,
      membershipDescriptionEnabled: publicPortalMembershipDescriptionEnabled,
      membershipDescription: publicPortalMembershipDescription,
      membershipCtaLabel: publicPortalMembershipCtaLabel,
      completionGuidanceVisible: publicPortalCompletionGuidanceVisible,
      completionGuidanceBodyWhenCredentialSent: publicPortalCompletionGuidanceBodyWhenCredentialSent,
      completionGuidanceBodyWhenCredentialNotSent: publicPortalCompletionGuidanceBodyWhenCredentialNotSent,
      completionLoginInfoBlockVisible: publicPortalCompletionLoginInfoBlockVisible,
      completionLoginInfoVisible: publicPortalCompletionLoginInfoVisible,
      completionLoginInfoBodyWhenCredentialSent: publicPortalCompletionLoginInfoBodyWhenCredentialSent,
      completionLoginInfoBodyWhenCredentialNotSent: publicPortalCompletionLoginInfoBodyWhenCredentialNotSent,
      credentialEmailEnabled: credentialEmailEnabled,
      trainingBadgeEnabled: ppTrainingBadgeEnabled,
      trainingBadgeLabel: ppTrainingBadgeLabel,
      trainingTitleEnabled: ppTrainingTitleEnabled,
      trainingTitle: ppTrainingTitle,
      trainingDescriptionEnabled: ppTrainingDescriptionEnabled,
      trainingDescription: ppTrainingDescription,
      trainingCtaLabel: ppTrainingCtaLabel,
      memberUpdateMenuEnabled: ppMemberUpdateMenuEnabled,
      memberUpdateBadgeEnabled: ppMemberUpdateBadgeEnabled,
      memberUpdateBadgeLabel: ppMemberUpdateBadgeLabel,
      memberUpdateTitleEnabled: ppMemberUpdateTitleEnabled,
      memberUpdateTitle: ppMemberUpdateTitle,
      memberUpdateDescriptionEnabled: ppMemberUpdateDescriptionEnabled,
      memberUpdateDescription: ppMemberUpdateDescription,
      memberUpdateCtaLabel: ppMemberUpdateCtaLabel,
      withdrawalMenuEnabled: ppWithdrawalMenuEnabled,
      withdrawalBadgeEnabled: ppWithdrawalBadgeEnabled,
      withdrawalBadgeLabel: ppWithdrawalBadgeLabel,
      withdrawalTitleEnabled: ppWithdrawalTitleEnabled,
      withdrawalTitle: ppWithdrawalTitle,
      withdrawalDescriptionEnabled: ppWithdrawalDescriptionEnabled,
      withdrawalDescription: ppWithdrawalDescription,
      withdrawalCtaLabel: ppWithdrawalCtaLabel,
      withdrawalConfirmationItems: ppWithdrawalConfirmationItems,
    }
  });
}

function getPublicTrainings_() {
  var db = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var sheet = db.getSheetByName('T_研修');
  var rows = getRowsAsObjectsFromSheet_(sheet);
  var result = rows.filter(function(r) {
    return !toBoolean_(r['削除フラグ']) && computeTrainingAvailability_(r).isApplicationOpen;
  }).map(function(r) {
    // 2026-10-13: 項目設定で「無効」にした項目は返さない。以前は画面が隠すだけで、講師名・内容・
    // 使っていない方の問合せ先（電話・メール）まで応答に入っていた。項目設定JSON も丸ごと返していた。
    var opts = {};
    try { opts = JSON.parse(String(r['項目設定JSON'] || '') || '{}') || {}; } catch (e) { opts = {}; }
    var fc = (opts.fieldConfig && typeof opts.fieldConfig === 'object') ? opts.fieldConfig : {};
    var on = function(key) { return fc[key] !== false; };
    var publicOptions = {
      fieldConfig: fc,
      inquiryPerson: String(opts.inquiryPerson || ''),
      inquiryContactType: String(opts.inquiryContactType || ''),
      inquiryContactValue: String(opts.inquiryContactValue || ''),
    };
    return {
      id: String(r['研修ID'] || ''),
      name: String(r['研修名'] || ''),
      date: formatDateForApi_(r['開催日']),
      endTime: formatTimeOnly_(r['開催終了時刻']),
      capacity: Number(r['定員'] || 0),
      location: String(r['開催場所'] || ''),
      summary: String(r['研修概要'] || ''),
      content: on('description') ? String(r['研修内容'] || '') : '',
      cost: on('fees') ? String(r['費用JSON'] || '') : '',
      startDate: on('applicationOpenDate') ? formatDateForApi_(r['申込開始日']) : '',
      endDate: on('applicationCloseDate') ? formatDateForApi_(r['申込締切日']) : '',
      instructor: on('instructor') ? String(r['講師'] || '') : '',
      fileUrl: on('guidePdfUrl') ? String(r['案内状URL'] || '') : '',
      thumbnailUrl: on('guidePdfUrl') ? String(r['案内状サムネイルURL'] || '') : '',
      applicationUrl: on('applicationUrl') ? String(r['申込URL'] || '') : '', // v376.30: 外部申込フォーム URL
      organizer: String(r['主催者'] || ''),
      fieldConfig: JSON.stringify(publicOptions),
      // BR-21: 申込フォームに介護支援専門員番号の欄を出すか
      askMemberNumber: resolveTrainingAsksMemberNumber_(r),
    };
  });
  return JSON.stringify({ success: true, data: result });
}

// 研修の申込方法: 'none'（申込URL トグル無効＝閲覧のみ）/ 'external'（URL あり）/ 'internal'（URL 空）。
// 画面の resolveApplyCta（src/shared/trainingOptions.ts）と同じ規則。項目設定JSON が読めなければ既定（有効）。
function resolveTrainingApplyMode_(trainingRow) {
  var enabled = true;
  try {
    var opts = JSON.parse(String((trainingRow && trainingRow['項目設定JSON']) || '') || '{}');
    if (opts && opts.fieldConfig && opts.fieldConfig.applicationUrl === false) enabled = false;
  } catch (e) { /* 旧データ・壊れた JSON は既定（有効） */ }
  if (!enabled) return 'none';
  return String((trainingRow && trainingRow['申込URL']) || '').trim() ? 'external' : 'internal';
}

// 2026-10-18 BR-21: 公開ポータルの研修申込で介護支援専門員番号を尋ねるか。
// 項目設定JSON の askMemberNumber が真偽で入っていればそれに従う。入っていない（この設定より前の研修）ときは
// 費用から決める: 金額が 2 通り以上ある＝会員と非会員で違う研修だけ尋ねる。
// 画面はこの関数の結果（API の askMemberNumber）を受け取るだけで、自分では判定しない。
function resolveTrainingAsksMemberNumber_(trainingRow) {
  try {
    var opts = JSON.parse(String((trainingRow && trainingRow['項目設定JSON']) || '') || '{}');
    if (opts && typeof opts.askMemberNumber === 'boolean') return opts.askMemberNumber;
    // 研修費用を「無効」にした研修は参加費無料として案内している（会員と非会員の違いが無い）
    if (opts && opts.fieldConfig && opts.fieldConfig.fees === false) return false;
  } catch (e) { /* 壊れた JSON は費用から決める */ }
  var fees = [];
  try { fees = JSON.parse(String((trainingRow && trainingRow['費用JSON']) || '') || '[]'); } catch (e2) { fees = []; }
  if (!Array.isArray(fees)) return false;
  var amounts = {};
  fees.forEach(function(f) { if (f && f.amount !== undefined && f.amount !== '') amounts[String(Number(f.amount))] = true; });
  return Object.keys(amounts).length >= 2;
}

// 2026-10-18 BR-21: 公開ポータルの研修申込者が会員かどうかを、氏名と介護支援専門員番号で照合する。
// 対象は在籍中の個人会員と、在籍中の事業所会員の在籍職員。賛助会員は含めない（研修申込の可否が U-16 で未確定）。
// 戻り値の code:
//   MEMBER    … 番号と氏名がそろって 1 人に一致した（memberId / staffId を返す）
//   UNMATCHED … 番号は入力されたが一致しない・2 人以上に一致した（非会員として扱う）
//   NONE      … 番号が空白（非会員として扱う）
// 結果はサーバ内部と管理画面でだけ使う。公開ポータルへは返さない（会員かどうかを外から探れないようにする）。
function matchTrainingApplicantMembership_(memberRows, staffRows, name, cmNumber) {
  var cm = normalizeCmNumberForKey_(cmNumber);
  if (!cm) return { code: 'NONE', memberId: '', staffId: '' };
  var nameKey = normalizeRosterKeyText_(name);
  if (!nameKey) return { code: 'UNMATCHED', memberId: '', staffId: '' };

  var activeMembers = {};
  var hits = [];
  (memberRows || []).forEach(function(r) {
    if (toBoolean_(r['削除フラグ'])) return;
    if (isInactiveMemberStatusForIdentity_(r['会員状態コード'])) return;
    var memberId = String(r['会員ID'] || '');
    var type = String(r['会員種別コード'] || '');
    activeMembers[memberId] = type;
    if (type !== 'INDIVIDUAL') return;
    // 登録側が空の番号は一致とみなさない（BR-19 と同じ）
    var dbCm = normalizeCmNumberForKey_(r['介護支援専門員番号']);
    if (!dbCm || dbCm !== cm) return;
    if (normalizeNameKey_(r['姓'], r['名']) !== nameKey) return;
    hits.push({ memberId: memberId, staffId: '' });
  });
  (staffRows || []).forEach(function(r) {
    if (toBoolean_(r['削除フラグ'])) return;
    if (String(r['職員状態コード'] || '') !== 'ENROLLED') return;
    var memberId = String(r['会員ID'] || '');
    if (activeMembers[memberId] !== 'BUSINESS') return;
    var dbCm = normalizeCmNumberForKey_(r['介護支援専門員番号']);
    if (!dbCm || dbCm !== cm) return;
    if (normalizeNameKey_(r['姓'], r['名']) !== nameKey) return;
    hits.push({ memberId: memberId, staffId: String(r['職員ID'] || '') });
  });
  if (hits.length !== 1) return { code: 'UNMATCHED', memberId: '', staffId: '' };
  return { code: 'MEMBER', memberId: hits[0].memberId, staffId: hits[0].staffId };
}

function sendTrainingApplicationReceipt_(db, email, name, training, applyId) {
  try {
    var applyMail = renderConfiguredMail_(db, 'TRAINING_APPLY_RECEIPT_SUBJECT', 'TRAINING_APPLY_RECEIPT_BODY',
      TRAINING_APPLY_RECEIPT_DEFAULT_SUBJECT, TRAINING_APPLY_RECEIPT_DEFAULT_BODY, {
        '申込者名': name,
        '研修名': String(training['研修名'] || ''),
        '開催日': formatTrainingDate_(training['開催日'], training['開催終了時刻']),
        '申込ID': applyId,
      });
    var result = deliverMail_('TRAINING_APPLY_RECEIPT', email, applyMail.subject, applyMail.body);
    return !!(result && result.sent === true && result.mode === 'LIVE');
  } catch (e) {
    Logger.log('申込確認メール送信失敗');
    return false;
  }
}

function applyTrainingExternal_(payload) {
  assertPublicPortalIntakeOpen_(getOrCreateDatabase_(), 'TRAINING');
  if (!payload) return JSON.stringify({ success: false, error: 'invalid_request' });
  // Honeypot チェック
  if (payload.honeypot) {
    return JSON.stringify({ success: false, error: 'invalid_request' });
  }
  var name = String(payload.name || '').trim();
  var furigana = String(payload.furigana || '').trim();
  var email = String(payload.email || '').trim();
  var phone = String(payload.phone || '').trim();
  var office = String(payload.officeName || '').trim();
  var trainingId = String(payload.trainingId || '').trim();
  var consent = payload.consent;
  var declaredCm = normalizeCmNumberForKey_(payload.careManagerNumber);

  if (!name || name.length > 100) return JSON.stringify({ success: false, error: '氏名が無効です' });
  // 番号は任意。入力があるときだけ書式を見る（管理画面と同じ 1〜10 桁の英数字。HN/HS 付きの会員がいるため）
  if (declaredCm && !isValidCmNumberRelaxed_(declaredCm)) return JSON.stringify({ success: false, error: '介護支援専門員番号は半角英数字で入力してください' });
  if (furigana.length > 100) return JSON.stringify({ success: false, error: 'フリガナが無効です' });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return JSON.stringify({ success: false, error: 'メールアドレスが無効です' });
  if (!phone || !/^[\d\-\+\(\)]+$/.test(phone) || phone.length > 20) return JSON.stringify({ success: false, error: '電話番号が無効です' });
  if (office.length > 100) return JSON.stringify({ success: false, error: '事業所名が無効です' });
  if (!trainingId) return JSON.stringify({ success: false, error: '研修IDが無効です' });
  if (!consent) return JSON.stringify({ success: false, error: 'プライバシーポリシーへの同意が必要です' });
  consumePublicSubmissionQuota_('TRAINING', email);

  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_WAIT_TIMEOUT_MS);
  try {
    var db = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
    backfillApplicationApplicantIdentity_(db);

    var trainingSheet = db.getSheetByName('T_研修');
    var trainingRows = getRowsAsObjectsFromSheet_(trainingSheet);
    var training = null;
    for (var i = 0; i < trainingRows.length; i += 1) {
      if (String(trainingRows[i]['研修ID'] || '') === trainingId && !toBoolean_(trainingRows[i]['削除フラグ'])) {
        training = trainingRows[i];
        break;
      }
    }

    if (!training) return JSON.stringify({ success: false, error: '研修が見つかりません' });

    var availability = computeTrainingAvailability_(training);
    if (!availability.isApplicationOpen) {
      return JSON.stringify({ success: false, error: availability.applicationStatusReason || '申込受付期間外です' });
    }
    // 2026-10-13: 研修の申込方法をサーバでも効かせる（画面 src/shared/trainingOptions.ts resolveApplyCta と同じ規則）。
    // 以前は画面がボタンを隠すだけで、閲覧のみ・外部フォームの研修にも内部の申込が入った。
    var applyMode = resolveTrainingApplyMode_(training);
    if (applyMode === 'none') return JSON.stringify({ success: false, error: 'この研修は申込を受け付けていません。' });
    if (applyMode === 'external') return JSON.stringify({ success: false, error: 'この研修は案内にある申込フォームからお申し込みください。' });

    if (evaluateTrainingCapacity_(db, trainingId, training['定員']).isFull) {
      return JSON.stringify({ success: false, error: '定員に達しています' });
    }

    var applySheet = db.getSheetByName('T_研修申込');

    // 2026-09-27: 以前はここで既存の外部申込者を探したうえで、見つかっても必ず
    // 新しい行を作っていた。同じ人が別の研修に申し込むたびに T_外部申込者 が増え、
    // 名簿でも宛先でも 1 人が複数人に見えていた。同一性の判定は共通ルールに委ねる。
    var resolvedExternal = resolveOrCreateExternalApplicant_(db, {
      name: name, kana: furigana, email: email, phone: phone, officeName: office,
    });
    var externalId = resolvedExternal.externalId;

    if (findExistingTrainingApplication_(db, trainingId, { kind: 'EXTERNAL', externalId: externalId })) {
      return JSON.stringify({ success: false, error: '既に申込済みです' });
    }

    // BR-21: 会員かどうか。尋ねない研修では番号を受け取っても照合も保存もしない。
    var membership = { code: 'NOT_ASKED', memberId: '', staffId: '' };
    if (resolveTrainingAsksMemberNumber_(training)) {
      membership = matchTrainingApplicantMembership_(
        getRowsAsObjectsFromSheet_(db.getSheetByName('T_会員')),
        getRowsAsObjectsFromSheet_(db.getSheetByName('T_事業所職員')),
        name, declaredCm);
    }

    var nowStr = new Date().toISOString();

    var applyId = generateTrainingApplyId_();
    var applyColsAll = テーブル定義.T_研修申込;
    var newApply = {};
    for (var m = 0; m < applyColsAll.length; m += 1) { newApply[applyColsAll[m]] = ''; }
    newApply['会員照合結果コード'] = membership.code;
    newApply['照合会員ID'] = membership.memberId;
    newApply['照合職員ID'] = membership.staffId;
    newApply['申告介護支援専門員番号'] = membership.code === 'NOT_ASKED' ? '' : declaredCm;
    newApply['申込ID'] = applyId;
    newApply['研修ID'] = trainingId;
    newApply['申込者区分コード'] = 'EXTERNAL';
    newApply['申込者ID'] = externalId;
    newApply['申込状態コード'] = 'APPLIED';
    newApply['申込日時'] = nowStr;
    newApply['作成日時'] = nowStr;
    newApply['更新日時'] = nowStr;
    newApply['削除フラグ'] = false;
    // 列の位置ではなく見出しで書く。照合の列がまだ無いシート（スキーマ移行前）に書くと、
    // 会員かどうかが黙って落ちるので止める（fail-closed）。
    var applyHeaders = applySheet.getRange(1, 1, 1, applySheet.getLastColumn()).getValues()[0].map(String);
    if (applyHeaders.indexOf('会員照合結果コード') < 0) {
      throw new Error('研修申込の受付を準備中です。しばらくしてからお申し込みください。');
    }
    appendRowsByHeaders_(db, 'T_研修申込', [newApply]);

    updateTrainingApplicantCount_(db, trainingId);
    clearAllDataCache_();
    clearAdminDashboardCache_();

    var confirmationMailSent = sendTrainingApplicationReceipt_(db, email, name, training, applyId);
    return JSON.stringify({ success: true, data: { applyId: applyId, confirmationMailSent: confirmationMailSent } });
  } finally {
    lock.releaseLock();
  }
}

function cancelTrainingExternal_(payload) {
  assertPublicPortalIntakeOpen_(getOrCreateDatabase_(), 'TRAINING');
  if (!payload) return JSON.stringify({ success: false, error: 'パラメータが不足しています' });
  var applyId = String(payload.applyId || '').trim();
  var email = String(payload.email || '').trim();

  if (!applyId || !email) return JSON.stringify({ success: false, error: 'パラメータが不足しています' });

  var db = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var applySheet = db.getSheetByName('T_研修申込');
  var applyRows = getRowsAsObjectsFromSheet_(applySheet);

  var apply = null;
  for (var i = 0; i < applyRows.length; i += 1) {
    var r = applyRows[i];
    if (String(r['申込ID'] || '') === applyId &&
        String(r['申込者区分コード'] || '') === 'EXTERNAL' &&
        !toBoolean_(r['削除フラグ'])) {
      apply = r;
      break;
    }
  }
  if (!apply) return JSON.stringify({ success: false, error: '申込が見つかりません' });

  var externalSheet = db.getSheetByName('T_外部申込者');
  var externalRows = getRowsAsObjectsFromSheet_(externalSheet);
  var external = null;
  for (var j = 0; j < externalRows.length; j += 1) {
    var er = externalRows[j];
    if (String(er['外部申込者ID'] || '') === String(apply['申込者ID'] || '') && !toBoolean_(er['削除フラグ'])) {
      external = er;
      break;
    }
  }
  if (!external || String(external['メールアドレス'] || '') !== email) {
    return JSON.stringify({ success: false, error: 'メールアドレスが一致しません' });
  }
  // 2026-10-13: 会員側の取消と同じ規則を効かせる。以前は「キャンセル可」設定・開催日・申込状態の
  // どれも見ておらず、キャンセル不可の研修や開催後・取消済みの申込も取り消せた。
  if (String(apply['申込状態コード'] || '') !== 'APPLIED') {
    return JSON.stringify({ success: false, error: 'この申込は既に取り消されています' });
  }
  var cancelTrainingFound = findRowByColumnValue_(db.getSheetByName('T_研修'), '研修ID', String(apply['研修ID'] || ''));
  if (!cancelTrainingFound || !isTrainingCancelable_(cancelTrainingFound.row, cancelTrainingFound.columns)) {
    return JSON.stringify({ success: false, error: 'この研修はキャンセルできません。事務局へお問い合わせください。' });
  }

  var nowStr = new Date().toISOString();
  updateRowByKey_(applySheet, テーブル定義.T_研修申込, '申込ID', applyId, { '申込状態コード': 'CANCELED', '更新日時': nowStr });
  updateTrainingApplicantCount_(db, String(apply['研修ID'] || ''));
  clearAllDataCache_();
  clearAdminDashboardCache_();

  return JSON.stringify({ success: true });
}

// ── v260/v261: 公開ポータル 会員情報変更・退会申請 ────────────────────────────

// 個人会員: 公開ポータル変更申請（管理者承認後に適用）で変更可能なフィールド allowlist
var PUBLIC_INDIVIDUAL_UPDATE_ALLOWLIST_ = [
  'lastName', 'firstName', 'lastKana', 'firstKana',
  'email', 'mobilePhone',
  // 2026-10-01: 勤務先名を追加した。入会申込では必須で取るのに本人からは変更できず、
  // 転職しても「前職の名前 ＋ 現職の住所・電話」という行しか作れなかった。
  // 郵送先区分が勤務先のとき宛名を決めるのはこの項目（docs/spec/02_RD.md §591）なので、
  // 変えられないままだと郵便が前職へ届く。認証には影響しない
  // （個人会員のログインIDは介護支援専門員番号）。
  'officeName',
  'phone', 'fax',
  'officePostCode', 'officePrefecture', 'officeCity', 'officeAddressLine', 'officeAddressLine2',
  'homePostCode', 'homePrefecture', 'homeCity', 'homeAddressLine', 'homeAddressLine2',
  'mailingPreference', 'preferredMailDestination',
  'careManagerNumber',
];

// 勤務先なしを表す予約語と判定。正本の考え方は docs/spec/02_RD.md §479
// 「勤務先名が空または 勤務なし の場合は勤務先なしとして扱う」。
// フロント側の同一実装は src/shared/officeAffiliation.ts にあり、
// npm run test:office-affiliation が両者の一致を検査する。
var NO_OFFICE_AFFILIATION_LABEL_ = '勤務なし';

function isNoOfficeAffiliation_(officeName) {
  var name = String(officeName == null ? '' : officeName).trim();
  return name === '' || name === NO_OFFICE_AFFILIATION_LABEL_;
}

// 2026-10-02: マスタに実在するコードかを確かめる（docs/294 §2-6）。
// シートの入力規則（入力規則定義）は人が手で入力するときしか効かず、
// Apps Script の setValues は素通りする。コード側で突き合わせないと守れない。
// 主キー列はマスタごとに違う（M_出欠状態 は『コード』、M_役職マスタ は『役職コード』）ので
// マスタ定義の先頭列を使う。
function isKnownMasterCode_(ss, masterName, code) {
  var value = String(code == null ? '' : code).trim();
  if (!value) return false;
  var columns = マスタ定義[masterName];
  if (!columns || !columns.length) return false;
  var sheet = ss.getSheetByName(masterName);
  if (!sheet) return false;
  var found = findRowByColumnValue_(sheet, columns[0], value);
  if (!found) return false;
  if (found.columns['削除フラグ'] != null && toBoolean_(found.row[found.columns['削除フラグ']])) return false;
  if (found.columns['有効フラグ'] != null && !toBoolean_(found.row[found.columns['有効フラグ']])) return false;
  return true;
}

// 事業所会員: 公開ポータル変更申請（管理者承認後に適用）で変更可能なフィールド allowlist
var PUBLIC_BUSINESS_UPDATE_ALLOWLIST_ = [
  'officeName',
  'email', 'phone', 'fax',
  'officePostCode', 'officePrefecture', 'officeCity', 'officeAddressLine', 'officeAddressLine2',
  'officeNumber',
];

// 賛助会員: 個人会員と同じ項目から、介護支援専門員番号だけを外す。
// 賛助会員は CM番号を持たない（入会フォームでも個人会員のときしか出さない）ため、
// 変更対象に残すとログインIDを書き換える経路になってしまう。
var PUBLIC_SUPPORT_UPDATE_ALLOWLIST_ = PUBLIC_INDIVIDUAL_UPDATE_ALLOWLIST_.filter(function(k) {
  return k !== 'careManagerNumber';
});

// 種別 → allowlist。三項演算子で分岐を書くと、種別が増えたときに
// 「INDIVIDUAL 以外＝事業所」と解釈されて賛助会員が事業所扱いになる。実際にそうなった。
var PUBLIC_UPDATE_ALLOWLIST_BY_TYPE_ = {
  INDIVIDUAL: PUBLIC_INDIVIDUAL_UPDATE_ALLOWLIST_,
  BUSINESS: PUBLIC_BUSINESS_UPDATE_ALLOWLIST_,
  SUPPORT: PUBLIC_SUPPORT_UPDATE_ALLOWLIST_,
};

// docs/307 F21（2026-10-25）: 承認画面に今の値を並べるための、変更申請の項目 → 列。
// 会員一覧（mapMembersForApi_）の対応と同じであることを test:change-request-current が確かめる。
var PUBLIC_UPDATE_FIELD_COLUMN_ = {
  lastName: '姓', firstName: '名', lastKana: 'セイ', firstKana: 'メイ',
  email: '代表メールアドレス', mobilePhone: '携帯電話番号', officeName: '勤務先名',
  phone: '勤務先電話番号', fax: '勤務先FAX番号',
  officePostCode: '勤務先郵便番号', officePrefecture: '勤務先都道府県', officeCity: '勤務先市区町村',
  officeAddressLine: '勤務先住所', officeAddressLine2: '勤務先住所2',
  homePostCode: '自宅郵便番号', homePrefecture: '自宅都道府県', homeCity: '自宅市区町村',
  homeAddressLine: '自宅住所', homeAddressLine2: '自宅住所2',
  mailingPreference: '発送方法コード', preferredMailDestination: '郵送先区分コード',
  careManagerNumber: '介護支援専門員番号', officeNumber: '事業所番号',
};
var STAFF_UPDATE_FIELD_COLUMN_ = {
  lastName: '姓', firstName: '名', lastKana: 'セイ', firstKana: 'メイ',
  email: 'メールアドレス', careManagerNumber: '介護支援専門員番号',
};

// 未処理の申請が変えようとしている項目の今の値（会員の項目と、職員情報変更の職員ごと）
function buildChangeRequestCurrentValues_(changeData, memberRow, staffById) {
  var cellText = function(row, col) { return row[col] == null ? '' : String(row[col]); };
  var fields = {};
  var requested = changeData.fields || {};
  if (memberRow) {
    Object.keys(requested).forEach(function(k) {
      if (PUBLIC_UPDATE_FIELD_COLUMN_[k]) fields[k] = cellText(memberRow, PUBLIC_UPDATE_FIELD_COLUMN_[k]);
    });
  }
  var staff = {};
  (changeData.staffUpdate || []).forEach(function(u) {
    var staffRow = u && staffById[String(u.staffId || '')];
    if (!staffRow) return;
    var cur = {};
    Object.keys(STAFF_UPDATE_FIELD_COLUMN_).forEach(function(k) {
      if (u[k]) cur[k] = cellText(staffRow, STAFF_UPDATE_FIELD_COLUMN_[k]);
    });
    staff[String(u.staffId)] = cur;
  });
  return { fields: fields, staff: staff };
}

function publicUpdateAllowlistFor_(memberType) {
  return PUBLIC_UPDATE_ALLOWLIST_BY_TYPE_[String(memberType || '')] || PUBLIC_INDIVIDUAL_UPDATE_ALLOWLIST_;
}

function normalizeCmNumberForKey_(cm) {
  // v372.4: 大文字統一を追加（旧 8 桁数字データには影響なし）。HN/HS プレフィックス等の英字比較を統一。
  return String(cm || '').trim().replace(/\s/g, '').toUpperCase();
}

// v372.4: 介護支援専門員番号バリデーション + 大文字統一
// 厳格: 8 桁の半角数字（公開ポータルでの基本ルール）
// 緩和: 1〜10 桁の半角英数字（admin 例外運用）— 例: 看護師 HN12345678 / 社会福祉士 HS12345678
var CM_NUMBER_STRICT_RE_ = /^\d{8}$/;
var CM_NUMBER_RELAXED_RE_ = /^[A-Za-z0-9]{1,10}$/;
function isValidCmNumberStrict_(v) {
  return CM_NUMBER_STRICT_RE_.test(String(v || '').trim());
}
function isValidCmNumberRelaxed_(v) {
  return CM_NUMBER_RELAXED_RE_.test(String(v || '').trim());
}
// DB 保存時の正規化（trim + 大文字化）。空文字は空のまま返す。
function normalizeCmNumberForStorage_(v) {
  var s = String(v || '').trim();
  if (!s) return '';
  return s.toUpperCase();
}
// adminSession から MASTER/ADMIN 権限を判定（CM 番号緩和許可の単一判定箇所）
function isAllowedRelaxedCmNumber_(adminSession) {
  if (!adminSession) return false;
  var perm = String(adminSession.adminPermissionLevel || '').toUpperCase();
  return perm === 'MASTER' || perm === 'ADMIN';
}

function generatePublicActionToken_() {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(Date.now()) + String(Math.random()) + String(Math.random())
  );
  return bytes.map(function(b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('').slice(0, 32);
}

function generateOtp_() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// CM番号で個人会員を検索し OTP をメール送信する。
// セキュリティ: CM番号の有無を応答で露出しない（列挙防止）。
function sendPublicOtp_(payload) {
  var cmNumber = normalizeCmNumberForKey_(payload.cmNumber);
  var purpose = String(payload.purpose || '').trim();

  if (!/^\d{8}$/.test(cmNumber)) {
    return { sent: false, error: 'CM番号の形式が正しくありません（8桁の数字）' };
  }
  if (purpose !== 'update' && purpose !== 'withdrawal') {
    return { sent: false, error: 'invalid_purpose' };
  }

  var cache = CacheService.getScriptCache();
  var rateLimitKey = 'pub_otp_rl_' + cmNumber;
  var rateLimitRaw = cache.get(rateLimitKey);
  var rateLimit = rateLimitRaw ? JSON.parse(rateLimitRaw) : { count: 0 };
  if (rateLimit.count >= 5) {
    // レート制限超過でも同じ応答（列挙防止）
    return { sent: true };
  }

  var ss = getOrCreateDatabase_();
  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(r) {
    return !toBoolean_(r['削除フラグ']) &&
           String(r['会員種別コード'] || '') === 'INDIVIDUAL' &&
           !isInactiveMemberStatusForIdentity_(r['会員状態コード']) &&
           normalizeCmNumberForKey_(r['介護支援専門員番号']) === cmNumber;
  });

  rateLimit.count++;
  cache.put(rateLimitKey, JSON.stringify(rateLimit), 900);

  // 0件・複数件は列挙防止のため同じ応答を返す（メールは送信しない）
  if (memberRows.length !== 1) {
    return { sent: true };
  }

  var member = memberRows[0];
  var email = String(member['代表メールアドレス'] || '').trim();
  var memberId = String(member['会員ID'] || '');
  var memberName = (String(member['姓'] || '') + ' ' + String(member['名'] || '')).trim();

  if (!email) {
    return { sent: true };
  }

  var otp = generateOtp_();
  var otpKey = 'pub_otp_' + purpose + '_' + cmNumber;
  cache.put(otpKey, JSON.stringify({ otp: otp, memberId: memberId, attempts: 0 }), 600);

  var purposeLabel = purpose === 'withdrawal' ? '退会申請' : '会員情報変更';
  // v376.43: 件名/本文を設定値（無ければ既定）から差し込み描画。認証コード欠落を安全ガード。
  var otpMail = renderConfiguredMail_(ss, 'AUTH_OTP_SUBJECT', 'AUTH_OTP_BODY',
    AUTH_OTP_DEFAULT_SUBJECT, AUTH_OTP_DEFAULT_BODY, {
      '会員名': memberName,
      '用途': purposeLabel,
      '認証コード': otp,
      '有効期限': '10分間',
    }, otp);
  deliverMail_('AUTH_OTP', email, otpMail.subject, otpMail.body);

  return { sent: true };
}

// OTP を検証し、成功時に単一使用アクショントークンを発行する。
function verifyPublicOtp_(payload) {
  var cmNumber = normalizeCmNumberForKey_(payload.cmNumber);
  var otp = String(payload.otp || '').trim();
  var purpose = String(payload.purpose || '').trim();

  if (!/^\d{8}$/.test(cmNumber) || !/^\d{6}$/.test(otp) ||
      (purpose !== 'update' && purpose !== 'withdrawal')) {
    return { success: false, error: 'invalid_input' };
  }

  var cache = CacheService.getScriptCache();
  var otpKey = 'pub_otp_' + purpose + '_' + cmNumber;
  var otpRaw = cache.get(otpKey);

  if (!otpRaw) {
    return { success: false, error: 'otp_expired' };
  }

  var stored = JSON.parse(otpRaw);

  if (stored.attempts >= 5) {
    cache.remove(otpKey);
    return { success: false, error: 'too_many_attempts' };
  }

  if (stored.otp !== otp) {
    stored.attempts++;
    cache.put(otpKey, JSON.stringify(stored), 600);
    var remaining = 5 - stored.attempts;
    return { success: false, error: 'invalid_otp', remaining: remaining };
  }

  var token = generatePublicActionToken_();
  cache.put('pub_tok_' + purpose + '_' + token, JSON.stringify({ memberId: stored.memberId }), 1800);
  cache.remove(otpKey);

  return { success: true, token: token };
}

// ── v264: OTPなし本人確認フロー + 変更申請キュー ─────────────────────────────

// ステートレストークン（HMAC-SHA256署名）: CacheService非依存。
// キーは Script Properties の PUBLIC_TOKEN_SECRET（未設定時はフォールバック値）。
function createPublicIdentityToken_(data, ttlSeconds) {
  var secret = PropertiesService.getScriptProperties().getProperty('PUBLIC_TOKEN_SECRET') || 'hcmn_member_system_v264_fallback';
  var payload = JSON.stringify({ d: data, exp: Date.now() + ttlSeconds * 1000 });
  // v372.6 fix: UTF-8 charset を明示しないと日本語が ? に化ける（Utilities.base64EncodeWebSafe のデフォルト挙動）
  var encoded = Utilities.base64EncodeWebSafe(payload, Utilities.Charset.UTF_8);
  var sigBytes = Utilities.computeHmacSha256Signature(encoded, secret, Utilities.Charset.UTF_8);
  var sig = Utilities.base64EncodeWebSafe(sigBytes);
  return encoded + '.' + sig;
}

function verifyPublicIdentityToken_(token) {
  try {
    var parts = String(token || '').split('.');
    if (parts.length !== 2) return null;
    var encoded = parts[0];
    var sig = parts[1];
    var secret = PropertiesService.getScriptProperties().getProperty('PUBLIC_TOKEN_SECRET') || 'hcmn_member_system_v264_fallback';
    // v372.6 fix: HMAC sign 時と verify 時で charset を統一（UTF-8）
    var expectedSigBytes = Utilities.computeHmacSha256Signature(encoded, secret, Utilities.Charset.UTF_8);
    var expectedSig = Utilities.base64EncodeWebSafe(expectedSigBytes);
    // 2026-10-14（docs/307 E1）: 署名は時間一定で比べる（!== は最初に違った文字で止まり、かかる時間から署名を推測されうる）
    if (!secureCompareString_(sig, expectedSig)) return null;
    var decoded = Utilities.newBlob(Utilities.base64DecodeWebSafe(encoded)).getDataAsString();
    var obj = JSON.parse(decoded);
    if (!obj.exp || obj.exp < Date.now()) return null;
    return obj.d;
  } catch (e) {
    return null;
  }
}

// 電話番号の照合キー。数字だけを見る（ハイフン・空白・全角の揺れを吸収）。
// 全角数字はそのままだと落ちるため、半角へ寄せてから数字以外を捨てる。
function normalizePhoneForKey_(value) {
  return String(value == null ? '' : value)
    .replace(/[０-９]/g, function(ch) { return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0); })
    .replace(/[^0-9]/g, '');
}

// v376.88: 公開ポータルの本人確認で使える照合項目。
//
// 以前は個人 = CM番号、事業所 = 事業所番号 の 1 本だけで、
//   - 賛助会員は鍵が無く、変更・退会のどちらもできなかった（RD §2 は認めている）
//   - 個人会員も CM番号が空の 20 名（187 名中）が通れなかった
// という取りこぼしがあった。実データの充足率を数えたうえで、
// 「氏名（事業所名）＋ 手元にある番号を 1 つ」へ広げる。
//
// 名義の照合は全種別で必須にする。事業所会員はこれまで番号だけで通っていたので、
// この変更で強くなる。
function getPublicIdentityCredentials_() {
  return {
    INDIVIDUAL: [
      { key: 'cmNumber',    column: '介護支援専門員番号', normalize: normalizeCmNumberForKey_, label: '介護支援専門員番号' },
      { key: 'phone',       column: '勤務先電話番号',     normalize: normalizePhoneForKey_,    label: '電話番号' },
      { key: 'mobilePhone', column: '携帯電話番号',       normalize: normalizePhoneForKey_,    label: '携帯電話番号' },
    ],
    BUSINESS: [
      { key: 'officeNumber', column: '事業所番号',     normalize: normalizeCmNumberForKey_, label: '事業所番号' },
      { key: 'phone',        column: '勤務先電話番号', normalize: normalizePhoneForKey_,    label: '電話番号' },
    ],
    SUPPORT: [
      { key: 'phone',       column: '勤務先電話番号', normalize: normalizePhoneForKey_, label: '電話番号' },
      { key: 'mobilePhone', column: '携帯電話番号',   normalize: normalizePhoneForKey_, label: '携帯電話番号' },
    ],
  };
}

// 名義の一致を見る。表記の揺れ（前後空白・全角空白・大小文字）は吸収するが、
// 文字そのものは変えない。事業所名は空白の入り方が揺れやすいのでこの正規化が要る。
function matchesPublicIdentityName_(memberType, member, payload) {
  if (memberType === 'BUSINESS') {
    var inName = normalizeRosterKeyText_(payload.officeName);
    if (!inName) return false;
    return normalizeRosterKeyText_(member['勤務先名']) === inName;
  }
  var inLast = normalizeRosterKeyText_(payload.lastName);
  var inFirst = normalizeRosterKeyText_(payload.firstName);
  if (!inLast || !inFirst) return false;
  return normalizeRosterKeyText_(member['姓']) === inLast
    && normalizeRosterKeyText_(member['名']) === inFirst;
}

// 本人確認（OTP不要）: 入力情報でDB照合し、成功時にアクショントークンを発行。
// 列挙防止: 照合失敗・未存在ともに同一エラーを返す。
// contactEmail はDB照合に使わず、確認メール送信先として保存する。
function verifyMemberIdentityForPublic_(payload) {
  var memberType = String(payload.memberType || '').trim();
  var purpose = String(payload.purpose || '').trim();
  var contactEmail = String(payload.contactEmail || '').trim();

  var credentials = getPublicIdentityCredentials_()[memberType];
  if (!credentials) {
    return { verified: false, error: 'invalid_member_type' };
  }
  if (purpose !== 'update' && purpose !== 'withdrawal') {
    return { verified: false, error: 'invalid_purpose' };
  }
  assertPublicPortalIntakeOpen_(getOrCreateDatabase_(), purpose === 'withdrawal' ? 'WITHDRAWAL' : 'MEMBER_UPDATE');
  if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return { verified: false, error: '有効なメールアドレスを入力してください' };
  }

  // 入力された照合項目はちょうど 1 つ。複数受け付けると、どれで通ったかが
  // 分からなくなり、片方が空でも通る抜け道になる。
  var supplied = credentials.filter(function(c) {
    return c.normalize(payload[c.key]) !== '';
  });
  if (supplied.length !== 1) {
    return { verified: false, error: '照合に使う番号を 1 つだけ入力してください。' };
  }
  var credential = supplied[0];
  var idKey = credential.normalize(payload[credential.key]);

  // レート制限（同一の照合値につき 15 分以内 5 回まで）
  var cache = CacheService.getScriptCache();
  var rlKey = 'pub_id_rl_' + memberType + '_' + credential.key + '_' + idKey;
  var rlRaw = cache.get(rlKey);
  var rl = rlRaw ? JSON.parse(rlRaw) : { count: 0 };
  if (rl.count >= 5) {
    return { verified: false, error: '試行回数が上限を超えました。しばらくお待ちください。' };
  }
  rl.count++;
  cache.put(rlKey, JSON.stringify(rl), 900);

  var ss = getOrCreateDatabase_();
  var memberRows = getRowsAsObjects_(ss, 'T_会員').filter(function(r) {
    if (toBoolean_(r['削除フラグ'])) return false;
    if (isInactiveMemberStatusForIdentity_(r['会員状態コード'])) return false;
    if (String(r['会員種別コード'] || '') !== memberType) return false;
    // DB 側が空の行は、入力も空にすれば一致してしまう。空は必ず除く。
    var dbValue = credential.normalize(r[credential.column]);
    if (!dbValue || dbValue !== idKey) return false;
    return matchesPublicIdentityName_(memberType, r, payload);
  });

  if (memberRows.length !== 1) {
    return { verified: false, error: '入力内容と一致する会員情報が見つかりませんでした。' };
  }
  var member = memberRows[0];

  var memberId = String(member['会員ID'] || '');
  var applicantName = memberType === 'INDIVIDUAL'
    ? (String(member['姓'] || '') + ' ' + String(member['名'] || '')).trim()
    : String(member['勤務先名'] || '');

  // ステートレストークン（HMAC署名、CacheService非依存）
  var token = createPublicIdentityToken_(
    { memberId: memberId, memberType: memberType, contactEmail: contactEmail, applicantName: applicantName, purpose: purpose },
    1800
  );

  return { verified: true, token: token };
}

// 2026-10-13 operator 判断: 公開ポータルは登録済みの個人情報を一切返さない。
// 以前は在籍職員の一覧（氏名・フリガナ・メール・介護支援専門員番号）と在籍人数を返していた。
// 職員の変更・除籍は、申請者が入力した「今の氏名と介護支援専門員番号」で職員を特定する。

// 入力された氏名と介護支援専門員番号の 3 つがそろって一致する、その事業所の在籍職員を返す。
// 戻り値はサーバ内部でだけ使う。公開ポータルへは「一致したかどうか」以外を返さない。
// 照合規則は申請受付・照合ボタン・承認時で共通（ここが唯一の定義）。
function findPublicEnrolledStaffByIdentity_(staffRows, memberId, s) {
  var lastName = String((s && s.lastName) || '').trim();
  var firstName = String((s && s.firstName) || '').trim();
  var careManagerNumber = normalizeCmNumberForKey_(s && s.careManagerNumber);
  if (!lastName || !firstName || !/^\d{8}$/.test(careManagerNumber)) return [];
  return (staffRows || []).filter(function(r) {
    return !toBoolean_(r['削除フラグ']) &&
           String(r['会員ID'] || '') === String(memberId || '') &&
           String(r['職員状態コード'] || '') === 'ENROLLED' &&
           normalizeCmNumberForKey_(r['介護支援専門員番号']) === careManagerNumber &&
           String(r['姓'] || '').trim() === lastName &&
           String(r['名'] || '').trim() === firstName;
  });
}

// 職員の照合回数を数える。照合は「その氏名と番号の職員が在籍しているか」を確かめられてしまうので、
// トークンの有効期間（30 分）に 20 回までとする。照合ボタンと申請受付で同じ枠を使う。
function consumePublicStaffMatchQuota_(memberId, count) {
  var cache = CacheService.getScriptCache();
  var key = 'pub_staff_rl_' + String(memberId || '');
  var used = Number(cache.get(key) || 0) || 0;
  if (used + count > 20) return false;
  cache.put(key, String(used + count), 1800);
  return true;
}

// 事業所会員が入力した氏名と介護支援専門員番号で、在籍職員がちょうど 1 人に特定できるかを返す。
// 返すのは matched（真偽）だけ。職員ID・氏名・連絡先などは返さない。
function checkPublicStaffMatch_(payload) {
  var token = String(payload.token || '').trim();
  var stored = verifyPublicIdentityToken_(token);
  if (!stored) return { error: 'token_expired' };
  if (stored.memberType !== 'BUSINESS') return { error: '事業所会員専用の操作です' };
  if (!consumePublicStaffMatchQuota_(stored.memberId, 1)) {
    return { error: '照合の回数が上限を超えました。しばらくしてから最初からやり直してください。' };
  }
  var ss = getOrCreateDatabase_();
  var matches = findPublicEnrolledStaffByIdentity_(getRowsAsObjects_(ss, 'T_事業所職員'), stored.memberId, payload);
  return { matched: matches.length === 1 };
}

// 変更申請をT_変更申請に書き込む。DBは変更しない。管理者承認後に適用される。
function submitPublicChangeRequest_(payload) {
  var token = String(payload.token || '').trim();
  var stored = verifyPublicIdentityToken_(token);
  if (!stored) return { success: false, error: 'token_expired' };

  var requestType = String(payload.requestType || '').trim();
  var validTypes = ['MEMBER_UPDATE', 'WITHDRAWAL', 'STAFF_ADD', 'STAFF_REMOVE'];
  if (validTypes.indexOf(requestType) === -1) {
    return { success: false, error: 'invalid_request_type' };
  }
  consumePublicSubmissionQuota_('CHANGE_REQUEST', stored.memberId);
  // 2026-10-13: 本人確認の用途と申請の種類を一致させる。以前は変更用のトークンで退会申請も出せた。
  var expectedPurpose = requestType === 'WITHDRAWAL' ? 'withdrawal' : 'update';
  if (String(stored.purpose || '') !== expectedPurpose) {
    return { success: false, error: 'token_expired' };
  }
  assertPublicPortalIntakeOpen_(getOrCreateDatabase_(), requestType === 'WITHDRAWAL' ? 'WITHDRAWAL' : 'MEMBER_UPDATE');

  // 変更内容のallowlistフィルタ
  var allowlist = publicUpdateAllowlistFor_(stored.memberType);

  var sanitizedFields = {};
  if (payload.fields && typeof payload.fields === 'object') {
    for (var i = 0; i < allowlist.length; i++) {
      var fk = allowlist[i];
      if (Object.prototype.hasOwnProperty.call(payload.fields, fk)) {
        var rawValue = String(payload.fields[fk] || '').trim();
        // v376: kana 列は全角カタカナに正規化（不正文字は throw）
        if (fk === 'lastKana' || fk === 'firstKana') {
          rawValue = normalizeAndValidateKana_(rawValue, fk === 'lastKana' ? 'セイ' : 'メイ');
        }
        sanitizedFields[fk] = rawValue;
      }
    }
  }

  var changeData = {
    fields: sanitizedFields,
    staffAdd: [],
    staffRemove: [],
    staffUpdate: [], // v372.5: 既存職員の情報変更
  };
  if (requestType === 'WITHDRAWAL') {
    var withdrawalMethod = String(payload.withdrawalMethod || 'FISCAL_YEAR_END');
    if (withdrawalMethod !== 'FISCAL_YEAR_END' && withdrawalMethod !== 'IMMEDIATE') {
      return { success: false, error: 'invalid_withdrawal_method' };
    }
    changeData.withdrawalMethod = withdrawalMethod;
  }

  // 事業所会員: スタッフ追加（必須フィールド検証）
  // 2026-10-13: 職員の追加も事業所会員だけ。以前は個人・賛助会員の申請でも受け付け、
  // 承認すると会員IDの下に職員行が作られる作りだった（画面は事業所会員にしか欄を出さない）。
  if (Array.isArray(payload.staffAdd) && payload.staffAdd.length > 0 && stored.memberType !== 'BUSINESS') {
    return { success: false, error: '事業所会員専用の操作です' };
  }
  var staffAddProblems = [];
  if (Array.isArray(payload.staffAdd)) {
    payload.staffAdd.forEach(function(s, si) {
      var lastName = String(s.lastName || '').trim();
      var firstName = String(s.firstName || '').trim();
      // v376: kana を normalize + validate（不正なら throw → このエントリは弾かれない代わりに申請自体が失敗）
      var lastKana = normalizeAndValidateKana_(s.lastKana || '', '職員のセイ');
      var firstKana = normalizeAndValidateKana_(s.firstKana || '', '職員のメイ');
      var careManagerNumber = normalizeCmNumberForKey_(s.careManagerNumber);
      var email = String(s.email || '').trim();
      // docs/307 S9（2026-10-24）: 以前は欠けた行を黙って捨て、受付完了と返していた。
      var addProblem = !lastName || !firstName || !lastKana || !firstKana ? '氏名とフリガナを入力してください。'
        : !/^\d{8}$/.test(careManagerNumber) ? '介護支援専門員番号は 8 桁の半角数字で入力してください。'
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'メールアドレスの形式が正しくありません。'
        : '';
      if (addProblem) {
        staffAddProblems.push('追加する職員 ' + (si + 1) + ' 人目: ' + addProblem);
        return;
      }
      changeData.staffAdd.push({ lastName: lastName, firstName: firstName, lastKana: lastKana, firstKana: firstKana, careManagerNumber: careManagerNumber, email: email });
    });
  }
  if (staffAddProblems.length > 0) {
    return { success: false, error: staffAddProblems.join('\n') };
  }

  // 事業所会員: 職員の除籍と情報変更は、入力された「今の氏名と介護支援専門員番号」で職員を特定する。
  // 2026-10-13: 画面に職員一覧を出さなくなったため、特定はサーバ側だけで行う。
  // 一致しないときは申請を受け付けず、何件目が一致しないかだけを返す（登録内容は返さない）。
  var staffRemoveInput = Array.isArray(payload.staffRemove) ? payload.staffRemove : [];
  var staffUpdateInput = Array.isArray(payload.staffUpdate) ? payload.staffUpdate : [];
  if ((staffRemoveInput.length > 0 || staffUpdateInput.length > 0) && stored.memberType !== 'BUSINESS') {
    return { success: false, error: '事業所会員専用の操作です' };
  }
  var staffRowsForMatch = [];
  if (staffRemoveInput.length > 0 || staffUpdateInput.length > 0) {
    if (!consumePublicStaffMatchQuota_(stored.memberId, staffRemoveInput.length + staffUpdateInput.length)) {
      return { success: false, error: '照合の回数が上限を超えました。しばらくしてから最初からやり直してください。' };
    }
    staffRowsForMatch = getRowsAsObjects_(getOrCreateDatabase_(), 'T_事業所職員');
  }

  // 事業所会員: スタッフ除籍（姓・名・CM番号で照合）
  for (var ri = 0; ri < staffRemoveInput.length; ri++) {
    var rs = staffRemoveInput[ri] || {};
    var removeTarget = {
      lastName: String(rs.lastName || '').trim(),
      firstName: String(rs.firstName || '').trim(),
      careManagerNumber: normalizeCmNumberForKey_(rs.careManagerNumber),
    };
    var removeMatches = findPublicEnrolledStaffByIdentity_(staffRowsForMatch, stored.memberId, removeTarget);
    if (removeMatches.length !== 1) {
      return { success: false, error: '除籍する職員 ' + (ri + 1) + ' 人目: 氏名と介護支援専門員番号に一致する在籍職員が見つかりません。' };
    }
    // 代表者は除籍できない（承認時に止まる申請を受け付けない）。代表者の変更は事務局が行う。
    if (String(removeMatches[0]['職員権限コード'] || '') === 'REPRESENTATIVE') {
      return { success: false, error: '除籍する職員 ' + (ri + 1) + ' 人目は代表者のため、ここでは除籍できません。代表者の変更は事務局へご連絡ください。' };
    }
    changeData.staffRemove.push(removeTarget);
  }

  // v372.5: 事業所会員: 既存職員の情報変更（変更したいフィールドのみ含める）
  // 2026-10-13: 対象は target（今の氏名・番号）で特定し、職員IDはサーバが引く。画面から職員IDは受け取らない。
  var updateAllowlist_ = ['lastName', 'firstName', 'lastKana', 'firstKana', 'email', 'careManagerNumber'];
  for (var ui = 0; ui < staffUpdateInput.length; ui++) {
    var us = staffUpdateInput[ui] || {};
    var ut = us.target || {};
    var updateTarget = {
      lastName: String(ut.lastName || '').trim(),
      firstName: String(ut.firstName || '').trim(),
      careManagerNumber: normalizeCmNumberForKey_(ut.careManagerNumber),
    };
    var updateMatches = findPublicEnrolledStaffByIdentity_(staffRowsForMatch, stored.memberId, updateTarget);
    if (updateMatches.length !== 1) {
      return { success: false, error: '情報を変更する職員 ' + (ui + 1) + ' 人目: 氏名と介護支援専門員番号に一致する在籍職員が見つかりません。' };
    }
    var entry = { staffId: String(updateMatches[0]['職員ID'] || ''), target: updateTarget };
    var hasAny = false;
    for (var k = 0; k < updateAllowlist_.length; k++) {
      var f = updateAllowlist_[k];
      if (!Object.prototype.hasOwnProperty.call(us, f)) continue;
      var v = String(us[f] || '').trim();
      if (v === '') continue; // 空欄 = 変更なし
      // docs/307 S10（2026-10-24）: 以前は形式違いの番号・メールを黙って外し、受付完了と返していた。
      if (f === 'careManagerNumber') {
        if (!/^\d{8}$/.test(v)) return { success: false, error: '情報を変更する職員 ' + (ui + 1) + ' 人目: 変更後の介護支援専門員番号は 8 桁の半角数字で入力してください。' };
      } else if (f === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { success: false, error: '情報を変更する職員 ' + (ui + 1) + ' 人目: 変更後のメールアドレスの形式が正しくありません。' };
      } else if (f === 'lastKana' || f === 'firstKana') {
        // v376: kana 列は全角カタカナに正規化（不正文字は throw）
        v = normalizeAndValidateKana_(v, f === 'lastKana' ? '職員のセイ' : '職員のメイ');
      }
      entry[f] = v;
      hasAny = true;
    }
    if (hasAny) changeData.staffUpdate.push(entry);
  }

  // v372.6 fix: 全空の申請は拒否（fields も staffAdd/Remove/Update も空 / WITHDRAWAL は例外）
  var hasAnyChange = (changeData.fields && Object.keys(changeData.fields).length > 0)
    || (changeData.staffAdd && changeData.staffAdd.length > 0)
    || (changeData.staffRemove && changeData.staffRemove.length > 0)
    || (changeData.staffUpdate && changeData.staffUpdate.length > 0)
    || requestType === 'WITHDRAWAL';
  if (!hasAnyChange) {
    return { success: false, error: '変更内容が指定されていません。変更したい項目に入力してください。' };
  }

  var requestId = 'CR' + Date.now() + '_' + generatePublicActionToken_().slice(0, 8);
  var now = new Date().toISOString();

  var ss = getOrCreateDatabase_();
  // T_変更申請 が未作成の場合は自動作成（初回 push 後のスキーマ未反映を吸収）
  if (!ss.getSheetByName('T_変更申請')) {
    var newSheet = getOrCreateSheet_(ss, 'T_変更申請');
    writeSheetHeaders_(newSheet, テーブル定義['T_変更申請']);
  }
  appendRowsByHeaders_(ss, 'T_変更申請', [{
    申請ID: requestId,
    会員ID: stored.memberId,
    会員種別コード: stored.memberType,
    申請種別コード: requestType,
    申請状態コード: 'PENDING',
    申請内容JSON: JSON.stringify(changeData),
    連絡先メールアドレス: stored.contactEmail,
    申請者表示名: stored.applicantName,
    申請日時: now,
    処理日時: '',
    処理者メールアドレス: '',
    処理備考: '',
    作成日時: now,
    更新日時: now,
    削除フラグ: false,
  }]);

  // v368: 申請者への受付確認メール（テンプレ化）
  sendApplicationReceiptMail_(ss, {
    contactEmail: stored.contactEmail,
    applicantName: stored.applicantName,
    requestId: requestId,
    requestType: requestType,
    memberTypeLabel: memberTypeLabel_(stored.memberType),
  });
  notifyMembershipChatForMember_(ss, 'REQUEST', stored.memberId, {
    '手続種別': chatMembershipRequestTypeLabel_(requestType, changeData.withdrawalMethod),
    '申請ID': requestId,
    '日時': now,
    '変更内容': buildChangeSummaryText_(changeData, requestType),
    '異常内容': '',
  });

  return { success: true, requestId: requestId };
}
