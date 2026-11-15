// gas-src/60_mail.gs — メール（既定の文面・送信・テンプレート・一括メール・Chat 通知）。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

var CREDENTIAL_EMAIL_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】会員登録完了のお知らせ';
var CREDENTIAL_EMAIL_DEFAULT_BODY = '{{氏名}} 様\n\n会員登録が完了しました。\n以下のログイン情報で会員マイページにアクセスできます。\n\nログインID: {{ログインID}}\n初期パスワード: {{パスワード}}\n\n会員マイページURL:\n{{会員マイページURL}}\n\n初回ログイン後、パスワードの変更をお勧めします。\n\n※このメールに心当たりがない場合は、お手数ですが削除してください。\n─────────────────────────────\n枚方市介護支援専門員連絡協議会\n';

// v368: 申込受付メール（公開ポータルから申請送信時に送る短い受付確認メール）
var APPLICATION_RECEIPT_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】{{申請種別}}を受け付けました';
var APPLICATION_RECEIPT_DEFAULT_BODY = [
  '{{氏名}} 様',
  '',
  '以下の申請を受け付けました。担当者が内容を確認後、ご連絡いたします。',
  '',
  '申請ID: {{申請ID}}',
  '申請種別: {{申請種別}}',
  '受付日時: {{受付日時}}',
  '',
  '内容の確認・ご不明な点は事務局までお問い合わせください。',
  '',
  '枚方市介護支援専門員連絡協議会',
].join('\n');

// v368: 承認通知メール（管理者が承認した際に申請者へ送る通知）
var APPROVAL_NOTIFICATION_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】{{申請種別}}が承認されました';
var APPROVAL_NOTIFICATION_DEFAULT_BODY = [
  '{{氏名}} 様',
  '',
  'お申し込みいただいた内容が承認され、変更が反映されました。',
  '',
  '申請ID: {{申請ID}}',
  '申請種別: {{申請種別}}',
  '処理日時: {{処理日時}}',
  '処理者: {{処理者名}}',
  '',
  '{{変更内容サマリー}}',
  '変更内容の確認は会員マイページをご覧ください。',
  'ご不明な点は事務局までお問い合わせください。',
  '',
  '枚方市介護支援専門員連絡協議会',
].join('\n');

// v368: 却下通知メール
var REJECTION_NOTIFICATION_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】{{申請種別}}について';
var REJECTION_NOTIFICATION_DEFAULT_BODY = [
  '{{氏名}} 様',
  '',
  'お申し込みいただいた内容について、確認の結果、今回はお受けできない結果となりました。',
  '',
  '申請ID: {{申請ID}}',
  '申請種別: {{申請種別}}',
  '処理日時: {{処理日時}}',
  '',
  '理由・備考: {{処理備考}}',
  '',
  'ご不明な点は事務局までお問い合わせください。',
  '',
  '枚方市介護支援専門員連絡協議会',
].join('\n');

// v265: 事業所会員 入会時メール（代表者・メンバー別）・職員追加承認時メール デフォルトテンプレート
var BIZ_REP_EMAIL_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】事業所会員登録完了のお知らせ（代表者）';
var BIZ_REP_EMAIL_DEFAULT_BODY = [
  '{{氏名}} 様',
  '',
  '{{事業所名}}の代表者として、事業所会員登録が完了しました。',
  '以下のログイン情報で会員マイページにアクセスできます。',
  '',
  'ログインID: {{ログインID}}',
  '初期パスワード: {{パスワード}}',
  '',
  '会員マイページURL:',
  '{{会員マイページURL}}',
  '',
  '初回ログイン後、パスワードの変更をお勧めします。',
  '代表者として、事業所のメンバーの情報管理をお願いします。',
  '',
  '※このメールに心当たりがない場合は、お手数ですが削除してください。',
  '─────────────────────────────',
  '枚方市介護支援専門員連絡協議会',
].join('\n');

var BIZ_STAFF_EMAIL_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】事業所会員登録完了のお知らせ';
var BIZ_STAFF_EMAIL_DEFAULT_BODY = [
  '{{氏名}} 様',
  '',
  '{{事業所名}}のメンバーとして、事業所会員登録が完了しました。',
  '以下のログイン情報で会員マイページにアクセスできます。',
  '',
  'ログインID: {{ログインID}}',
  '初期パスワード: {{パスワード}}',
  '',
  '会員マイページURL:',
  '{{会員マイページURL}}',
  '',
  '初回ログイン後、パスワードの変更をお勧めします。',
  '',
  '※このメールに心当たりがない場合は、お手数ですが削除してください。',
  '─────────────────────────────',
  '枚方市介護支援専門員連絡協議会',
].join('\n');

var STAFF_ADD_STAFF_EMAIL_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】事業所会員メンバー追加のお知らせ';
var STAFF_ADD_STAFF_EMAIL_DEFAULT_BODY = [
  '{{氏名}} 様',
  '',
  '{{事業所名}}のメンバーとして登録されました。',
  '以下のログイン情報で会員マイページにアクセスできます。',
  '',
  'ログインID: {{ログインID}}',
  '初期パスワード: {{パスワード}}',
  '',
  '会員マイページURL:',
  '{{会員マイページURL}}',
  '',
  '初回ログイン後、パスワードの変更をお勧めします。',
  '',
  '※このメールに心当たりがない場合は、お手数ですが削除してください。',
  '─────────────────────────────',
  '枚方市介護支援専門員連絡協議会',
].join('\n');

var STAFF_ADD_REP_EMAIL_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】新メンバー追加のお知らせ';
var STAFF_ADD_REP_EMAIL_DEFAULT_BODY = [
  '{{氏名}} 様',
  '',
  '{{事業所名}}に新しいメンバーが追加されました。',
  '',
  '追加されたメンバー: {{追加職員氏名}}',
  '',
  '詳細は会員マイページよりご確認ください。',
  '会員マイページURL:',
  '{{会員マイページURL}}',
  '',
  '─────────────────────────────',
  '枚方市介護支援専門員連絡協議会',
].join('\n');
// v376.43 (Phase B): 従来ハードコードだった6メールの差し込みタグ付きデフォルト。
// 送信実体は renderConfiguredMail_ で <CAT>_SUBJECT/BODY 設定値（無ければ下記既定）を読み、差し込み置換する。
var TRAINING_APPLY_RECEIPT_DEFAULT_SUBJECT = '【研修申込確認】{{研修名}}';
var TRAINING_APPLY_RECEIPT_DEFAULT_BODY = [
  '{{申込者名}} 様',
  '',
  '以下の研修へお申込いただきありがとうございます。',
  '',
  '研修名: {{研修名}}',
  '開催日: {{開催日}}',
  '',
  '申込IDは以下の通りです。取消の際に必要ですので保管してください。',
  '申込ID: {{申込ID}}',
  '',
  '何かご不明な点は主催者までお問い合わせください。',
].join('\n');

var TRAINING_REMINDER_DEFAULT_SUBJECT = '【研修リマインド】{{研修名}}';
var TRAINING_REMINDER_DEFAULT_BODY = [
  '会員各位',
  '',
  '平素よりお世話になっております。',
  '枚方市介護支援専門員連絡協議会 事務局です。',
  '',
  'お申し込み済みの研修が近づいていますので、ご案内いたします。',
  '',
  '■研修名',
  '{{研修名}}',
  '',
  '■開催日',
  '{{開催日}}',
  '',
  '■会場',
  '{{会場}}',
  '',
  '当日の案内資料と詳細は、配布済みのご案内をご確認ください。',
  '',
  '何卒よろしくお願いいたします。',
  '',
  '枚方市介護支援専門員連絡協議会 事務局',
].join('\n');

var AUTH_OTP_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】{{用途}} 確認コード';
var AUTH_OTP_DEFAULT_BODY = [
  '{{会員名}} 様',
  '',
  '{{用途}}の認証コードをお送りします。',
  '',
  '認証コード: {{認証コード}}',
  '',
  'このコードは{{有効期限}}有効です。',
  'お心当たりのない場合は事務局までご連絡ください。',
  '',
  '枚方市介護支援専門員連絡協議会',
].join('\n');

// 会員情報変更確認メール（個人会員が公開ポータルで自身の登録情報を変更した際の確認）。
// ※事業所登録情報変更・職員追加/除籍に伴う内部通知は別文面（固定）で送られる別サブケース。
var MEMBER_UPDATE_CONFIRM_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】会員登録情報変更のご確認';
var MEMBER_UPDATE_CONFIRM_DEFAULT_BODY = [
  '{{氏名}} 様',
  '',
  '会員登録情報の変更を受け付けました。',
  '内容にお心当たりのない場合は事務局までご連絡ください。',
  '',
  '枚方市介護支援専門員連絡協議会',
].join('\n');

// v376.99: ログインIDが変わったことを伝える通知。
// 以前は公開ポータルの画面に「⚠ 変更するとログインIDも変わります」と書いていたが、
// 会員マイページを展開していない現状では読んでも行き場がなく、矛盾した案内になる。
// 変わった事実を、変わった後にメールで伝える方式へ改めた。
var LOGIN_ID_CHANGED_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】ログインIDの変更のお知らせ';
var LOGIN_ID_CHANGED_DEFAULT_BODY = [
  '{{氏名}} 様',
  '',
  'ご登録内容の変更にともない、ログインIDが変更されました。',
  '',
  '旧ログインID: {{旧ログインID}}',
  '新ログインID: {{新ログインID}}',
  '',
  'パスワードは変更されていません。',
  'お心当たりのない場合は、お早めに事務局までご連絡ください。',
  '',
  '枚方市介護支援専門員連絡協議会',
].join('\n');

// v376.99: 連絡先メールアドレス変更の通知。旧・新の両方へ送る（乗っ取り検知のため）。
// 以前は職員情報変更の承認処理に固定文が直書きされており、管理画面から直せなかった。
var CONTACT_EMAIL_CHANGED_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】登録メールアドレス変更のお知らせ';
var CONTACT_EMAIL_CHANGED_DEFAULT_BODY = [
  '{{氏名}} 様',
  '',
  'ご登録のメールアドレスが変更されました（この案内は{{宛先区分}}宛です）。',
  '',
  '旧アドレス: {{旧メールアドレス}}',
  '新アドレス: {{新メールアドレス}}',
  '',
  '今後のご連絡は新アドレス宛てに送信されます。',
  'お心当たりのない場合は、お早めに事務局までご連絡ください。',
  '',
  '枚方市介護支援専門員連絡協議会',
].join('\n');

var WITHDRAWAL_CONFIRM_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】退会申請受付のご確認';
// v376.99: 「（年度末）」を直書きしていたため、v376.92 で入った即時退会でも
// 年度末と書かれてしまっていた。方式は差し込みタグで出す。
var WITHDRAWAL_CONFIRM_DEFAULT_BODY = [
  '{{会員名}} 様',
  '',
  '退会のお手続きが完了しました。',
  '',
  '退会方式: {{退会方式}}',
  '退会日: {{退会予定日}}',
  '',
  'お心当たりのない場合は事務局までご連絡ください。',
  '',
  '枚方市介護支援専門員連絡協議会',
].join('\n');

var PASSWORD_RESET_DEFAULT_SUBJECT = '【枚方市介護支援専門員連絡協議会】パスワード再設定手続き';
var PASSWORD_RESET_DEFAULT_BODY = [
  '{{ユーザー名}} 様',
  '',
  '会員マイページのパスワード再設定を受け付けました。',
  '以下の確認コードを画面に入力し、新しいパスワードを設定してください。',
  '',
  '確認コード: {{確認コード}}',
  '有効期限: {{有効期限}}',
  '',
  'この手続きに心当たりがない場合は、このメールを破棄してください。',
  '確認コードを他の人に伝えないでください。',
  '',
  '会員マイページURL:',
  '{{会員マイページURL}}',
  '',
  '─────────────────────────────',
  '枚方市介護支援専門員連絡協議会',
].join('\n');

// ── ログイン情報メール送信 ──────────────────────────────────
/**
 * 入会時認証情報メールを送信する。
 * opts.subject / opts.body にマージタグを含むテンプレートを渡す。
 * 利用可能マージタグ: {{氏名}} {{ログインID}} {{パスワード}} {{会員マイページURL}}
 * opts を省略した場合はデフォルトテンプレートを使用する。
 */
