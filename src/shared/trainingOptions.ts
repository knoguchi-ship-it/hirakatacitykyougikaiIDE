// v376.34: 研修の任意項目トグル（fieldConfig）を公開側でも尊重するための共有ヘルパー。
//
// 公開API getPublicTrainings が返す `fieldConfig` は「項目設定JSON」文字列で、構造は:
//   { fieldConfig: { instructor: bool, applicationUrl: bool, ... }, inquiryPerson, inquiryContactType, ... }
// （トグル群は **ネストした fieldConfig プロパティ** にある点に注意）
//
// admin の「有効/無効」トグル（TRAINING_OPTIONAL_FIELD_DEFS）を単一情報源とし、
// 無効（false）の項目は申込画面に表示しない／申込URL は内部フローへフォールバックする。

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
 * 外部申込フォーム URL の実効値を返す。
 * applicationUrl トグルが有効かつ値があるときだけ URL を返し、無効なら ''（内部申込フロー）。
 */
export function effectiveApplicationUrl(t: { applicationUrl?: string; fieldConfig?: string }): string {
  const url = (t.applicationUrl || '').trim();
  if (!url) return '';
  return isTrainingFieldEnabled(t.fieldConfig, 'applicationUrl') ? url : '';
}
