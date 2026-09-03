// 入力検証パターンの単一情報源（docs/248 DRY 是正・2026-07-05）。
// 以前は api.ts / TrainingManagement.tsx に同一 regex が重複定義されていた。
// frontend はここから import する。GAS 側の同種チェックは各関数内ローカル
// （regex literal を gas-src 間で移動すると build pruner 罠があるため意図的に非注入。
//  feedback_build_pruner_regex_action_traps 参照）。両者を変更する際は本ファイルと
// gas-src の該当箇所（verifyMemberIdentityForPublic 周辺）を同時更新すること。

/** メールアドレス（簡易・実運用は送達で最終検証） */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 電話番号（数字・+・ハイフン・括弧・全角長音/マイナス許容・6桁以上） */
export const PHONE_PATTERN = /^[0-9+\-() ー−]{6,}$/;

/** 介護支援専門員番号（公開側の厳格形: 8桁数字。admin 例外は docs/03 §4.1） */
export const CARE_MANAGER_NO_PATTERN = /^\d{8}$/;

/** 介護支援専門員番号（admin 緩和形: 1〜10 桁英数字。HN/HS プレフィックス対応） */
export const CARE_MANAGER_NO_RELAXED_PATTERN = /^[A-Za-z0-9]{1,10}$/;

/**
 * 郵便番号（ハイフン有無どちらも受理する）。
 * v376.67 DRY 是正: 公開申込は `^\d{3}-\d{4}$`（ハイフン必須）、管理 2 画面は `^\d{3}-?\d{4}$`（任意）と
 * 分かれており、同じ「郵便番号」なのに公開だけ `5730000` を弾いていた。受理は緩い側へ統一し、
 * 保存前に normalizePostalCode() で `123-4567` 形式へ正規化することで表記を揃える。
 */
export const POSTAL_CODE_PATTERN = /^\d{3}-?\d{4}$/;

/** カタカナ（全角カタカナ・長音・中黒・空白） */
export const KATAKANA_PATTERN = /^[ァ-ヶー－・\s　]+$/u;

/** 事業所番号（10 桁英数字） */
export const OFFICE_NO_PATTERN = /^[A-Za-z0-9]{10}$/;

/** 郵便番号を `123-4567` 形式へ正規化する（数字以外は除去。7 桁でなければ入力値をそのまま返す） */
export function normalizePostalCode(value: string): string {
  const digits = String(value || '').replace(/[^0-9]/g, '');
  if (digits.length !== 7) return String(value || '').trim();
  return digits.slice(0, 3) + '-' + digits.slice(3);
}