// v265: {{変数名}} プレースホルダーを vars オブジェクトで置換するヘルパー
// v376.67: 汎用の差し込みレンダラ。名前が「Biz」だったため事業所専用に見え、
// 他機能が別ルートの置換を書く誘因になっていた（v376.66 の障害の遠因）。
// 実際は事業所メール・研修メール・研修リマインダーが共用する共通実装。
// **メール本文の差し込みは必ずこの関数を通すこと**（渡していないタグは
// deliverMail_ の stripUnresolvedMergeTags_ が送信直前に除去する）。
function renderMergeTags_(template, vars) {
  var result = String(template || '');
  var keys = Object.keys(vars);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    result = result.replace(new RegExp('\\{\\{' + k + '\\}\\}', 'g'), String(vars[k] == null ? '' : vars[k]));
  }
  return result;
}

// T_システム設定の <CAT>_SUBJECT/BODY を読み、差し込み置換して返す。
// 初期文面はスキーマ整備時だけ投入する。保存済みの設定が空・認証コードを欠く場合は送らずに止める。
function renderConfiguredMail_(ss, subjectKey, bodyKey, defaultSubject, defaultBody, vars, requiredValue) {
  var map = {};
  try { map = getSystemSettingMap_(ss); } catch (e) { throw new Error('メール設定を読み込めません。'); }
  var subjTpl = requireConfiguredMailText_(map[subjectKey], 'メールの件名', true);
  var bodyTpl = requireConfiguredMailText_(map[bodyKey], 'メールの本文', false);
  var subject = renderMergeTags_(subjTpl, vars);
  var body = renderMergeTags_(bodyTpl, vars);
  if (requiredValue && body.indexOf(String(requiredValue)) < 0) {
    throw new Error('認証コードを含むメール本文を設定してください。');
  }
  return { subject: subject, body: body };
}




// v368: 申込受付メール送信ヘルパー（公開ポータル申請受付時に使用）
// ── Google Chat: 会員手続き通知 ────────────────────────────────────────────
// Webhook URL は設定テーブルに保存しない。3 split の Script Properties に同じキーを設定する。
var CHAT_MEMBERSHIP_WEBHOOK_URL_PROPERTY = 'CHAT_MEMBERSHIP_WEBHOOK_URL';
var CHAT_MEMBERSHIP_REQUEST_DEFAULT_BODY = '【会員手続き受付】\n手続き: {{手続種別}}\n会員: {{会員名}}\n会員種別: {{会員種別}}\n申請ID: {{申請ID}}\n受付日時: {{日時}}\n{{変更内容}}';
var CHAT_MEMBERSHIP_FINAL_DEFAULT_BODY = '【会員手続き確定】\n手続き: {{手続種別}}\n会員: {{会員名}}\n会員種別: {{会員種別}}\n申請ID: {{申請ID}}\n確定日時: {{日時}}\n{{変更内容}}';
var CHAT_MEMBERSHIP_ANOMALY_DEFAULT_BODY = '【会員手続き 要確認】\n手続き: {{手続種別}}\n会員: {{会員名}}\n会員ID: {{会員ID}}\n申請ID: {{申請ID}}\n日時: {{日時}}\n内容: {{異常内容}}';
var CHAT_MEMBERSHIP_TEMPLATE_TAGS = ['通知種別', '手続種別', '会員種別', '会員名', '会員ID', '申請ID', '日時', '変更内容', '異常内容'];

function validateChatMembershipTemplate_(template) {
  var text = String(template || '');
  if (text.length > 2000) throw new Error('Google Chat 通知本文は 2000 文字以内で設定してください。');
  var matches = text.match(/{{[^{}]+}}/g) || [];
  for (var i = 0; i < matches.length; i++) {
    var tag = matches[i].slice(2, -2).trim();
    if (CHAT_MEMBERSHIP_TEMPLATE_TAGS.indexOf(tag) < 0) {
      throw new Error('Google Chat 通知本文に使用できない差し込みタグがあります: ' + tag);
    }
  }
  if (/{{|}}/.test(text.replace(/{{[^{}]+}}/g, ''))) {
    throw new Error('Google Chat 通知本文の差し込みタグの書式が不正です。');
  }
}

function getChatMembershipNotificationSettings_(ss) {
  return {
    enabled: String(getSystemSettingValue_(ss, 'CHAT_MEMBERSHIP_NOTIFICATION_ENABLED') || '') === 'true',
    requestEnabled: isSystemSettingEnabled_(ss, 'CHAT_MEMBERSHIP_REQUEST_ENABLED', true),
    finalEnabled: isSystemSettingEnabled_(ss, 'CHAT_MEMBERSHIP_FINAL_ENABLED', true),
    anomalyEnabled: isSystemSettingEnabled_(ss, 'CHAT_MEMBERSHIP_ANOMALY_ENABLED', true),
    requestBody: String(getSystemSettingValue_(ss, 'CHAT_MEMBERSHIP_REQUEST_BODY') || '') || CHAT_MEMBERSHIP_REQUEST_DEFAULT_BODY,
    finalBody: String(getSystemSettingValue_(ss, 'CHAT_MEMBERSHIP_FINAL_BODY') || '') || CHAT_MEMBERSHIP_FINAL_DEFAULT_BODY,
    anomalyBody: String(getSystemSettingValue_(ss, 'CHAT_MEMBERSHIP_ANOMALY_BODY') || '') || CHAT_MEMBERSHIP_ANOMALY_DEFAULT_BODY,
  };
}

function renderChatMembershipTemplate_(template, context) {
  var values = context || {};
  return String(template || '').replace(/{{([^{}]+)}}/g, function(_, rawTag) {
    var tag = String(rawTag || '').trim();
    return Object.prototype.hasOwnProperty.call(values, tag) ? String(values[tag] || '') : '';
  }).replace(/\n{3,}/g, '\n\n').trim();
}

// 同じ申請IDの受付・処理完了を1スレッドへまとめる。申請IDは業務上の主キーであり、
// 個人情報やWebhook応答の識別子をDBへ保存する必要がない。
function buildMembershipChatThreadKey_(context) {
  var requestId = String((context || {})['申請ID'] || '').trim();
  if (!requestId) return '';
  return ('membership-request-' + requestId).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 240);
}

function withChatWebhookQueryParameter_(url, key, value) {
  var source = String(url || '');
  var hashIndex = source.indexOf('#');
  var hash = hashIndex >= 0 ? source.slice(hashIndex) : '';
  var withoutHash = hashIndex >= 0 ? source.slice(0, hashIndex) : source;
  var questionIndex = withoutHash.indexOf('?');
  var path = questionIndex >= 0 ? withoutHash.slice(0, questionIndex) : withoutHash;
  var query = questionIndex >= 0 ? withoutHash.slice(questionIndex + 1).split('&') : [];
  var encodedKey = encodeURIComponent(key);
  var filtered = query.filter(function(item) {
    return item && item.split('=')[0] !== encodedKey;
  });
  filtered.push(encodedKey + '=' + encodeURIComponent(value));
  return path + '?' + filtered.join('&') + hash;
}

function getMembershipChatMemberContext_(ss, memberId, fallback) {
  var row = getRowsAsObjects_(ss, 'T_会員').filter(function(item) {
    // 退会（年度途中を含む）直後も確定通知に会員表示名を使う。
    return String(item['会員ID'] || '') === String(memberId || '');
  })[0] || {};
  var memberType = String(row['会員種別コード'] || (fallback && fallback.memberType) || '');
  var memberName = memberType === 'BUSINESS'
    ? String(row['勤務先名'] || (fallback && fallback.memberName) || '').trim()
    : String(row['氏名'] || joinHumanNameParts_(row['姓'], row['名']) || (fallback && fallback.memberName) || '').trim();
  return {
    memberId: String(memberId || (fallback && fallback.memberId) || ''),
    memberName: memberName || '（未設定）',
    memberType: memberTypeLabel_(memberType) || '（未設定）',
  };
}

function notifyMembershipChatSafely_(ss, eventType, context) {
  try {
    var settings = getChatMembershipNotificationSettings_(ss);
    var eventKey = String(eventType || '');
    if (!settings.enabled ||
        (eventKey === 'REQUEST' && !settings.requestEnabled) ||
        (eventKey === 'FINAL' && !settings.finalEnabled) ||
        (eventKey === 'ANOMALY' && !settings.anomalyEnabled)) return { skipped: true };

    var webhookUrl = PropertiesService.getScriptProperties().getProperty(CHAT_MEMBERSHIP_WEBHOOK_URL_PROPERTY);
    if (!webhookUrl) {
      Logger.log('Google Chat membership notification skipped: webhook property is not configured.');
      return { skipped: true };
    }
    var bodyTemplate = eventKey === 'REQUEST' ? settings.requestBody : (eventKey === 'ANOMALY' ? settings.anomalyBody : settings.finalBody);
    var notificationLabels = { REQUEST: '受付', FINAL: '確定', ANOMALY: '要確認' };
    var values = context || {};
    values['通知種別'] = notificationLabels[eventKey] || '通知';
    values['日時'] = values['日時'] || Utilities.formatDate(new Date(), 'Asia/Tokyo', "yyyy-MM-dd HH:mm:ss");
    var text = renderChatMembershipTemplate_(bodyTemplate, values);
    if (!text) return { skipped: true };
    var threadKey = buildMembershipChatThreadKey_(values);
    var payload = { text: text };
    if (threadKey) {
      payload.thread = { threadKey: threadKey };
      webhookUrl = withChatWebhookQueryParameter_(webhookUrl, 'messageReplyOption', 'REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD');
    }
    var response = UrlFetchApp.fetch(webhookUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });
    var status = response.getResponseCode();
    if (status < 200 || status >= 300) Logger.log('Google Chat membership notification failed: HTTP ' + status);
    return { sent: status >= 200 && status < 300, status: status };
  } catch (e) {
    // 通知障害は会員の受付・確定処理を失敗させない。
    Logger.log('Google Chat membership notification failed.');
    return { sent: false };
  }
}

function notifyMembershipChatForMember_(ss, eventType, memberId, details) {
  var member = getMembershipChatMemberContext_(ss, memberId, details || {});
  var context = details || {};
  context['会員ID'] = member.memberId;
  context['会員名'] = member.memberName;
  context['会員種別'] = member.memberType;
  return notifyMembershipChatSafely_(ss, eventType, context);
}

function chatMembershipRequestTypeLabel_(requestType, withdrawalMethod) {
  var labels = {
    MEMBER_APPLICATION: '入会申請', MEMBER_UPDATE: '会員情報変更',
    WITHDRAWAL: withdrawalMethod === 'IMMEDIATE' ? '退会申請（即時）' : '退会申請（年度末）',
    STAFF_ADD: '職員追加', STAFF_REMOVE: '職員除籍',
  };
  return labels[String(requestType || '')] || '会員手続き';
}

function sendApplicationReceiptMail_(ss, params) {
  // params: { contactEmail, applicantName, requestId, requestType, memberTypeLabel, receivedAt }
  if (!params || !params.contactEmail) return;
  if (!isSystemSettingEnabled_(ss, 'APPLICATION_RECEIPT_ENABLED', true)) return;
  var subjectTpl = requireConfiguredMailText_(getSystemSettingValue_(ss, 'APPLICATION_RECEIPT_SUBJECT'), '公開ポータル申請受付時：受付確認メール件名', true);
  var bodyTpl = requireConfiguredMailText_(getSystemSettingValue_(ss, 'APPLICATION_RECEIPT_BODY'), '公開ポータル申請受付時：受付確認メール本文', false);
  var vars = {
    '氏名': params.applicantName || '',
    '会員種別ラベル': params.memberTypeLabel || '',
    '申請種別': REQUEST_TYPE_LABEL_[params.requestType] || params.requestType || '',
    '申請ID': params.requestId || '',
    '受付日時': params.receivedAt || Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm'),
  };
  try {
    deliverMail_('APPLICATION_RECEIPT', params.contactEmail, renderMergeTags_(subjectTpl, vars), renderMergeTags_(bodyTpl, vars));
  } catch (e) {
    Logger.log('[sendApplicationReceiptMail_] failed: ' + e.message);
  }
}

// v368: 承認通知メール送信ヘルパー
function sendApprovalNotificationMail_(ss, params) {
  // params: { contactEmail, applicantName, requestId, requestType, processedAt, processorName, changeSummary }
  if (!params || !params.contactEmail) return;
  if (!isSystemSettingEnabled_(ss, 'APPROVAL_NOTIFICATION_ENABLED', true)) return;
  var subjectTpl = requireConfiguredMailText_(getSystemSettingValue_(ss, 'APPROVAL_NOTIFICATION_SUBJECT'), '管理者承認時：承認通知メール件名', true);
  var bodyTpl = requireConfiguredMailText_(getSystemSettingValue_(ss, 'APPROVAL_NOTIFICATION_BODY'), '管理者承認時：承認通知メール本文', false);
  var vars = {
    '氏名': params.applicantName || '',
    '会員種別ラベル': params.memberTypeLabel || '',
    '申請種別': REQUEST_TYPE_LABEL_[params.requestType] || params.requestType || '',
    '申請ID': params.requestId || '',
    '処理日時': params.processedAt || Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm'),
    '処理者名': params.processorName || '事務局',
    '変更内容サマリー': params.changeSummary || '',
  };
  try {
    deliverMail_('APPROVAL_NOTIFICATION', params.contactEmail, renderMergeTags_(subjectTpl, vars), renderMergeTags_(bodyTpl, vars));
  } catch (e) {
    Logger.log('[sendApprovalNotificationMail_] failed: ' + e.message);
  }
}

