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
