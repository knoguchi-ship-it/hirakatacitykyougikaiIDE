// 研修の日付表記の単一情報源（2026-10-23 operator 指示「研修の日付の書き方は統一」）。
//
// 表記は和暦（2026-10-18 operator 決定）: 令和8年6月20日(土) 14:00〜16:30
//   - 時刻が無い値（申込締切日など）は日付だけ: 令和8年6月20日(土)
//   - 終了時刻が無ければ「14:00〜」
// 以前は 4 通りあった（公開=和暦・会員=toLocaleString・受付メール=2026-06-20 14:00・LINE 下書き=2026-06-20T14:00）。
//
// フロントは import、GAS は build が formatTrainingDateJa_ として注入する（memberFiscalStatus.mjs と同じ方式）。
// 注入するので、この関数は自己完結にする（外の変数・関数を参照しない）。
// build pruner の罠を避けるため、正規表現リテラルを使わない（feedback_build_pruner_regex_action_traps）。

/**
 * @param {string} dateStr  'yyyy-MM-dd' / 'yyyy-MM-dd HH:mm' / 'yyyy-MM-ddTHH:mm[:ss]' / 'yyyy/MM/dd …'
 * @param {string} [endTime] 'HH:mm'
 * @returns {string} 読めない値はそのまま返す
 */
export function formatTrainingDateJa(dateStr, endTime) {
  var raw = String(dateStr == null ? '' : dateStr).trim();
  if (!raw) return '';
  var sep = raw.indexOf('T') !== -1 ? 'T' : ' ';
  var datePart = raw.split(sep)[0].split('/').join('-');
  var timePart = raw.indexOf(sep) !== -1 ? raw.slice(raw.indexOf(sep) + 1) : '';
  var ymd = datePart.split('-');
  if (ymd.length !== 3) return raw;
  var y = Number(ymd[0]);
  var m = Number(ymd[1]);
  var d = Number(ymd[2]);
  if (!(y > 0) || !(m >= 1 && m <= 12) || !(d >= 1 && d <= 31)) return raw;

  function hhmm(value) {
    var s = String(value == null ? '' : value).trim();
    var parts = s.split(':');
    if (parts.length < 2) return '';
    var h = Number(parts[0]);
    var mi = Number(parts[1].slice(0, 2));
    if (parts[0] === '' || isNaN(h) || isNaN(mi) || h < 0 || h > 23 || mi < 0 || mi > 59) return '';
    return h + ':' + (mi < 10 ? '0' : '') + mi;
  }

  var key = y * 10000 + m * 100 + d;
  var era;
  if (key >= 20190501) era = '令和' + (y - 2018 === 1 ? '元' : String(y - 2018));
  else if (key >= 19890108) era = '平成' + (y - 1988 === 1 ? '元' : String(y - 1988));
  else era = String(y);
  // 曜日は暦の上の日付から求める（端末のタイムゾーンに左右されない）
  var weekday = '日月火水木金土'.charAt(new Date(Date.UTC(y, m - 1, d)).getUTCDay());
  var text = era + '年' + m + '月' + d + '日(' + weekday + ')';

  var start = hhmm(timePart);
  if (start) {
    var end = hhmm(endTime);
    text += ' ' + start + '〜' + end;
  }
  return text;
}

/** GAS へ注入するソース（private 規約のため末尾 _ の名前にする） */
export function serializeTrainingDateForGas() {
  return formatTrainingDateJa.toString().replace('function formatTrainingDateJa(', 'function formatTrainingDateJa_(');
}
