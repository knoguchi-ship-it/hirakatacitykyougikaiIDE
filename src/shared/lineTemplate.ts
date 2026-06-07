// 研修に紐づく公式LINE投稿依頼の本文テンプレート。
// 研修管理画面からの「文脈起点の作成（contextual creation）」で初期本文を自動生成する。
//
// 申込リンクは LinePostRequest.trainingApplyUrl に別フィールドとして格納し、
// プレビューでは本文下部にリンク表示されるため、本文側には URL を重複させない。

// LinePostEditorModal の LINE_POST_TEXT_MAX と一致させること。
const TEXT_MAX = 500;

/**
 * 研修情報から LINE 投稿依頼の初期本文を生成する。
 * 値が無い項目（開催日・会場）は行ごと省略する。
 */
export const buildTrainingLinePostDraft = (p: {
  title: string;
  date?: string;
  location?: string;
}): string => {
  const title = (p.title || '').trim();
  const lines: string[] = [`【研修のご案内】${title}`.trim(), ''];
  if (p.date && p.date.trim()) lines.push(`📅 開催日：${p.date.trim()}`);
  if (p.location && p.location.trim()) lines.push(`📍 会場：${p.location.trim()}`);
  lines.push('', '▼ お申込みはこちらのリンクから');
  const text = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return text.length > TEXT_MAX ? text.slice(0, TEXT_MAX) : text;
};