// v368: 却下通知メール送信ヘルパー
function sendRejectionNotificationMail_(ss, params) {
  // params: { contactEmail, applicantName, requestId, requestType, processedAt, processorName, note }
  if (!params || !params.contactEmail) return;
  if (!isSystemSettingEnabled_(ss, 'REJECTION_NOTIFICATION_ENABLED', true)) return;
  var subjectTpl = requireConfiguredMailText_(getSystemSettingValue_(ss, 'REJECTION_NOTIFICATION_SUBJECT'), '管理者却下時：却下通知メール件名', true);
  var bodyTpl = requireConfiguredMailText_(getSystemSettingValue_(ss, 'REJECTION_NOTIFICATION_BODY'), '管理者却下時：却下通知メール本文', false);
  var vars = {
    '氏名': params.applicantName || '',
    '会員種別ラベル': params.memberTypeLabel || '',
    '申請種別': REQUEST_TYPE_LABEL_[params.requestType] || params.requestType || '',
    '申請ID': params.requestId || '',
    '処理日時': params.processedAt || Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm'),
    '処理者名': params.processorName || '事務局',
    '処理備考': params.note || '',
  };
  try {
    deliverMail_('REJECTION_NOTIFICATION', params.contactEmail, renderMergeTags_(subjectTpl, vars), renderMergeTags_(bodyTpl, vars));
  } catch (e) {
    Logger.log('[sendRejectionNotificationMail_] failed: ' + e.message);
  }
}

// v265: 事業所メール設定をまとめて取得するヘルパー（T_システム設定から）
function getBizEmailSettings_(ss) {
  var m = getSystemSettingMap_(ss);
  var toB = function(key, def) {
    var v = m[key];
    return (v === '' || v === null || v === undefined) ? def : String(v) !== 'false';
  };
  return {
    bizRepEmailEnabled:      toB('BIZ_REP_EMAIL_ENABLED', true),
    bizRepEmailSubject:      String(m['BIZ_REP_EMAIL_SUBJECT'] || ''),
    bizRepEmailBody:         String(m['BIZ_REP_EMAIL_BODY'] || ''),
    bizStaffEmailEnabled:    toB('BIZ_STAFF_EMAIL_ENABLED', true),
    bizStaffEmailSubject:    String(m['BIZ_STAFF_EMAIL_SUBJECT'] || ''),
    bizStaffEmailBody:       String(m['BIZ_STAFF_EMAIL_BODY'] || ''),
    staffAddStaffEmailEnabled: toB('STAFF_ADD_STAFF_EMAIL_ENABLED', true),
    staffAddStaffEmailSubject: String(m['STAFF_ADD_STAFF_EMAIL_SUBJECT'] || ''),
    staffAddStaffEmailBody:    String(m['STAFF_ADD_STAFF_EMAIL_BODY'] || ''),
    staffAddRepEmailEnabled:   toB('STAFF_ADD_REP_EMAIL_ENABLED', true),
    staffAddRepEmailSubject:   String(m['STAFF_ADD_REP_EMAIL_SUBJECT'] || ''),
    staffAddRepEmailBody:      String(m['STAFF_ADD_REP_EMAIL_BODY'] || ''),
  };
}

function sendCredentialEmail_(toEmail, loginId, password, memberName, opts) {
  opts = opts || {};
  var from = String(opts.from || '').trim();
  var subject = requireConfiguredMailText_(opts.subject, '入会時認証情報メールの件名', true);
  var bodyTemplate = requireConfiguredMailText_(opts.body, '入会時認証情報メールの本文', false);
  // v219: 年会費を「3,000円」形式にフォーマット（v376.66 で共通関数化）
  var annualFeeStr = formatAnnualFee_(opts.annualFee);
  var body = bodyTemplate
    .replace(/\{\{氏名\}\}/g, memberName)
    .replace(/\{\{ログインID\}\}/g, loginId)
    .replace(/\{\{パスワード\}\}/g, password)
    .replace(/\{\{会員マイページURL\}\}/g, MEMBER_PORTAL_URL)
    .replace(/\{\{会員種別\}\}/g, opts.memberTypeLabel || '')
    .replace(/\{\{年会費\}\}/g, annualFeeStr);
  // replyTo は from が設定されている場合のみ設定する。
  // Session.getEffectiveUser() は userinfo.email スコープが必要で、
  // 統合・会員 split では v263 スコープ削減により使用不可。
  return deliverMail_('CREDENTIAL_EMAIL', toEmail, subject, body, {
    from: from,
    replyTo: from || '',
    name: '枚方市介護支援専門員連絡協議会',
  });
}

// ── メールテンプレート管理（v376.42 で全メール種別へ汎用化）─────────────
// T_メールテンプレート テーブルに集約。カテゴリ列で種別を区別する。
// runtime のメール本文は従来どおり T_システム設定 の <CAT>_SUBJECT/BODY を使用し、
// 本テーブルは名前付きスナップショットの保存/読込専用（送信経路の正本にはしない）。
// 上書き保存 = payload.id 一致で update、無ければ新規 insert。

var MAIL_TEMPLATE_CATEGORIES_ = [
  'CREDENTIAL', 'BIZ_REP', 'BIZ_STAFF', 'STAFF_ADD_STAFF', 'STAFF_ADD_REP',
  'APPLICATION_RECEIPT', 'APPROVAL_NOTIFICATION', 'REJECTION_NOTIFICATION',
  'TRAINING_APPLY_RECEIPT', 'TRAINING_REMINDER', 'AUTH_OTP',
  'MEMBER_UPDATE_CONFIRM', 'WITHDRAWAL_CONFIRM', 'PASSWORD_RESET',
  'LOGIN_ID_CHANGED', 'CONTACT_EMAIL_CHANGED'
];

function normalizeMailTemplateCategory_(category) {
  var c = String(category || '').trim().toUpperCase();
  if (MAIL_TEMPLATE_CATEGORIES_.indexOf(c) < 0) {
    throw new Error('不正なメールテンプレートカテゴリです: ' + c);
  }
  return c;
}

function mailTemplateRecordFromRow_(r) {
  var updatedAt = String(r['更新日時'] || '');
  var createdAt = String(r['作成日時'] || '');
  return {
    id: String(r['テンプレートID'] || ''),
    category: String(r['カテゴリ'] || ''),
    name: String(r['名前'] || ''),
    subject: String(r['件名'] || ''),
    body: String(r['本文'] || ''),
    isDefault: toBoolean_(r['既定フラグ']),
    savedAt: updatedAt || createdAt,
    updatedAt: updatedAt,
    createdAt: createdAt,
  };
}

// 汎用一覧取得。payload.category 指定時はそのカテゴリのみ。更新日時の降順。
function listMailTemplates_(payload) {
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var category = (payload && payload.category) ? normalizeMailTemplateCategory_(payload.category) : '';
  var rows = getRowsAsObjects_(ss, 'T_メールテンプレート').filter(function(r) {
    if (toBoolean_(r['削除フラグ'])) return false;
    if (category && String(r['カテゴリ'] || '').toUpperCase() !== category) return false;
    return true;
  });
  var list = rows.map(mailTemplateRecordFromRow_);
  list.sort(function(a, b) { return String(b.updatedAt).localeCompare(String(a.updatedAt)); });
  return { templates: list };
}

// 汎用保存。payload.id 一致で上書き update、無ければ新規 insert。
function saveMailTemplate_(payload) {
  if (!payload) throw new Error('payload が空です。');
  var category = normalizeMailTemplateCategory_(payload.category);
  if (!String(payload.name || '').trim()) throw new Error('テンプレート名は必須です。');
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var sheet = ss.getSheetByName('T_メールテンプレート');
  if (!sheet) throw new Error('T_メールテンプレート シートが見つかりません。');
  var nowIso = new Date().toISOString();
  var name = String(payload.name).trim();
  var subject = String(payload.subject || '');
  var body = String(payload.body || '');
  var id = payload.id ? String(payload.id) : '';

  if (id) {
    // 上書き update
    var found = findRowByColumnValue_(sheet, 'テンプレートID', id);
    if (!found || toBoolean_(found.row[found.columns['削除フラグ']])) {
      throw new Error('更新対象のテンプレートが見つかりません。');
    }
    var existingCategory = String(found.row[found.columns['カテゴリ']] || '').toUpperCase();
    var createdAt = String(found.row[found.columns['作成日時']] || '');
    var isDefault = toBoolean_(found.row[found.columns['既定フラグ']]);
    var row = found.row.slice();
    row[found.columns['名前']] = name;
    row[found.columns['件名']] = subject;
    row[found.columns['本文']] = body;
    row[found.columns['更新日時']] = nowIso;
    sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
    return {
      id: id, category: existingCategory || category, name: name, subject: subject, body: body,
      isDefault: isDefault, savedAt: nowIso, updatedAt: nowIso, createdAt: createdAt,
    };
  }

  // 新規 insert
  var newId = Utilities.getUuid();
  appendRowsByHeaders_(ss, 'T_メールテンプレート', [{
    'テンプレートID': newId,
    'カテゴリ': category,
    '名前': name,
    '件名': subject,
    '本文': body,
    '既定フラグ': false,
    '作成日時': nowIso,
    '更新日時': nowIso,
    '削除フラグ': false,
  }]);
  return {
    id: newId, category: category, name: name, subject: subject, body: body,
    isDefault: false, savedAt: nowIso, updatedAt: nowIso, createdAt: nowIso,
  };
}

// 汎用削除（soft delete）。
function deleteMailTemplate_(payload) {
  if (!payload || !payload.id) throw new Error('テンプレートIDは必須です。');
  var ss = getOrCreateDatabase_();
  initializeSchemaIfNeeded_(ss);
  var sheet = ss.getSheetByName('T_メールテンプレート');
  if (!sheet) throw new Error('T_メールテンプレート シートが見つかりません。');
  var found = findRowByColumnValue_(sheet, 'テンプレートID', String(payload.id));
  if (!found || toBoolean_(found.row[found.columns['削除フラグ']])) {
    throw new Error('指定テンプレートが見つかりません。');
  }
  var row = found.row.slice();
  row[found.columns['削除フラグ']] = true;
  row[found.columns['更新日時']] = new Date().toISOString();
  sheet.getRange(found.rowNumber, 1, 1, row.length).setValues([row]);
  return { deletedId: String(payload.id) };
}

// 旧 T_システム設定 の CREDENTIAL_EMAIL_TEMPLATES（JSON 配列）を T_メールテンプレート へ移行。
// id 一致で重複スキップするため冪等。旧 JSON キーはロールバック用に削除しない。
function migrateCredentialTemplatesToTable_(ss) {
  var sheet = ss.getSheetByName('T_メールテンプレート');
  if (!sheet) return;
  var raw = getSystemSettingValue_(ss, 'CREDENTIAL_EMAIL_TEMPLATES');
  if (!raw) return;
  var legacy;
  try { legacy = JSON.parse(raw); } catch (e) { return; }
  if (!Array.isArray(legacy) || legacy.length === 0) return;
  var existing = getRowsAsObjects_(ss, 'T_メールテンプレート');
  var existingIds = {};
  for (var i = 0; i < existing.length; i += 1) existingIds[String(existing[i]['テンプレートID'] || '')] = true;
  var toAppend = [];
  for (var j = 0; j < legacy.length; j += 1) {
    var t = legacy[j] || {};
    var id = String(t.id || '');
    if (!id || existingIds[id]) continue;
    var savedAt = String(t.savedAt || new Date().toISOString());
    toAppend.push({
      'テンプレートID': id,
      'カテゴリ': 'CREDENTIAL',
      '名前': String(t.name || ''),
      '件名': String(t.subject || ''),
      '本文': String(t.body || ''),
      '既定フラグ': false,
      '作成日時': savedAt,
      '更新日時': savedAt,
      '削除フラグ': false,
    });
  }
  if (toAppend.length > 0) {
    appendRowsByHeaders_(ss, 'T_メールテンプレート', toAppend);
    Logger.log('[migrateCredentialTemplatesToTable_] migrated ' + toAppend.length + ' credential templates to T_メールテンプレート');
  }
}

