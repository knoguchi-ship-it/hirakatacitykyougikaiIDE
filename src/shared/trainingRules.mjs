// 研修の登録と受付期間のルールの単一情報源（2026-11-02・docs/319 §5.5・BR-22）。
//
// フロントは import、GAS は build が各関数を「名前_」として注入する（trainingDate.mjs と同じ方式）。
// 注入するので自己完結にする（このファイルの外の変数・関数を参照しない。互いの呼び出しは serialize で名前_ に置き換える）。
// build pruner の罠を避けるため、正規表現リテラルを使わない（feedback_build_pruner_regex_action_traps）。
//
// 日付は日本時間で区切る。GAS のスクリプトのタイムゾーンが America/New_York のため、setHours などの
// 「実行環境の時刻」で区切ると、締切日が日本時間 13:59 に終わるなどのずれが出ていた（2026-11-02 発見）。

/**
 * 日付・日時を日本時間の 'yyyy-MM-dd' にする。読めなければ ''。
 * @param {Date|string|null|undefined} value  Date（シートのセル）／'yyyy-MM-dd'／'yyyy/MM/dd'／'yyyy-MM-dd HH:mm'／'yyyy-MM-ddTHH:mm'
 */
export function toJstYmd(value) {
  if (value == null || value === '') return '';
  if (Object.prototype.toString.call(value) === '[object Date]') {
    var t = value.getTime();
    if (t !== t) return '';
    return new Date(t + 9 * 3600000).toISOString().slice(0, 10);
  }
  var raw = String(value).trim();
  if (!raw) return '';
  var head = raw.split('T')[0].split(' ')[0].split('/').join('-');
  var parts = head.split('-');
  if (parts.length !== 3 || parts[0].length !== 4) return '';
  var y = Number(parts[0]);
  var m = Number(parts[1]);
  var d = Number(parts[2]);
  if (!(y > 0) || !(m >= 1 && m <= 12) || !(d >= 1 && d <= 31)) return '';
  var check = new Date(Date.UTC(y, m - 1, d));
  if (check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return '';
  return String(y) + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
}

/** 日本時間のその日の 0:00:00.000（epoch ミリ秒）。読めなければ null */
export function jstDayStartMs(value) {
  var ymd = toJstYmd(value);
  if (!ymd) return null;
  var p = ymd.split('-');
  return Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2])) - 9 * 3600000;
}

/** 日本時間のその日の 23:59:59.999（epoch ミリ秒）。読めなければ null */
export function jstDayEndMs(value) {
  var start = jstDayStartMs(value);
  return start == null ? null : start + 86400000 - 1;
}

/**
 * 研修の登録内容を確かめ、誤りをすべて返す（1 件ずつではなくまとめて）。画面とサーバーが同じ関数を使う。
 * 問い合わせ先の電話・メールの形式は既存の単一情報源（validators・normalizeInquiryContacts_）で別に確かめる。
 *
 * @param {object} input
 *   title, date（開催日時）, organizer, location, summary, inquiryPerson,
 *   capacityEnabled（定員の項目が有効か）, capacity,
 *   feesEnabled, fees（[{label, amount}]）,
 *   applicationOpenDate, applicationCloseDate（無効な項目は '' で渡す）, applicationUrl
 * @returns {{field: string, message: string}[]}  field は画面の項目のキー
 */
export function validateTrainingRegistration(input) {
  var v = input || {};
  var errors = [];
  var text = function (x) { return String(x == null ? '' : x).trim(); };
  var push = function (field, message) { errors.push({ field: field, message: message }); };

  if (!text(v.title)) push('title', '研修タイトルを入力してください。');
  var eventYmd = toJstYmd(v.date);
  if (!text(v.date)) push('date', '開催日時を入力してください。');
  else if (!eventYmd) push('date', '開催日時の形式が正しくありません。');
  if (!text(v.organizer)) push('organizer', '主催者を入力してください。');
  if (!text(v.location)) push('location', '開催場所を入力してください。');
  if (!text(v.summary)) push('summary', '研修概要を入力してください。');
  if (!text(v.inquiryPerson)) push('inquiryPerson', '問い合わせ窓口の担当者を入力してください。');

  if (v.capacityEnabled !== false) {
    var cap = text(v.capacity);
    var capNum = Number(cap);
    if (!cap || !(capNum >= 1) || Math.floor(capNum) !== capNum) {
      push('capacity', '定員は 1 以上の整数で入力してください。定員を設けない場合は「定員」の項目を無効にしてください。');
    }
  }

  if (v.feesEnabled !== false) {
    var fees = Array.isArray(v.fees) ? v.fees : [];
    var labelMissing = false;
    var amountBad = false;
    for (var i = 0; i < fees.length; i += 1) {
      var f = fees[i] || {};
      if (!text(f.label)) labelMissing = true;
      var amt = text(f.amount);
      var amtNum = Number(amt);
      if (amt === '' || !(amtNum >= 0) || Math.floor(amtNum) !== amtNum) amountBad = true;
    }
    if (labelMissing) push('fees', '研修費用の区分名を入力してください。');
    if (amountBad) push('fees', '研修費用の金額は 0 以上の整数で入力してください。');
  }

  var url = text(v.applicationUrl);
  if (url) {
    var lower = url.toLowerCase();
    if (lower.indexOf('https://') !== 0 && lower.indexOf('http://') !== 0) {
      push('applicationUrl', '申込URL は http:// または https:// で始まるアドレスを入力してください。');
    }
  }

  // 受付期間（BR-22）: 申込開始日 ≦ 申込締切日 ≦ 開催日。受付は開催日の当日中まで
  var openRaw = text(v.applicationOpenDate);
  var closeRaw = text(v.applicationCloseDate);
  var openYmd = toJstYmd(openRaw);
  var closeYmd = toJstYmd(closeRaw);
  if (openRaw && !openYmd) push('applicationOpenDate', '申込開始日の形式が正しくありません。');
  if (closeRaw && !closeYmd) push('applicationCloseDate', '申込締切日の形式が正しくありません。');
  if (eventYmd && closeYmd && closeYmd > eventYmd) {
    push('applicationCloseDate', '申込締切日は開催日以前の日付にしてください（受付は開催日の当日までです）。');
  }
  var openLimit = closeYmd || eventYmd;
  if (openYmd && openLimit && openYmd > openLimit) {
    push('applicationOpenDate', closeYmd
      ? '申込開始日は申込締切日以前の日付にしてください。'
      : '申込開始日は開催日以前の日付にしてください。');
  }
  return errors;
}

/** GAS へ注入する本文（各関数を 名前_ にし、互いの呼び出しも置き換える） */
export function serializeTrainingRulesForGas() {
  var names = ['toJstYmd', 'jstDayStartMs', 'jstDayEndMs', 'validateTrainingRegistration'];
  var fns = [toJstYmd, jstDayStartMs, jstDayEndMs, validateTrainingRegistration];
  var body = fns.map(function (fn) { return fn.toString(); }).join('\n\n');
  for (var i = 0; i < names.length; i += 1) {
    body = body.split(names[i] + '(').join(names[i] + '_(');
  }
  return body;
}
