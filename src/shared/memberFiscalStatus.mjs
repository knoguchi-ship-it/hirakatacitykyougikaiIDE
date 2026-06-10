// v376.46: 会計年度基準の会員ステータス判定の【単一情報源】。
// 会員リスト（src/App.tsx の getMemberStatusAtFiscalYear）と
// 宛先リスト出力（gas-src の getMemberFiscalSnapshot_）が同一ロジックを使うことで、
// 「在籍中」人数が両画面でぶれる DRY 違反を解消する。
//
// フロントは本モジュールを直接 import（allowJs:true + moduleResolution:bundler）。
// GAS は build 時に serializeMemberFiscalStatusForGas() の出力（関数ソース）を
// gas-src/Code.full.gs のマーカーブロックへ注入して共有する（menu-registry.mjs と同方式）。
//
// 【重要・GAS 互換制約】computeMemberFiscalStatus は .toString() で GAS へ注入されるため、
//   - クロージャ・外部変数・import に依存しない自己完結関数とする
//   - 日付は ISO 文字列 'YYYY-MM-DD'（または ''）で受け取り辞書順比較する（タイムゾーン非依存）
// 会計年度 FY=Y は Y-04-01 〜 (Y+1)-03-31（日本の年度）。

/**
 * 会計年度時点の会員ステータスを判定する正準関数。
 * @param {{status?: string, joinedDate?: string, withdrawnDate?: string, deleted?: boolean}} input
 *   status: 会員状態コード（ACTIVE / WITHDRAWAL_SCHEDULED / WITHDRAWN / TRANSFERRED など）
 *   joinedDate / withdrawnDate: 'YYYY-MM-DD' or ''（空は未設定）
 *   deleted: 削除フラグ
 * @param {number} fiscalYear      判定対象の会計年度
 * @param {number} currentFiscalYear 現在の会計年度
 * @returns {{status: string, includeInMailing: boolean}}
 *   status ∈ ACTIVE | WITHDRAWAL_SCHEDULED | WITHDRAWN | TRANSFERRED | NOT_IN_YEAR
 *   includeInMailing: その年度に宛先（発送）対象となる実在籍会員か
 */
export function computeMemberFiscalStatus(input, fiscalYear, currentFiscalYear) {
  var status = String((input && input.status) || 'ACTIVE');
  var joined = String((input && input.joinedDate) || '');
  var withdrawn = String((input && input.withdrawnDate) || '');
  var deleted = !!(input && input.deleted);
  var fy = Number(fiscalYear || 0);
  var cfy = Number(currentFiscalYear || 0);
  var prevEnd = String(fy) + '-03-31';        // 前年度末（= 当年度開始 Y-04-01 の直前）
  var yearEnd = String(fy + 1) + '-03-31';     // 当年度末

  // 1) その年度に在籍していない（削除 / 年度末より後に入会 / 前年度末以前に退会）
  if (deleted) return { status: 'NOT_IN_YEAR', includeInMailing: false };
  if (joined && joined > yearEnd) return { status: 'NOT_IN_YEAR', includeInMailing: false };
  if (withdrawn && withdrawn <= prevEnd) return { status: 'NOT_IN_YEAR', includeInMailing: false };

  // 2) 移行済み（別人物へ統合）: 在籍中に数えない・宛先対象外
  if (status === 'TRANSFERRED') return { status: 'TRANSFERRED', includeInMailing: false };

  // 3) 退会済みだが退会日未設定: 退会扱い・宛先対象外
  if (status === 'WITHDRAWN' && !withdrawn) return { status: 'WITHDRAWN', includeInMailing: false };

  // 4) 退会予定（当年度以降のみ「退会予定」扱い。過去年度ではその年度の在籍状況へ落とす）
  if (status === 'WITHDRAWAL_SCHEDULED' && fy >= cfy) {
    return { status: 'WITHDRAWAL_SCHEDULED', includeInMailing: true };
  }

  // 5) 当年度内に退会
  if (withdrawn && withdrawn <= yearEnd) return { status: 'WITHDRAWN', includeInMailing: true };

  // 6) 在籍中
  return { status: 'ACTIVE', includeInMailing: true };
}

// GAS 注入用シリアライザ（build-{gas,member-gas,admin-gas}.mjs から使用）。
// computeMemberFiscalStatus の関数ソースを返すが、GAS では private 関数規約のため
// 末尾アンダースコア付き名 computeMemberFiscalStatus_ へリネームして注入する
// （末尾 _ なしは公開 web-app callable とみなされ境界チェックに弾かれるため）。
export function serializeMemberFiscalStatusForGas() {
  return computeMemberFiscalStatus
    .toString()
    .replace('function computeMemberFiscalStatus(', 'function computeMemberFiscalStatus_(');
}