// ── 後方互換: 旧 credential 専用 action は汎用関数へ委譲（単一情報源を維持）──
function getCredentialEmailTemplates_() {
  return listMailTemplates_({ category: 'CREDENTIAL' }).templates;
}

function saveCredentialEmailTemplate_(payload) {
  payload = payload || {};
  return saveMailTemplate_({
    id: payload.id, category: 'CREDENTIAL', name: payload.name, subject: payload.subject, body: payload.body,
  });
}

function deleteCredentialEmailTemplate_(payload) {
  return deleteMailTemplate_(payload);
}

// ── 一括メール テンプレート管理（v224）──────────────────
// T_システム設定 の BULK_MAIL_TEMPLATES キーに JSON 配列で保存
// [{id, name, subject, body, savedAt}, ...]

function getBulkMailTemplates_() {
  var ss = getOrCreateDatabase_();
  var raw = getSystemSettingValue_(ss, 'BULK_MAIL_TEMPLATES');
  if (!raw) return [];
  try { return JSON.parse(raw); } catch (e) { return []; }
}

function saveBulkMailTemplate_(payload) {
  if (!payload || !String(payload.name || '').trim()) throw new Error('テンプレート名は必須です。');
  var ss = getOrCreateDatabase_();
  var templates = getBulkMailTemplates_();
  var id = payload.id ? String(payload.id) : Utilities.getUuid();
  var now = new Date().toISOString();
  var idx = templates.findIndex(function(t) { return t.id === id; });
  var record = {
    id: id,
    name: String(payload.name).trim(),
    subject: String(payload.subject || ''),
    body: String(payload.body || ''),
    savedAt: now,
  };
  if (idx >= 0) {
    templates[idx] = record;
  } else {
    templates.push(record);
  }
  batchUpsertSystemSettings_(ss, [
    { key: 'BULK_MAIL_TEMPLATES', value: JSON.stringify(templates), description: '一括メールテンプレート一覧（JSON）' }
  ]);
  return record;
}

function deleteBulkMailTemplate_(payload) {
  if (!payload || !payload.id) throw new Error('テンプレートIDは必須です。');
  var ss = getOrCreateDatabase_();
  var templates = getBulkMailTemplates_();
  var before = templates.length;
  templates = templates.filter(function(t) { return t.id !== String(payload.id); });
  if (templates.length === before) throw new Error('指定テンプレートが見つかりません。');
  batchUpsertSystemSettings_(ss, [
    { key: 'BULK_MAIL_TEMPLATES', value: JSON.stringify(templates), description: '一括メールテンプレート一覧（JSON）' }
  ]);
  return { deletedId: payload.id };
}

function getAdminEmailAliases_() {
  if (!checkAdminBySession_()) return JSON.stringify({ success: false, error: 'unauthorized' });
  var ownerEmail = Session.getEffectiveUser().getEmail();
  try {
    return JSON.stringify({
      success: true,
      data: {
        aliases: listAvailableSendAsAddresses_(),
        warning: '',
      },
    });
  } catch (e) {
    var detail = String(e && e.message ? e.message : e);
    return JSON.stringify({
      success: true,
      data: {
        aliases: [ownerEmail],
        warning: buildSendAsPermissionError_(detail),
      },
    });
  }
}

function buildSendAsPermissionError_(detail) {
  var suffix = detail ? ' 詳細: ' + detail : '';
  return '送信エイリアスの利用に必要な Gmail 権限が不足しています。/exec を開いて再承認し、再度お試しください。' + suffix;
}

function listAvailableSendAsAddresses_() {
  var ownerEmail = Session.getEffectiveUser().getEmail();
  var aliases = [ownerEmail];
  var seen = {};
  seen[ownerEmail] = true;

  var response = UrlFetchApp.fetch('https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs', {
    method: 'get',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true,
  });

  var code = response.getResponseCode();
  if (code !== 200) {
    var detail = '';
    try {
      var errorBody = JSON.parse(response.getContentText() || '{}');
      detail = String(((errorBody.error || {}).message) || '').trim();
    } catch (parseError) {}
    throw new Error(buildSendAsPermissionError_(detail));
  }

  var body = JSON.parse(response.getContentText() || '{}');
  var sendAsList = body.sendAs || [];
  sendAsList.forEach(function(item) {
    var email = String((item || {}).sendAsEmail || '').trim();
    if (email && !seen[email]) {
      seen[email] = true;
      aliases.push(email);
    }
  });
  return aliases;
}

function validateRequestedFromAddress_(from, ownerEmail) {
  var requested = String(from || '').trim();
  if (!requested) return ownerEmail;
  if (requested === ownerEmail) return ownerEmail;

  var aliases = listAvailableSendAsAddresses_();
  if (aliases.indexOf(requested) < 0) {
    throw new Error('指定した送信元アドレスは、この Gmail アカウントで利用可能な送信エイリアスに登録されていません: ' + requested);
  }
  return requested;
}

// ── メール配信状態（停止 / 通常送信 / テスト集約）─────────────────────────────
// MAIL_DELIVERY_STATE が正本。旧3キーは既存リリースへ戻す場合だけの互換値であり、
// 新しい画面・新しい実行判定ではこれらを個別に判断しない。
var MAIL_DELIVERY_STATE_STOPPED_ = 'STOPPED';
var MAIL_DELIVERY_STATE_LIVE_ = 'LIVE';
var MAIL_DELIVERY_STATE_REDIRECT_ = 'REDIRECT';

function normalizeMailDeliveryState_(value) {
  var state = String(value || '').trim().toUpperCase();
  return [MAIL_DELIVERY_STATE_STOPPED_, MAIL_DELIVERY_STATE_LIVE_, MAIL_DELIVERY_STATE_REDIRECT_].indexOf(state) >= 0
    ? state
    : MAIL_DELIVERY_STATE_STOPPED_;
}

function getMailDeliveryState_(settingsMap) {
  var map = settingsMap || {};
  var explicit = String(map['MAIL_DELIVERY_STATE'] || '').trim().toUpperCase();
  var oldGlobal = String(map['MAIL_GLOBAL_ENABLED'] || '').trim().toLowerCase();
  var oldMode = String(map['MAIL_DELIVERY_MODE'] || MAIL_DELIVERY_STATE_LIVE_).trim().toUpperCase();
  // v376.95 初回版が追加した STOPPED と旧 LIVE/REDIRECT が矛盾する場合だけ、
  // 旧設定を優先して既存運用を維持する。通常の「停止」保存では旧キーも false へ同期される。
  var initialMigrationConflict = explicit === MAIL_DELIVERY_STATE_STOPPED_
    && oldGlobal === 'true'
    && oldMode !== 'SUPPRESS';
  if ([MAIL_DELIVERY_STATE_STOPPED_, MAIL_DELIVERY_STATE_LIVE_, MAIL_DELIVERY_STATE_REDIRECT_].indexOf(explicit) >= 0 && !initialMigrationConflict) {
    return explicit;
  }
  // 初回移行前の保存値を一度だけ読み替える。旧 SUPPRESS は停止へ正規化する。
  if (oldGlobal === 'false') return MAIL_DELIVERY_STATE_STOPPED_;
  if (oldMode === MAIL_DELIVERY_STATE_REDIRECT_) return MAIL_DELIVERY_STATE_REDIRECT_;
  if (oldMode === 'SUPPRESS') return MAIL_DELIVERY_STATE_STOPPED_;
  return MAIL_DELIVERY_STATE_LIVE_;
}

function legacyMailDispatchValues_(state) {
  var normalized = normalizeMailDeliveryState_(state);
  return {
    globalEnabled: normalized === MAIL_DELIVERY_STATE_STOPPED_ ? 'false' : 'true',
    deliveryMode: normalized === MAIL_DELIVERY_STATE_REDIRECT_ ? MAIL_DELIVERY_STATE_REDIRECT_ : MAIL_DELIVERY_STATE_LIVE_,
  };
}

function mailDispatchPolicy_() {
  // E3（TRD §1.8）: 本番でないプロジェクトは、LIVE でも infra error でも送らない（REDIRECT・STOPPED は同じ）。
  var production = isProductionScript_();
  try {
    var ss = getOrCreateDatabase_();
    var state = getMailDeliveryState_(getSystemSettingMap_(ss));
    if (state === MAIL_DELIVERY_STATE_STOPPED_) return { mode: 'SUPPRESS', reason: 'delivery_stopped' };
    if (state === MAIL_DELIVERY_STATE_REDIRECT_) {
      var allowlist = String(getSystemSettingValue_(ss, 'MAIL_REDIRECT_ALLOWLIST') || '')
        .split(',')
        .map(function(s){ return s.trim(); })
        .filter(function(s){ return s.length > 0; });
      if (allowlist.length === 0) return { mode: 'SUPPRESS', reason: 'redirect_no_allowlist' };
      return { mode: 'REDIRECT', allowlist: allowlist };
    }
    if (!production) return { mode: 'SUPPRESS', reason: 'non_production' };
    return { mode: 'LIVE' };
  } catch (e) {
    if (!production) return { mode: 'SUPPRESS', reason: 'non_production' };
    // fail-safe: infra error 時は LIVE で進める（本番運用中の事故防止優先）
    Logger.log('mailDispatchPolicy_ infra error (defaulting LIVE): ' + e.message);
    return { mode: 'LIVE' };
  }
}

// メール送信の中央集約ラッパー
// category: 'BULK_MAIL' / 'TRAINING_REMINDER' 等。null/未指定なら GENERAL 扱いで GLOBAL/MODE のみ判定。
// to/subject/body/options: 既存 sendEmailWithValidatedFrom_ と互換
// 戻り値: { sent: bool, suppressed?: bool, reason?: string, mode?: string }
// v376.66: 未置換の差し込みタグ {{...}} を除去して返す。除去したタグ名だけをログに残す
// （本文・宛先は出さない＝AGENTS §0）。差し込み漏れは「タグがそのまま届く」という
// 目に見える事故になるため、送信直前で必ず落とす。
function stripUnresolvedMergeTags_(text, category, part) {
  var src = String(text == null ? '' : text);
  if (src.indexOf('{{') < 0) return src;
  var found = [];
  var stripped = src.replace(/\{\{\s*([^{}]{1,60}?)\s*\}\}/g, function(_all, name) {
    found.push(String(name));
    return '';
  });
  if (found.length) {
    Logger.log('[mail/unresolved-merge-tag] category=' + (category || 'GENERAL')
      + ' part=' + part + ' tags=' + found.join(',') );
  }
  return stripped;
}

// 2026-09-27: 自動通知の送信記録。以前は T_メール送信ログ に一括メールしか書いておらず、
// 受付確認などの自動通知は成功も失敗も何も残らなかった。だから「公開ポータル発のメールが
// 半年近く 1 通も届いていない」ことに誰も気づけなかった（v376.103）。
//
// 個人情報は載せない。宛先も、差し込み済みの件名・本文も書かない
// （件名には {{氏名}} が入りうる）。残すのは「いつ・どの種別が・どの経路で・どうなったか」だけ。
// 一括メールは自前で明細付きの集計行を書くので、ここでは扱わない（二重記録を作らない）。
function recordAutomatedMailLog_(category, outcome, options, detail) {
  var categoryCode = String(category || 'GENERAL').toUpperCase();
  if (categoryCode === 'BULK_MAIL') return;
  try {
    var from = String((options && options.from) || '').trim();
    appendRowsByHeaders_(getLogSs_(), 'T_メール送信ログ', [{
      'ログID': Utilities.getUuid(),
      '送信日時': new Date().toISOString(),
      // システム設定の送信元。個人の連絡先ではない。
      '送信者メール': from,
      // 差し込み済みの件名は載せない。種別が分かれば十分で、種別なら個人情報を含まない。
      '件名テンプレート': categoryCode,
      '宛先数': 1,
      '成功数': outcome === 'SENT' ? 1 : 0,
      'エラー数': outcome === 'FAILED' ? 1 : 0,
      // SENT / FAILED / SUPPRESSED(理由) の別と、エイリアス送信かどうかを残す。
      '送信種別': 'AUTO_' + outcome + (detail ? ':' + detail : '') + (from ? '/ALIAS' : '/DEFAULT'),
      '研修ID': '',
      '削除フラグ': false,
    }]);
  } catch (logError) {
    // 記録できないことで業務処理を止めない。
    Logger.log('[recordAutomatedMailLog_] ' + categoryCode + ': ' + logError.message);
  }
}

