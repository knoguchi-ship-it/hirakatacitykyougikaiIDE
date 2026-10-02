/**
 * 勤務先（所属）の有無を判定する単一情報源。
 *
 * 仕様の正本は `docs/spec/02_RD.md` §479:
 *   個人会員・賛助会員では、勤務先名が空または `勤務なし` の場合は**勤務先なし**として扱う
 *
 * 2026-10-01 まで、この判定は `MemberForm.tsx` にインラインで 1 箇所あるだけだった。
 * 公開ポータルから勤務先を変更できるようにするにあたり、同じ判定が 3 箇所
 * （管理画面・公開ポータル・GAS の保存検証）に要るため、ここへ集約した。
 *
 * **GAS 側は `gas-src/Code.full.gs` の `isNoOfficeAffiliation_` がローカル実装を持つ**
 * （`validators.ts` と同じ方針。build 注入の経路を 1 本増やさない）。
 * 両者がずれると「画面は通すのにサーバが弾く」事故になるため、
 * `npm run test:office-affiliation` が文言と判定の一致を検査する。
 */

/** 勤務先なしを表す予約語。DB の `T_会員.勤務先名` にこの文字列を入れる。 */
export const NO_OFFICE_AFFILIATION_LABEL = '勤務なし';

/**
 * 勤務先なしか。空欄も「未設定＝勤務先なし」として扱う（§479）。
 * 事業所会員には使わない（事業所会員にとって勤務先名は自身の事業所名）。
 */
export function isNoOfficeAffiliation(officeName: string | null | undefined): boolean {
  const name = String(officeName ?? '').trim();
  return name === '' || name === NO_OFFICE_AFFILIATION_LABEL;
}
