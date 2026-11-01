// 会員一覧の「継続年数」（2026-11-01・docs/317 §9.4 S で発見）。
//
// 以前は入会日の正午から今までの時間を 365.25 日で割っていたため、入会した当日の正午より前は
// 「-1年」と表示された。暦で満年数を数え（誕生日の年齢と同じ）、0 未満にはしない。

/** 入会日から基準日までの満年数。入会日が無い・基準日より後なら 0。 */
export function computeTenureYears(joined: Date | null, now: Date): number {
  if (!joined || Number.isNaN(joined.getTime())) return 0;
  let years = now.getFullYear() - joined.getFullYear();
  const beforeAnniversary = now.getMonth() < joined.getMonth()
    || (now.getMonth() === joined.getMonth() && now.getDate() < joined.getDate());
  if (beforeAnniversary) years -= 1;
  return Math.max(0, years);
}