// v376.102: メール送信の失敗を Chat の「要確認」へ流す。
// 宛先・件名・本文は載せない。Chat は外部送信先であり、載せると会員の連絡先が外へ出る。
// 載せるのは「どの種別が」「どの送信経路で」「どんなエラーで」落ちたかだけ。
// 通知自体の失敗で業務処理を止めないため、全体を try で包む。
function notifyMailFailureToChat_(category, options, error) {
  try {
    var ss = getOrCreateDatabase_();
    var from = String((options && options.from) || '').trim();
    // from が実行ユーザー以外だと Gmail API 経路になり、gmail.send の承認と
    // 「名前として送信」の登録が要る。どちらで落ちたかを切り分けられるようにする。
    var route = from ? 'Gmail API（送信元エイリアス指定）' : 'MailApp（実行ユーザー送信）';
    notifyMembershipChatSafely_(ss, 'ANOMALY', {
      '手続種別': 'メール送信',
      '申請ID': '',
      '日時': new Date().toISOString(),
      '変更内容': '',
      '異常内容': [
        'メールを送信できませんでした。',
        'メール種別: ' + String(category || 'GENERAL'),
        '送信経路: ' + route,
        'エラー: ' + String((error && error.message) || error),
      ].join('\n'),
    });
  } catch (notifyError) {
    Logger.log('[notifyMailFailureToChat_] failed: ' + notifyError.message);
  }
}

function deliverMail_(category, to, subject, body, options) {
  // [4] カテゴリ別フラグ
  if (category) {
    try {
      var catKey = String(category).toUpperCase() + '_ENABLED';
      var catRaw = String(getSystemSettingValue_(getOrCreateDatabase_(), catKey) || '').trim();
      var catEnabled = catRaw === '' ? true : catRaw.toLowerCase() !== 'false';
      if (!catEnabled) {
        Logger.log('[mail/category-disabled] category=' + category + ' to=' + to + ' subject=' + subject);
        recordAutomatedMailLog_(category, 'SUPPRESSED', options, 'category_disabled');
        return { sent: false, suppressed: true, reason: 'category_disabled' };
      }
    } catch (e) {
      // カテゴリ判定失敗時は default 通過（GLOBAL/MODE で受け止める）
    }
  }
  // v376.66: 差し込み漏れの {{タグ}} をそのまま会員へ送らない（最後の砦）。
  // v376.66 以前は、送信側が知らないタグを本文に書くと raw の「{{会員種別}}」が届いていた。
  // ここで除去し、どのカテゴリでどのタグが未解決だったかをログに残す（値は出さない）。
  subject = stripUnresolvedMergeTags_(subject, category, 'subject');
  body = stripUnresolvedMergeTags_(body, category, 'body');
  var policy = mailDispatchPolicy_();
  if (policy.mode === 'SUPPRESS') {
    Logger.log('[mail/' + policy.reason + '] suppressed category=' + (category || 'GENERAL') + ' to=' + to + ' subject=' + subject);
    recordAutomatedMailLog_(category, 'SUPPRESSED', options, policy.reason);
    return { sent: false, suppressed: true, reason: policy.reason };
  }
  var finalTo = to;
  var finalSubject = subject;
  var finalBody = body;
  if (policy.mode === 'REDIRECT') {
    var origTo = String(to || '');
    finalTo = policy.allowlist.join(',');
    Logger.log('deliverMail_ REDIRECT category=' + (category || 'GENERAL') + ' originalTo=' + origTo + ' redirectedTo=' + finalTo);
  }
  var finalOptions = options || {};
  if (isAutomatedMailCategory_(category) && !String(finalOptions.from || '').trim()) {
    finalOptions = buildAutomatedMailOptions_(getOrCreateDatabase_(), finalOptions);
  }
  // v376.102: 送信失敗は呼び出し側が Logger.log で握りつぶしており、画面にも DB にも
  // 何も残らなかった。「Chat は届くのにメールだけ来ない」状態に誰も気づけない。
  // 実際に届いている Chat の「要確認」へ流して、気づける状態にする。
  try {
    sendEmailWithValidatedFrom_(finalTo, finalSubject, finalBody, finalOptions);
  } catch (sendError) {
    recordAutomatedMailLog_(category, 'FAILED', finalOptions, '');
    notifyMailFailureToChat_(category, finalOptions, sendError);
    throw sendError;   // 呼び出し側の従来の扱い（握りつぶし or ログ）は変えない
  }
  recordAutomatedMailLog_(category, 'SENT', finalOptions, policy.mode === 'LIVE' ? '' : policy.mode);
  return { sent: true, mode: policy.mode };
}

// 一括メールやLINE通知は操作者が送信元を選ぶため対象外。自動通知だけを共通設定へ集約する。
function isAutomatedMailCategory_(category) {
  var automatic = {
    APPLICATION_RECEIPT: true,
    APPROVAL_NOTIFICATION: true,
    REJECTION_NOTIFICATION: true,
    CREDENTIAL_EMAIL: true,
    BIZ_REP_EMAIL: true,
    BIZ_STAFF_EMAIL: true,
    STAFF_ADD_STAFF_EMAIL: true,
    STAFF_ADD_REP_EMAIL: true,
    TRAINING_APPLY_RECEIPT: true,
    TRAINING_REMINDER: true,
    AUTH_OTP: true,
    LOGIN_ID_CHANGED: true,
    CONTACT_EMAIL_CHANGED: true,
    MEMBER_UPDATE_CONFIRM: true,
    WITHDRAWAL_CONFIRM: true,
    PASSWORD_RESET: true,
  };
  return !!automatic[String(category || '').toUpperCase()];
}

// 既存 CREDENTIAL_EMAIL_FROM を「自動通知の共通送信元」として後方互換で利用する。
// 空欄時は GAS の標準送信元を使う。指定済み alias が使えない場合は Gmail API が例外にし、
// 実行者アドレスへ黙ってフォールバックさせない。
function buildAutomatedMailOptions_(ss, options) {
  var configuredFrom = String(getSystemSettingValue_(ss, 'CREDENTIAL_EMAIL_FROM') || '').trim();
  var merged = {};
  var src = options || {};
  for (var key in src) {
    if (Object.prototype.hasOwnProperty.call(src, key)) merged[key] = src[key];
  }
  if (configuredFrom && !String(merged.from || '').trim()) {
    merged.from = configuredFrom;
    if (!String(merged.replyTo || '').trim()) merged.replyTo = configuredFrom;
  }
  if (!String(merged.name || '').trim()) merged.name = '枚方市介護支援専門員連絡協議会';
  return merged;
}

function sendEmailWithValidatedFrom_(to, subject, body, options) {
  // Session.getEffectiveUser() は userinfo.email スコープが必要。
  // 統合・会員 split では v263 スコープ削減により使用不可のため try-catch で安全に取得する。
  var ownerEmail = '';
  try { ownerEmail = Session.getEffectiveUser().getEmail(); } catch (e) {}

  var from = String((options && options.from) || ownerEmail).trim();
  var replyTo = String((options && options.replyTo) || from || ownerEmail).trim();
  var name = String((options && options.name) || '');
  var attachments = (options && options.attachments) || [];

  var mailOpts = { to: to, subject: subject, body: body, name: name, attachments: attachments };
  if (replyTo) mailOpts.replyTo = replyTo;

  if (!from || from === ownerEmail) {
    // from 未指定 or deploying user → MailApp（userinfo.email スコープ不要）
    MailApp.sendEmail(mailOpts);
    return;
  }

  // v376.103: 送信エイリアス指定 → Gmail REST API。
  //
  // 以前は GmailApp.sendEmail({from}) を使っていたが、GmailApp は送信前に
  // 送信者のエイリアス一覧を照合するため mail.google.com / gmail.settings.basic /
  // gmail.readonly / gmail.modify のいずれかを要求する。公開・会員 split は
  // v263 のスコープ最小化でこれらを持たないため、公開ポータル発のメール
  // （受付確認など）が送信時に落ちていた。失敗は握りつぶされ誰も気づけなかった。
  //
  // REST の users.messages.send は gmail.send だけで呼べる。エイリアスの「管理」には
  // 設定系スコープが要るが、「送信」には要らない。From が送信者の検証済み
  // エイリアスであれば Gmail が受け付ける。3 split とも gmail.send と
  // script.external_request を持っているので、スコープ追加なしで送れる。
  sendMailViaGmailApi_({
    from: from, name: name, to: to, subject: subject,
    body: body, replyTo: replyTo, attachments: attachments,
  });
}

// RFC 2047 の encoded-word。日本語の件名・表示名・添付ファイル名に使う。
function encodeMimeWord_(text) {
  var raw = String(text == null ? '' : text);
  if (!raw) return '';
  // ASCII だけなら素のまま通す（可読性を保つ）
  if (!/[^\x20-\x7E]/.test(raw)) return raw;
  return '=?UTF-8?B?' + Utilities.base64Encode(raw, Utilities.Charset.UTF_8) + '?=';
}

// base64 は 76 桁で折る。折らない実装を受け付けない MTA があるため。
function wrapBase64_(encoded) {
  var out = [];
  for (var i = 0; i < encoded.length; i += 76) out.push(encoded.substring(i, i + 76));
  return out.join('\r\n');
}

// RFC822 形式のメッセージを組み立てる。添付があれば multipart/mixed にする。
function buildRfc822Message_(params) {
  var attachments = params.attachments || [];
  var fromHeader = params.name
    ? encodeMimeWord_(params.name) + ' <' + params.from + '>'
    : params.from;
  var lines = [];
  lines.push('From: ' + fromHeader);
  lines.push('To: ' + params.to);
  if (params.replyTo) lines.push('Reply-To: ' + params.replyTo);
  lines.push('Subject: ' + encodeMimeWord_(params.subject));
  lines.push('MIME-Version: 1.0');

  var bodyB64 = wrapBase64_(Utilities.base64Encode(String(params.body == null ? '' : params.body), Utilities.Charset.UTF_8));

  if (!attachments.length) {
    lines.push('Content-Type: text/plain; charset="UTF-8"');
    lines.push('Content-Transfer-Encoding: base64');
    lines.push('');
    lines.push(bodyB64);
    return lines.join('\r\n');
  }

  var boundary = 'hcmn_' + Utilities.getUuid().replace(/-/g, '');
  lines.push('Content-Type: multipart/mixed; boundary="' + boundary + '"');
  lines.push('');
  lines.push('--' + boundary);
  lines.push('Content-Type: text/plain; charset="UTF-8"');
  lines.push('Content-Transfer-Encoding: base64');
  lines.push('');
  lines.push(bodyB64);
  for (var i = 0; i < attachments.length; i++) {
    var blob = attachments[i];
    var fileName = encodeMimeWord_(blob.getName() || ('attachment-' + (i + 1)));
    lines.push('');
    lines.push('--' + boundary);
    lines.push('Content-Type: ' + (blob.getContentType() || 'application/octet-stream') + '; name="' + fileName + '"');
    lines.push('Content-Transfer-Encoding: base64');
    lines.push('Content-Disposition: attachment; filename="' + fileName + '"');
    lines.push('');
    lines.push(wrapBase64_(Utilities.base64Encode(blob.getBytes())));
  }
  lines.push('');
  lines.push('--' + boundary + '--');
  return lines.join('\r\n');
}

function sendMailViaGmailApi_(params) {
  var message = buildRfc822Message_(params);
  var response = UrlFetchApp.fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: JSON.stringify({ raw: Utilities.base64EncodeWebSafe(Utilities.newBlob(message).getBytes()) }),
    muteHttpExceptions: true,
  });
  var code = response.getResponseCode();
  if (code >= 200 && code < 300) return;
  var detail = '';
  try {
    detail = String((((JSON.parse(response.getContentText() || '{}')).error) || {}).message || '').trim();
  } catch (parseError) {}
  // 失敗の切り分けに要るので、HTTP コードと Gmail のメッセージを両方残す。
  // 呼び出し元（deliverMail_）がこれを Chat の「要確認」へ流す。
  throw new Error('Gmail API 送信に失敗しました (HTTP ' + code + ')'
    + (detail ? ': ' + detail : '')
    + '。送信元エイリアスが「名前として送信」に登録済みか、gmail.send の承認が済んでいるか確認してください。');
}

