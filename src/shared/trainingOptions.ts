// v376.34: 研修の任意項目トグル（fieldConfig）を公開側でも尊重するための共有ヘルパー。
// v376.35: 申込URL トグルの意味を「公開ポータルでの申込受付 ON/OFF」に拡張（無効=申込ボタン非表示）。
//
// 公開API getPublicTrainings が返す `fieldConfig` は「項目設定JSON」文字列で、構造は:
//   { fieldConfig: { instructor: bool, applicationUrl: bool, ... }, inquiryPerson, inquiryContactType, ... }
// （トグル群は **ネストした fieldConfig プロパティ** にある点に注意）
//
// admin の「有効/無効」トグル（TRAINING_OPTIONAL_FIELD_DEFS）を単一情報源とし、
// 無効（false）の情報項目は申込画面に表示しない／申込URL 無効時は申込ボタン自体を出さない。

/** 任意項目が有効か（未設定・旧データ・パース失敗時はデフォルト有効）。 */
export function isTrainingFieldEnabled(optionsJson: string | undefined | null, key: string): boolean {
  if (!optionsJson) return true;
  try {
    const obj = JSON.parse(optionsJson);
    const fc = obj && obj.fieldConfig;
    if (!fc || typeof fc !== 'object') return true;
    return fc[key] !== false;
  } catch {
    return true;
  }
}

/**
 * 公開ポータルの申込 CTA 種別を解決する。
 *  - 'none'     : 申込URL トグルが無効 → 申込ボタンを表示しない（閲覧のみ）
 *  - 'external' : 申込URL 有効 かつ URL 値あり → 外部申込フォームへのリンク
 *  - 'internal' : 申込URL 有効 かつ URL 空 → 内部申込フォーム（既定の申し込むボタン）
 */
export function resolveApplyCta(t: { applicationUrl?: string; fieldConfig?: string }): 'none' | 'external' | 'internal' {
  if (!isTrainingFieldEnabled(t.fieldConfig, 'applicationUrl')) return 'none';
  return (t.applicationUrl || '').trim() ? 'external' : 'internal';
}
