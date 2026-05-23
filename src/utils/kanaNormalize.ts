// v376: 氏名フリガナ（セイ/メイ/フリガナ）保存用の正規化ユーティリティ。
// 入力が半角カナ / ひらがな / 全角カナの混在でも、保存形式は「全角カタカナ + 長音 + 全角スペース + 中点」に統一する。
//
// 順序: trim → NFKC → ひらがな→カタカナ → 半角スペース→全角スペース → NFC
//   - NFKC: 半角カナ「ｱ」→ 全角カナ「ア」、半角濁点「ｶﾞ」→ 全角合成「ガ」、半角中点「･」→ 全角「・」、半角長音「ｰ」→ 全角「ー」
//   - ひらがな→カタカナ: U+3041〜U+3096 を +0x60 シフトして U+30A1〜U+30F6 へ
//   - 半角スペース→全角スペース: 氏名フリガナは姓名間スペースを保持する運用のため、半角を全角に寄せる
//   - NFC: 念のため合成形を正規化（NFKC は分解後再合成するが明示）
//
// 注: search.ts の normalizeSearchText とは別関数。あちらは「検索用」で toLowerCase + 句読点の正規化を含む。
// こちらは「保存用」で大文字小文字は保持（カタカナには影響しないが、validation 結果の予測性を高めるため）。

const HIRAGANA_TO_KATAKANA_DIFF = 0x60;

const toKatakana = (s: string): string =>
  s.replace(/[ぁ-ゖ]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) + HIRAGANA_TO_KATAKANA_DIFF),
  );

/**
 * フリガナ列を保存用の標準形（全角カタカナ）に正規化する。
 * 空文字や null/undefined はそのまま空文字を返す。
 */
export const normalizeKana = (value: unknown): string => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  return toKatakana(raw.normalize('NFKC')).replace(/ /g, '　').normalize('NFC');
};

// 許容文字集合: 全角カタカナ ァ-ヶ (U+30A1〜U+30F6) + ヴ (U+30F4 は範囲内) + 長音 ー (U+30FC)
//             + 全角スペース　 (U+3000) + 全角中点 ・ (U+30FB)
// 注: U+30F7-U+30FA (ヷヸヹヺ) は実用性が低く除外。必要なら拡張可能。
const FULLWIDTH_KATAKANA_PATTERN = /^[ァ-ヶー　・]*$/;

/**
 * 正規化済み文字列が「全角カタカナ + 長音 + 全角スペース + 中点」のみで構成されるか判定。
 * 空文字は true（必須チェックは別途行う）。
 */
export const isValidFullwidthKatakana = (normalized: string): boolean =>
  FULLWIDTH_KATAKANA_PATTERN.test(normalized);

/**
 * normalize + validate を一括で行うヘルパー。
 * - required=false: 空文字は許容
 * - required=true: 空文字は invalid
 * 不正文字を含む場合は { valid: false, value: <正規化結果> } を返す。
 */
export interface KanaValidationResult {
  valid: boolean;
  value: string;
  reason?: 'empty' | 'invalid_chars';
}

export const normalizeAndValidateKana = (
  value: unknown,
  options: { required?: boolean } = {},
): KanaValidationResult => {
  const normalized = normalizeKana(value);
  if (!normalized) {
    return options.required
      ? { valid: false, value: '', reason: 'empty' }
      : { valid: true, value: '' };
  }
  return isValidFullwidthKatakana(normalized)
    ? { valid: true, value: normalized }
    : { valid: false, value: normalized, reason: 'invalid_chars' };
};