function sendTrainingMail_(payload) {
  if (!checkAdminBySession_()) return JSON.stringify({ success: false, error: 'unauthorized' });
  if (!payload) return JSON.stringify({ success: false, error: 'パラメータが不足しています' });
  var from = String(payload.from || '').trim();
  var subject = String(payload.subject || '').trim();
  var body = String(payload.body || '').trim();
  // 2026-10-13: 画面が送る項目名（commonAttach*）で共通添付を受け取る。以前は attachments を読んでおり、
  // 名前が食い違って添付が一度も付かなかった（画面はファイル名を表示し「送信完了」と出ていた）。
  // 個別添付フォルダは照合の規則が実装されておらず、画面から外した（docs/306 M-01）。
  var attachments = payload.commonAttachBase64
    ? [{ base64: String(payload.commonAttachBase64), name: String(payload.commonAttachFilename || 'attachment'), mimeType: String(payload.commonAttachMime || 'application/octet-stream') }]
    : [];

  if (!subject || !body) {
    return JSON.stringify({ success: false, error: 'パラメータが不足しています' });
  }

  // targetApplyIds + trainingId から recipients を組み立てる
  var trainingId = String(payload.trainingId || '').trim();
  var targetApplyIds = payload.targetApplyIds;
  var recipients = payload.recipients; // 後方互換（直接渡す場合）
  var notFoundCount = 0;

  if (!recipients || !recipients.length) {
    if (!trainingId || !targetApplyIds || !targetApplyIds.length) {
      return JSON.stringify({ success: false, error: 'パラメータが不足しています' });
    }
    // v376.12: getCanonicalApplicantRef_ で 3-FK XOR 正本判定。STAFF を職員IDで解決し
    //   実際の送信先が職員個人メールになるよう修正（事業所代表メール宛の誤送信を防止）。
    var db = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
    backfillApplicationApplicantIdentity_(db);
    var applyRows = getTrainingApplicationRows_(db, { trainingId: trainingId });
    var memberSheet = db.getSheetByName('T_会員');
    var memberMap = {};
    getRowsAsObjectsFromSheet_(memberSheet).forEach(function(r) { memberMap[String(r['会員ID'] || '')] = r; });
    var staffSheetForSend = db.getSheetByName('T_事業所職員');
    var staffMapForSend = {};
    (staffSheetForSend ? getRowsAsObjectsFromSheet_(staffSheetForSend) : []).forEach(function(r) {
      staffMapForSend[String(r['職員ID'] || '')] = r;
    });
    var externalSheet = db.getSheetByName('T_外部申込者');
    var externalMap = {};
    getRowsAsObjectsFromSheet_(externalSheet).forEach(function(r) { externalMap[String(r['外部申込者ID'] || '')] = r; });

    var targetSet = {};
    targetApplyIds.forEach(function(id) { targetSet[String(id)] = true; });

    var matchedApplyRows = applyRows.filter(function(r) { return targetSet[String(r['申込ID'] || '')]; });
    // 選んだ申込が見つからない（取消・削除された）ときは黙って外さず、件数を返す
    notFoundCount = Math.max(0, targetApplyIds.length - matchedApplyRows.length);
    recipients = matchedApplyRows
      .map(function(r) {
        var ref = getCanonicalApplicantRef_(r);
        var name = '(不明)', email = '', officeName = '';
        if (ref.type === 'STAFF') {
          var staffInfo = staffMapForSend[ref.id];
          if (staffInfo) {
            name = (String(staffInfo['姓'] || '') + ' ' + String(staffInfo['名'] || '')).trim() || String(staffInfo['氏名'] || '');
            email = String(staffInfo['メールアドレス'] || '');
            var parentMember = memberMap[String(staffInfo['会員ID'] || '')];
            officeName = parentMember ? String(parentMember['勤務先名'] || '') : '';
          }
        } else if (ref.type === 'MEMBER') {
          var memberInfo = memberMap[ref.id];
          if (memberInfo) {
            name = (String(memberInfo['姓'] || '') + ' ' + String(memberInfo['名'] || '')).trim() || String(memberInfo['氏名'] || '');
            email = String(memberInfo['代表メールアドレス'] || '');
            officeName = String(memberInfo['勤務先名'] || '');
          }
        } else if (ref.type === 'EXTERNAL') {
          var extInfo = externalMap[ref.id];
          if (extInfo) {
            name = String(extInfo['氏名'] || '');
            email = String(extInfo['メールアドレス'] || '');
            officeName = String(extInfo['事業所名'] || '');
          }
        }
        return { applyId: String(r['申込ID'] || ''), name: name, email: email, officeName: officeName };
      });
  }

  if (!recipients.length) {
    return JSON.stringify({ success: false, error: '送信対象者が見つかりません' });
  }

  var ownerEmail = Session.getEffectiveUser().getEmail();
  from = validateRequestedFromAddress_(from, ownerEmail);
  var replyTo = from || ownerEmail;

  var commonAttachments = attachments.map(function(att) {
    var bytes = Utilities.base64Decode(att.base64);
    return Utilities.newBlob(bytes, att.mimeType, att.name);
  });

  var errors = [];
  var sentCount = 0;
  var suppressedCount = 0;
  var suppressedReason = '';
  for (var i = 0; i < recipients.length; i += 1) {
    var rec = recipients[i];
    if (!String(rec.email || '').trim()) {
      errors.push({ applyId: rec.applyId, error: (rec.name || rec.applyId) + ': メールアドレスが登録されていません' });
      continue;
    }
    try {
      var mergeVars = { '氏名': rec.name, '事業所名': rec.officeName || '' };
      var personalSubject = renderMergeTags_(subject, mergeVars);
      var personalBody = renderMergeTags_(body, mergeVars);
      var delivered = deliverMail_('TRAINING_REMINDER', rec.email, personalSubject, personalBody, {
        from: from,
        replyTo: replyTo,
        attachments: commonAttachments.slice(),
        name: '枚方市介護支援専門員連絡協議会',
      });
      // 2026-10-13: 配信停止・カテゴリ無効で止まった分を「送信済み」に数えない。
      // 以前は戻り値を見ず、1 通も届かなくても「N 件送信完了」と表示していた。
      if (delivered && delivered.sent === false) {
        suppressedCount += 1;
        suppressedReason = String(delivered.reason || suppressedReason);
      } else {
        sentCount += 1;
      }
    } catch (e) {
      errors.push({ applyId: rec.applyId, error: (rec.name || rec.applyId) + ': ' + e.message });
    }
  }

  var resultData = {
    sent: sentCount,
    suppressed: suppressedCount,
    suppressedReason: suppressedReason,
    notFound: notFoundCount,
    errors: errors.map(function(e) { return e.error; }),
  };
  if (errors.length > 0 && sentCount === 0 && suppressedCount === 0) {
    return JSON.stringify({ success: false, error: errors[0].error, data: resultData });
  }
  return JSON.stringify({ success: true, data: resultData });
}

// v188: Gemini API を GAS サーバー側で呼び出す（APIキーはScriptPropertiesで管理）
// フロントエンドに @google/genai を含めず、APIキーも露出しない設計。
function generateTrainingEmailWithAI_(payload) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    return { ok: false, text: 'GEMINI_API_KEY がScript Propertiesに設定されていません。' };
  }

  var training = payload.training || {};
  var recipientName = String(payload.recipientName || '会員各位');

  var prompt = 'あなたは枚方市介護支援専門員連絡協議会の事務局スタッフです。\n' +
    '以下の研修に参加申し込みをした会員に向けて、開催3日前のリマインドメールを作成してください。\n\n' +
    '【研修情報】\n' +
    '研修名: ' + String(training.title || '') + '\n' +
    '開催日: ' + formatTrainingDate_(training.date, training.endTime) + '\n' +
    '場所: ' + String(training.location || '-') + '\n\n' +
    '【要件】\n' +
    '- 件名は分かりやすく簡潔に。\n' +
    '- 宛名は「' + recipientName + '」としてください。\n' +
    '- 丁寧でプロフェッショナルなトーンで記述してください。';

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;
  var requestBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }]
  });

  try {
    var response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: requestBody,
      muteHttpExceptions: true,
    });
    var statusCode = response.getResponseCode();
    if (statusCode !== 200) {
      Logger.log('generateTrainingEmailWithAI_: Gemini API error ' + statusCode + ': ' + response.getContentText());
      return { ok: false, text: 'Gemini API エラー (HTTP ' + statusCode + ')' };
    }
    var json = JSON.parse(response.getContentText());
    var text = json.candidates &&
               json.candidates[0] &&
               json.candidates[0].content &&
               json.candidates[0].content.parts &&
               json.candidates[0].content.parts[0] &&
               json.candidates[0].content.parts[0].text;
    return { ok: true, text: text || 'メールの生成に失敗しました。' };
  } catch (e) {
    Logger.log('generateTrainingEmailWithAI_: ' + e.message);
    return { ok: false, text: 'エラーが発生しました: ' + e.message };
  }
}

// ============================================================
// v194 Phase 2: 会員一括メール送信
// ============================================================

/**
 * 一括メール宛先一覧を取得する。
 * INDIVIDUAL / SUPPORT: T_会員.代表メールアドレス
 * BUSINESS: T_事業所職員（ENROLLED + メール配信希望コード ≠ 'NO'）
 *
 * payload:
 *   memberTypes?    – 会員種別コードの配列。省略時は M_会員種別 の有効な全種別
 *   memberStatus?   – 'ACTIVE' | 'ALL'  (T_会員.会員状態コード)   デフォルト 'ACTIVE'
 *   staffStatus?    – 'ENROLLED' | 'ALL' (T_事業所職員.職員状態コード) デフォルト 'ENROLLED'
 *   mailingFilter?  – 'OPT_IN' | 'ALL'  (メール配信希望コード)    デフォルト 'OPT_IN'
 *   excludeNoEmail? – true: メール未登録除外（デフォルト true）
 */
function getMembersForBulkMail_(payload) {
  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var p = payload || {};
  var memberTypes   = p.memberTypes   || getActiveMemberTypeCodes_(ss);
  var memberStatus  = String(p.memberStatus  || 'ACTIVE');
  var staffStatus   = String(p.staffStatus   || 'ENROLLED');
  var mailingFilter = String(p.mailingFilter || 'OPT_IN');
  var excludeNoEmail = p.excludeNoEmail !== false;

  var memberSheet = ss.getSheetByName('T_会員');
  var staffSheet  = ss.getSheetByName('T_事業所職員');
  var members     = getRowsAsObjectsFromSheet_(memberSheet);
  var staffRows   = getRowsAsObjectsFromSheet_(staffSheet);

  // 事業所会員マップ（会員ID → 会員行）
  var bizMemberMap = {};
  members.forEach(function(m) {
    if (String(m['会員種別コード'] || '') === 'BUSINESS' && !toBoolean_(m['削除フラグ'])) {
      bizMemberMap[String(m['会員ID'] || '')] = m;
    }
  });

  var results = [];

  // ── 個人会員 / 賛助会員 ──────────────────────────────────────
  members.forEach(function(m) {
    if (toBoolean_(m['削除フラグ'])) return;
    var mtype = String(m['会員種別コード'] || '');
    if (mtype !== 'INDIVIDUAL' && mtype !== 'SUPPORT') return;
    if (memberTypes.indexOf(mtype) < 0) return;
    var status = String(m['会員状態コード'] || '');
    if (memberStatus === 'ACTIVE' && status !== 'ACTIVE') return;

    var lastName   = String(m['姓']  || '').trim();
    var firstName  = String(m['名']  || '').trim();
    var name       = lastName + firstName;
    var displayName = (lastName + ' ' + firstName).trim() || name;
    var email      = String(m['代表メールアドレス'] || '').trim();
    if (excludeNoEmail && !email) return;

    results.push({
      recipientKey: String(m['会員ID'] || ''),
      memberType:   mtype,
      memberId:     String(m['会員ID'] || ''),
      staffId:      null,
      lastName:     lastName,
      firstName:    firstName,
      name:         name,
      displayName:  displayName,
      // v362: フリガナ検索対応
      kana:         (String(m['セイ'] || '') + ' ' + String(m['メイ'] || '')).trim(),
      email:        email,
      officeName:   String(m['勤務先名'] || '').trim(),
      memberStatus: status,
      staffStatus:  null,
      mailingOptOut: false,
    });
  });

  // ── 事業所職員 ──────────────────────────────────────────────
  if (memberTypes.indexOf('BUSINESS') >= 0) {
    staffRows.forEach(function(s) {
      if (toBoolean_(s['削除フラグ'])) return;
      var sStatus = String(s['職員状態コード'] || '');
      if (staffStatus === 'ENROLLED' && sStatus !== 'ENROLLED') return;

      var parentMemberId = String(s['会員ID'] || '');
      var parent = bizMemberMap[parentMemberId];
      if (!parent) return;

      // 親会員の在籍状態チェック
      if (memberStatus === 'ACTIVE' && String(parent['会員状態コード'] || '') !== 'ACTIVE') return;

      var mailingCode = String(s['メール配信希望コード'] || '').trim().toUpperCase();
      var isOptOut    = mailingCode === 'NO';
      if (mailingFilter === 'OPT_IN' && isOptOut) return;

      var lastName   = String(s['姓']  || '').trim();
      var firstName  = String(s['名']  || '').trim();
      var name       = lastName + firstName || String(s['氏名'] || '').trim();
      var displayName = (lastName + ' ' + firstName).trim() || name;
      var email      = String(s['メールアドレス'] || '').trim();
      if (excludeNoEmail && !email) return;

      results.push({
        recipientKey:  String(s['職員ID'] || ''),
        memberType:    'BUSINESS',
        memberId:      parentMemberId,
        staffId:       String(s['職員ID'] || ''),
        lastName:      lastName,
        firstName:     firstName,
        name:          name,
        displayName:   displayName,
        // v362: フリガナ検索対応
        kana:          (String(s['セイ'] || '') + ' ' + String(s['メイ'] || '')).trim() || String(s['フリガナ'] || ''),
        email:         email,
        officeName:    String(parent['勤務先名'] || '').trim(),
        memberStatus:  String(parent['会員状態コード'] || ''),
        staffStatus:   sStatus,
        mailingOptOut: isOptOut,
      });
    });
  }

  return results;
}

function normalizeMailingListYear_(year) {
  var selected = Number(year || 0);
  if (!selected || !isFinite(selected)) selected = getCurrentFiscalYear_();
  selected = Math.floor(selected);
  if (selected < 2000 || selected > 2100) {
    throw new Error('対象年度は 2000〜2100 の範囲で指定してください。');
  }
  return selected;
}

function getMailingListYears_(feeRows, selectedYear) {
  var currentFiscalYear = getCurrentFiscalYear_();
  var years = {};
  years[currentFiscalYear] = true;
  years[selectedYear] = true;
  (feeRows || []).forEach(function(row) {
    if (toBoolean_(row['削除フラグ'])) return;
    var y = Number(row['対象年度'] || 0);
    if (y) years[y] = true;
  });
  return Object.keys(years).map(function(y) {
    return Number(y);
  }).sort(function(a, b) {
    return b - a;
  });
}

function buildMailingListCandidates_(payload) {
  var p = payload || {};
  var filterType = String(p.filterType || 'KOHOUSHI'); // 'KOHOUSHI' | 'KOHOUSHI_ONLY' | 'OSHIRASE'
  if (filterType !== 'KOHOUSHI' && filterType !== 'KOHOUSHI_ONLY' && filterType !== 'OSHIRASE') {
    throw new Error('発送区分が不正です。');
  }
  var year = normalizeMailingListYear_(p.year);

  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var memberSheet = ss.getSheetByName('T_会員');
  var feeSheet = ss.getSheetByName('T_年会費納入履歴');
  var members = getRowsAsObjectsFromSheet_(memberSheet);
  var feeRows = feeSheet ? getRowsAsObjectsFromSheet_(feeSheet) : [];

  // 全年度の feeMap を構築（v310: 年度別複数条件フィルター対応）
  var feeMap = {};        // 選択年度: { memberId: status }
  var feeMapByYear = {};  // 全年度: { year: { memberId: status } }
  feeRows.forEach(function(r) {
    if (toBoolean_(r['削除フラグ'])) return;
    var yr = Number(r['対象年度'] || 0);
    var mid = String(r['会員ID'] || '');
    if (!yr || !mid) return;
    var status = String(r['会費納入状態コード'] || 'UNPAID');
    if (!feeMapByYear[yr]) feeMapByYear[yr] = {};
    feeMapByYear[yr][mid] = status;
    if (yr === year) feeMap[mid] = status;
  });
  // 利用可能な全年度リストを先行計算（候補ループで annualFeeHistories に使用）
  var allFeeYears = getMailingListYears_(feeRows, year);

  var candidates = [];

  members.forEach(function(m) {
    var fiscalSnapshot = getMemberFiscalSnapshot_(m, year);
    if (!fiscalSnapshot.eligible) return;
    var mtype = String(m['会員種別コード'] || '');
    var status = fiscalSnapshot.memberStatus;

    var mailingPrefFilter = String(m['発送方法コード'] || 'EMAIL');
    var isOshiraseTarget = mtype === 'BUSINESS' || mailingPrefFilter === 'POST';

    // 広報誌のみフィルター: お知らせ発送対象を除外
    if (filterType === 'KOHOUSHI_ONLY' && isOshiraseTarget) return;

    // お知らせフィルター: 事業所は全員対象。個人・賛助は 発送方法コード='POST' のみ
    if (filterType === 'OSHIRASE' && !isOshiraseTarget) return;

    var memberId = String(m['会員ID'] || '');
    var displayName;
    if (mtype === 'BUSINESS') {
      displayName = String(m['勤務先名'] || '').trim();
    } else {
      var lastName = String(m['姓'] || '').trim();
      var firstName = String(m['名'] || '').trim();
      displayName = (lastName + ' ' + firstName).trim();
    }
    if (!displayName) displayName = memberId;

    var postCode, prefecture, city, line1, line2, mailingDestination;
    if (mtype === 'BUSINESS') {
      mailingDestination = 'OFFICE';
      postCode = String(m['勤務先郵便番号'] || '').trim();
      prefecture = String(m['勤務先都道府県'] || '').trim();
      city = String(m['勤務先市区町村'] || '').trim();
      line1 = String(m['勤務先住所'] || '').trim();
      line2 = String(m['勤務先住所2'] || '').trim();
    } else {
      mailingDestination = String(m['郵送先区分コード'] || 'OFFICE');
      if (mailingDestination === 'HOME') {
        postCode = String(m['自宅郵便番号'] || '').trim();
        prefecture = String(m['自宅都道府県'] || '').trim();
        city = String(m['自宅市区町村'] || '').trim();
        line1 = String(m['自宅住所'] || '').trim();
        line2 = String(m['自宅住所2'] || '').trim();
      } else {
        postCode = String(m['勤務先郵便番号'] || '').trim();
        prefecture = String(m['勤務先都道府県'] || '').trim();
        city = String(m['勤務先市区町村'] || '').trim();
        line1 = String(m['勤務先住所'] || '').trim();
        line2 = String(m['勤務先住所2'] || '').trim();
      }
    }

    var invalidItems = [];
    if (!postCode) invalidItems.push('郵便番号');
    if (!city) invalidItems.push('市区町村');
    if (!line1) invalidItems.push('番地');

    var prefDisplay = (prefecture && prefecture !== '大阪府') ? prefecture : '';
    var address1 = prefDisplay + city + line1;
    var officeName = String(m['勤務先名'] || '').trim();
    var feeStatus = feeMap[memberId] || 'UNPAID';
    // v310: 全年度の納入状況マップ（未記録は UNPAID 扱い）
    var feeHistories = {};
    allFeeYears.forEach(function(yr) {
      feeHistories[yr] = (feeMapByYear[yr] && feeMapByYear[yr][memberId]) || 'UNPAID';
    });

    candidates.push({
      targetKey: memberId,
      memberId: memberId,
      displayName: displayName,
      // v362: フリガナ検索対応（T_会員 セイ + メイ）
      kana: (String(m['セイ'] || '') + ' ' + String(m['メイ'] || '')).trim(),
      memberType: mtype,
      memberStatus: status,
      annualFeeStatus: feeStatus,
      annualFeeYear: year,
      annualFeeHistories: feeHistories,
      officeName: officeName,
      mailingPreference: mailingPrefFilter,
      mailingDeliveryScope: isOshiraseTarget ? 'OSHIRASE' : 'KOHOUSHI_ONLY',
      mailingDestination: mailingDestination,
      addressInvalidItems: invalidItems,
      postCode: postCode,
      address1: address1,
      address2: line2,
    });
  });

  candidates.sort(function(a, b) {
    var ta = String(a.memberType || '');
    var tb = String(b.memberType || '');
    if (ta !== tb) return ta < tb ? -1 : 1;
    return String(a.displayName || '').localeCompare(String(b.displayName || ''), 'ja');
  });

  return {
    filterType: filterType,
    year: year,
    years: getMailingListYears_(feeRows, year),
    candidates: candidates,
  };
}

// 件数は会員種別コードごと（種別の一覧は M_会員種別。画面はマスタの表示順で並べる）
function summarizeMailingListCandidates_(candidates) {
  var counts = { byType: {}, invalid: 0 };
  (candidates || []).forEach(function(c) {
    var type = String(c.memberType || '');
    counts.byType[type] = (counts.byType[type] || 0) + 1;
    if (c.addressInvalidItems && c.addressInvalidItems.length > 0) counts.invalid += 1;
  });
  return counts;
}

function getMailingListTargets_(payload) {
  var built = buildMailingListCandidates_(payload);
  return {
    selectedYear: built.year,
    years: built.years,
    targets: built.candidates.map(function(c) {
      return {
        targetKey: c.targetKey,
        memberId: c.memberId,
        displayName: c.displayName,
        kana: c.kana || '', // v362
        memberType: c.memberType,
        memberStatus: c.memberStatus,
        annualFeeStatus: c.annualFeeStatus,
        annualFeeYear: c.annualFeeYear,
        annualFeeHistories: c.annualFeeHistories || {},
        officeName: c.officeName,
        mailingPreference: c.mailingPreference,
        mailingDeliveryScope: c.mailingDeliveryScope,
        mailingDestination: c.mailingDestination,
        addressInvalidItems: c.addressInvalidItems,
      };
    }),
    counts: summarizeMailingListCandidates_(built.candidates),
  };
}

/**
 * v207/v291: 宛名リスト Excel（.xlsx）出力
 *
 * payload: { filterType: 'KOHOUSHI' | 'KOHOUSHI_ONLY' | 'OSHIRASE', year?: number, targetKeys?: string[] }
 *   KOHOUSHI: 広報誌発送 — ACTIVE + WITHDRAWAL_SCHEDULED の全会員
 *   KOHOUSHI_ONLY: 広報誌のみ発送 — KOHOUSHI のうち OSHIRASE 対象外
 *   OSHIRASE: お知らせ発送 — 事業所会員全員 + 個人/賛助のうち 発送方法コード='POST'
 *
 * targetKeys 指定時は、バックエンドで再計算した発送対象候補との交差だけを出力する。
 */
function generateMailingListExcel_(payload) {
  var p = payload || {};
  var built = buildMailingListCandidates_(p);
  var filterType = built.filterType;
  var selectedCandidates = built.candidates;
  if (Array.isArray(p.targetKeys)) {
    if (p.targetKeys.length === 0) throw new Error('出力対象が選択されていません。');
    var keySet = {};
    p.targetKeys.forEach(function(k) {
      keySet[String(k)] = true;
    });
    selectedCandidates = selectedCandidates.filter(function(c) {
      return !!keySet[String(c.targetKey)];
    });
    if (selectedCandidates.length === 0) {
      throw new Error('選択された会員が現在の発送条件に一致しません。');
    }
  }

  var HEADERS_BIZ     = ['名前', '郵便番号', '住所', '建物名'];
  var HEADERS_IND_SUP = ['名前', '郵便番号', '住所', '建物名', '勤務先名'];
  var HEADERS_INVALID = ['名前', '会員種別', '住所不備の項目'];

  // シートは会員種別ごと（M_会員種別 の表示順・名称）。事業所会員は宛名が事業所なので勤務先名の列を持たない
  var memberTypes = readMemberTypeMaster_(null);
  var rowsByType  = {};
  var rowsInvalid = [];

  selectedCandidates.forEach(function(c) {
    if (c.addressInvalidItems.length > 0) {
      rowsInvalid.push([c.displayName, masterLabel_(null, 'M_会員種別', c.memberType), c.addressInvalidItems.join('、')]);
      return;
    }
    var type = String(c.memberType || '');
    if (!rowsByType[type]) rowsByType[type] = [];
    rowsByType[type].push(type === 'BUSINESS'
      ? [c.displayName, c.postCode, c.address1, c.address2]
      : [c.displayName, c.postCode, c.address1, c.address2, c.officeName]);
  });

  // 一時スプレッドシート作成
  var dateStr   = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd_HHmmss');
  var filterLbl = filterType === 'KOHOUSHI_ONLY' ? '広報誌のみ発送'
                : filterType === 'KOHOUSHI' ? '広報誌発送' : 'お知らせ発送';
  var tempSs    = SpreadsheetApp.create('宛名リスト_' + filterLbl + '_' + dateStr);
  var tempSsId  = tempSs.getId();

  try {
    var firstSheet = tempSs.getActiveSheet();
    memberTypes.forEach(function(t, ti) {
      var typeSheet = ti === 0 ? firstSheet : tempSs.insertSheet(t.label);
      if (ti === 0) typeSheet.setName(t.label);
      _fillMailingSheet_(typeSheet, t.code === 'BUSINESS' ? HEADERS_BIZ : HEADERS_IND_SUP, rowsByType[t.code] || []);
    });

    var invalidSheet = memberTypes.length ? tempSs.insertSheet('住所不備') : firstSheet;
    if (!memberTypes.length) invalidSheet.setName('住所不備');
    _fillMailingSheet_(invalidSheet, HEADERS_INVALID, rowsInvalid);

    // GAS の setValues() 書き込みバッファを強制フラッシュ。
    // flush() なしでは UrlFetchApp の HTTP エクスポートが古いサーバー状態を返す場合がある。
    // 特に行数が少ないシート（住所不備など）はバッファが自動フラッシュされず取りこぼされる。
    SpreadsheetApp.flush();

    // xlsx エクスポート（UrlFetchApp + Bearer token — drive OAuth スコープ使用）
    var exportUrl = 'https://docs.google.com/spreadsheets/d/' + tempSsId +
                    '/export?format=xlsx&id=' + tempSsId;
    var response  = UrlFetchApp.fetch(exportUrl, {
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true,
    });

    if (response.getResponseCode() !== 200) {
      throw new Error('Excel エクスポート失敗: HTTP ' + response.getResponseCode());
    }

    var base64   = Utilities.base64Encode(response.getBlob().getBytes());
    var today    = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
    var filename = '宛名リスト_' + filterLbl + '_' + today + '.xlsx';

    return {
      base64:   base64,
      filename: filename,
      counts: {
        byType: Object.keys(rowsByType).reduce(function(acc, type) { acc[type] = rowsByType[type].length; return acc; }, {}),
        invalid: rowsInvalid.length,
      },
    };
  } finally {
    // 一時ファイルを必ず削除
    try { DriveApp.getFileById(tempSsId).setTrashed(true); } catch (e) {}
  }
}

/**
 * 宛名リスト シート書き込みヘルパー
 * ヘッダー行を太字で書き込み、データ行を追加し、列幅を自動調整する。
 */
function _fillMailingSheet_(sheet, headers, rows) {
  var hRange = sheet.getRange(1, 1, 1, headers.length);
  hRange.setValues([headers]);
  hRange.setFontWeight('bold');
  hRange.setBackground('#E8EAED');
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * 会員一括メール送信。
 * payload:
 *   recipientKeys: string[]              – 送信対象の recipientKey リスト
 *   from: string                         – 送信元メールアドレス（エイリアス含む）
 *   subject: string                      – 件名テンプレート（{{氏名}} {{事業所名}} {{会員番号}}）
 *   body: string                         – 本文テンプレート
 *   commonAttachments?: Array<{name, mimeType, base64}>
 *   individualAttachments?: Record<recipientKey, {name, mimeType, base64}>
 *   useAutoAttach?: boolean              – Drive自動添付を使用するか（デフォルト true）
 *   memberTypes?, memberStatus?, staffStatus?, mailingFilter?, excludeNoEmail?
 *     └── バックエンド側でも再フィルタ（セキュリティ担保）
 */
function sendBulkMemberMail_(payload) {
  if (!payload) throw new Error('パラメータが不足しています。');

  var recipientKeys = payload.recipientKeys;
  if (!recipientKeys || !recipientKeys.length) throw new Error('宛先が選択されていません。');

  var subject = String(payload.subject || '').trim();
  var body    = String(payload.body    || '').trim();
  if (!subject || !body) throw new Error('件名と本文は必須です。');

  // ── 送信元エイリアス検証 ──────────────────────────────────────
  var ownerEmail = Session.getEffectiveUser().getEmail();
  var from = validateRequestedFromAddress_(String(payload.from || '').trim(), ownerEmail);

  // ── 全宛先リストを再取得（セキュリティ: フロント送信値を信用しない） ──
  var filterPayload = {
    memberTypes:    payload.memberTypes,   // 省略時は getMembersForBulkMail_ が M_会員種別 の全種別にする
    memberStatus:   payload.memberStatus   || 'ACTIVE',
    staffStatus:    payload.staffStatus    || 'ENROLLED',
    mailingFilter:  'ALL',  // 送信時は全員対象（フロント側で絞り込み済みキーを送る）
    excludeNoEmail: false,  // キーで絞るのでここでは除外しない
  };
  var allRecipients = getMembersForBulkMail_(filterPayload);

  var keySet = {};
  recipientKeys.forEach(function(k) { keySet[String(k)] = true; });
  var targetRecipients = allRecipients.filter(function(r) {
    return keySet[String(r.recipientKey)];
  });
  if (!targetRecipients.length) throw new Error('送信対象が見つかりませんでした。');
  // 2026-10-13: 画面で選んだ宛先のうち、送信時の条件で外れた（退会など）件数を返す。以前は黙って外していた。
  var excludedCount = Math.max(0, Object.keys(keySet).length - targetRecipients.length);

  // ── 共通添付ファイル ──────────────────────────────────────────
  var commonAttachments = (payload.commonAttachments || []).map(function(att) {
    var bytes = Utilities.base64Decode(att.base64);
    return Utilities.newBlob(bytes, att.mimeType, att.name);
  });

  // ── Drive 自動添付マップ構築 ──────────────────────────────────
  var autoAttachMap = {};  // filename → DriveFile
  var useAutoAttach = payload.useAutoAttach !== false;
  var folderId = '';
  if (useAutoAttach) {
    var settingsSs = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
    folderId = String(getSystemSettingValue_(settingsSs, 'BULK_MAIL_AUTO_ATTACH_FOLDER_ID') || '').trim();
    if (folderId) {
      try {
        var folder = DriveApp.getFolderById(folderId);
        var fileIter = folder.getFiles();
        while (fileIter.hasNext()) {
          var f = fileIter.next();
          autoAttachMap[f.getName()] = f;
        }
      } catch (fe) {
        Logger.log('sendBulkMemberMail_: Drive自動添付フォルダ取得失敗: ' + fe.message);
      }
    }
  }

  // ── 送信ループ ────────────────────────────────────────────────
  var errors          = [];
  var autoAttachMissed = [];
  var sentCount       = 0;
  // 2026-07-03 是正: REDIRECT/SUPPRESS を「成功」と偽装しない（メール誤集約事故の再発防止）。
  var suppressedCount = 0;
  var deliveryMode    = 'LIVE';
  var fileNames       = Object.keys(autoAttachMap);
  var indvAttachMap   = payload.individualAttachments || {};

  for (var i = 0; i < targetRecipients.length; i += 1) {
    var rec = targetRecipients[i];
    if (!rec.email) {
      errors.push({ recipientKey: rec.recipientKey, displayName: rec.displayName, error: 'メールアドレス未登録' });
      continue;
    }

    try {
      // 差し込みタグ置換
      var mergeVars = { '氏名': rec.displayName, '事業所名': rec.officeName || '', '会員番号': rec.memberId || '' };
      var personalSubject = renderMergeTags_(subject, mergeVars);
      var personalBody = renderMergeTags_(body, mergeVars);

      var allAttachments = commonAttachments.slice();

      // Drive 自動添付（2026-10-13: 拡張子を除いたファイル名が氏名と完全一致するものだけ・docs/304 M1）。
      // 以前は部分一致の先頭 1 件で、「山田太」さんに「山田太郎.pdf」が付くなど別人の書類を送りえた。
      if (useAutoAttach && folderId && rec.name) {
        var wantName = String(rec.name).replace(/[\s\u3000]+/g, '');
        var matchedFiles = [];
        for (var j = 0; j < fileNames.length; j += 1) {
          var baseName = fileNames[j].replace(/\.[^.]+$/, '').replace(/[\s\u3000]+/g, '');
          if (baseName === wantName) matchedFiles.push(autoAttachMap[fileNames[j]]);
        }
        if (matchedFiles.length === 1) {
          try {
            allAttachments.push(matchedFiles[0].getBlob());
          } catch (be) {
            // 添付を取れないまま送らない（添付なしで送って成功に数えていた）
            errors.push({ recipientKey: rec.recipientKey, displayName: rec.displayName, error: '自動添付ファイルを取得できなかったため送信していません' });
            continue;
          }
        } else if (matchedFiles.length > 1) {
          errors.push({ recipientKey: rec.recipientKey, displayName: rec.displayName, error: '自動添付の候補が複数あるため送信していません（同じ名前のファイルが ' + matchedFiles.length + ' 件）' });
          continue;
        } else {
          autoAttachMissed.push(rec.displayName);
        }
      }

      // 個人追加添付
      var indvAtt = indvAttachMap[String(rec.recipientKey)];
      if (indvAtt) {
        var indvBytes = Utilities.base64Decode(indvAtt.base64);
        allAttachments.push(Utilities.newBlob(indvBytes, indvAtt.mimeType, indvAtt.name));
      }

      var bulkSendRes = deliverMail_('BULK_MAIL', rec.email, personalSubject, personalBody, {
        from: from,
        replyTo: from,
        name: '枚方市介護支援専門員連絡協議会',
        attachments: allAttachments,
      });
      if (bulkSendRes && bulkSendRes.sent) {
        sentCount += 1;
        if (bulkSendRes.mode && bulkSendRes.mode !== 'LIVE') deliveryMode = bulkSendRes.mode;
      } else {
        suppressedCount += 1;
      }
    } catch (e) {
      errors.push({ recipientKey: rec.recipientKey, displayName: rec.displayName, error: e.message });
    }
  }

  // ── T_メール送信ログ記録（append-only、個人情報なし） ────────────
  // v259: getLogSs_() 経由でログSSに書き込む。バグ修正: 以前は引数ミスで書き込まれていなかった
  var logId = Utilities.getUuid();
  var now   = new Date().toISOString();
  try {
    appendRowsByHeaders_(getLogSs_(), 'T_メール送信ログ', [{
      'ログID':       logId,
      '送信日時':     now,
      '送信者メール': from,
      '件名テンプレート': subject.substring(0, 200),
      '宛先数':       targetRecipients.length,
      '成功数':       sentCount,
      'エラー数':     errors.length,
      // 2026-07-03 是正: REDIRECT 送信をログ上も区別する（実宛先未達を「成功」と記録しない）
      '送信種別':     deliveryMode === 'REDIRECT' ? 'BULK_MEMBER_REDIRECT' : 'BULK_MEMBER',
      '削除フラグ':   false,
    }]);
  } catch (le) {
    Logger.log('sendBulkMemberMail_: ログ記録失敗: ' + le.message);
  }

  return {
    sent:             sentCount,
    total:            targetRecipients.length,
    errors:           errors.map(function(e) { return e.displayName + ': ' + e.error; }),
    autoAttachMissed: autoAttachMissed,
    logId:            logId,
    deliveryMode:     deliveryMode,
    suppressedCount:  suppressedCount,
    excludedCount:    excludedCount,
  };
}

/**
 * メール送信ログ取得。
 * 閲覧権限は T_システム設定.EMAIL_LOG_VIEWER_ROLE で動的チェック。
 * 設定値: 'MASTER' または 'MASTER,ADMIN' のどちらか。
 */
function getEmailSendLog_(payload) {
  var p = payload || {};
  var callerPermLevel = String(
    (p.__adminSession && p.__adminSession.adminPermissionLevel) || 'ADMIN'
  );

  var ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID_FIXED);
  var viewerRole = String(getSystemSettingValue_(ss, 'EMAIL_LOG_VIEWER_ROLE') || 'MASTER').trim();
  var allowedRoles = viewerRole.split(',').map(function(r) { return r.trim(); });
  if (allowedRoles.indexOf(callerPermLevel) < 0) {
    throw new Error('メール送信ログの閲覧権限がありません。（権限: ' + callerPermLevel + '）');
  }

  // v259: getLogSs_() 経由でログSSから読み込む
  var logSheet = getLogSs_().getSheetByName('T_メール送信ログ');
  if (!logSheet || logSheet.getLastRow() < 2) return [];

  var rows = getRowsAsObjectsFromSheet_(logSheet).filter(function(r) {
    return !toBoolean_(r['削除フラグ']);
  });
  rows.sort(function(a, b) {
    return String(b['送信日時'] || '').localeCompare(String(a['送信日時'] || ''));
  });

  return rows.map(function(r) {
    return {
      logId:           String(r['ログID']       || ''),
      sentAt:          String(r['送信日時']      || ''),
      senderEmail:     String(r['送信者メール']  || ''),
      subjectTemplate: String(r['件名テンプレート'] || ''),
      totalCount:      Number(r['宛先数']   || 0),
      successCount:    Number(r['成功数']   || 0),
      errorCount:      Number(r['エラー数'] || 0),
      sendType:        String(r['送信種別'] || ''),
    };
  });
}
