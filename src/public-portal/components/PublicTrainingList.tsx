import React, { useState } from 'react';
import { PublicTraining } from '../../shared/types';
import PdfThumbnail from '../../components/PdfThumbnail';
import PdfPreviewModal from '../../components/PdfPreviewModal';
import { callApi } from '../../shared/api-base';

const fetchPublicThumbnail = (fileUrl: string): Promise<string | null> =>
  callApi<{ thumbnail: string | null }>('getFileThumbnail', { fileUrl })
    .then((res) => res.thumbnail)
    .catch(() => null);

const fetchPublicHighResImage = (fileUrl: string): Promise<string | null> =>
  callApi<{ thumbnail: string | null }>('getFileThumbnail', { fileUrl, size: 2000 })
    .then((res) => res.thumbnail)
    .catch(() => null);

interface Props {
  trainings: PublicTraining[];
  onApply: (training: PublicTraining) => void;
}

/** ISO日付文字列 ("yyyy-MM-dd HH:mm") を和暦に変換する */
function toWareki(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(' ', 'T'));
  if (isNaN(d.getTime())) return dateStr;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  if (d >= new Date('2019-05-01')) {
    return `令和${year - 2018}年${month}月${day}日`;
  }
  if (d >= new Date('1989-01-08')) {
    return `平成${year - 1988}年${month}月${day}日`;
  }
  return dateStr;
}

/** ISO日付文字列から時刻部分 "HH:mm" を抽出する */
function extractTime(dateStr: string): string {
  if (!dateStr) return '';
  const m = dateStr.match(/(\d{2}:\d{2})$/);
  return m ? m[1] : '';
}

/** "HH:mm" 形式かどうかを検証する */
function isTimeStr(s: string): boolean {
  return /^\d{2}:\d{2}$/.test(s.trim());
}

/** 費用JSONを表示文字列に変換する */
function parseCost(costJson: string): { label: string; amount: number }[] {
  try {
    const arr = JSON.parse(costJson);
    if (Array.isArray(arr)) return arr;
  } catch {
    // ignore
  }
  return [];
}

/** 問合せ先情報を fieldConfig から取得する */
function parseInquiry(fieldConfig: string): { person: string; type: string; value: string } | null {
  try {
    const obj = JSON.parse(fieldConfig);
    const person = String(obj.inquiryPerson || '').trim();
    const value = String(obj.inquiryContactValue || '').trim();
    if (!person && !value) return null;
    return { person, type: String(obj.inquiryContactType || 'PHONE'), value };
  } catch {
    return null;
  }
}

const PublicTrainingList: React.FC<Props> = ({ trainings, onApply }) => {
  // v355: PDF プレビュー lightbox
  const [previewTraining, setPreviewTraining] = useState<{ title: string; fileUrl: string } | null>(null);

  if (trainings.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        現在、受付中の研修はありません。
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {trainings.map((t) => {
        const dateWareki = toWareki(t.date);
        const startTime = extractTime(t.date);
        const endTimeStr = t.endTime && isTimeStr(t.endTime) ? t.endTime.trim() : '';
        let dateDisplay = dateWareki;
        if (startTime) {
          dateDisplay += ` ${startTime}`;
          if (endTimeStr) dateDisplay += `〜${endTimeStr}`;
          else dateDisplay += '〜';
        }

        const endDateWareki = t.endDate ? toWareki(t.endDate) : '';
        const costs = parseCost(t.cost);
        const inquiry = parseInquiry(t.fieldConfig);
        const isFull = false; // サーバー側で判定済み

        return (
          <article
            key={t.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            {/* ヘッダーバー: 受付状況 + 開催日時 */}
            <header className="flex flex-wrap items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary-50 to-white border-b border-slate-100">
              <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1">
                受付中
              </span>
              {dateWareki && (
                <span className="text-sm font-medium text-slate-700">
                  {dateDisplay}
                </span>
              )}
            </header>

            <div className="flex flex-col sm:flex-row gap-5 p-4 sm:p-6">
              {/* 左カラム: A4 縦 PDF サムネイル */}
              <div className="w-full max-w-[180px] sm:max-w-[200px] mx-auto sm:mx-0 flex-shrink-0">
                {t.thumbnailUrl ? (
                  <PdfThumbnail
                    thumbnailUrl={t.thumbnailUrl}
                    fileUrl={t.fileUrl}
                    fetchThumbnail={fetchPublicThumbnail}
                    aspectRatio="210 / 297"
                    onPreview={t.fileUrl ? () => setPreviewTraining({ title: t.name, fileUrl: t.fileUrl }) : undefined}
                  />
                ) : (
                  <div
                    className="flex items-center justify-center bg-slate-100 border border-slate-200 rounded-xl text-slate-400 text-xs text-center px-2"
                    style={{ aspectRatio: '210 / 297' }}
                    aria-label="案内PDFサムネイルなし"
                  >
                    案内PDFサムネイル<br />未生成
                  </div>
                )}
                {t.fileUrl && (
                  <a
                    href={t.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex min-h-[44px] items-center justify-center gap-1 w-full px-2 text-xs font-medium text-primary-700 hover:bg-primary-50 hover:underline rounded-md"
                    aria-label={`${t.name} の案内PDFを別タブで開く`}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    案内PDFを全ページ開く
                  </a>
                )}
              </div>

              {/* 右カラム: 詳細情報 */}
              <div className="flex-1 flex flex-col gap-3 min-w-0">
                {/* タイトル */}
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug break-words">
                  {t.name}
                </h2>

                {/* 概要 */}
                {t.summary && (
                  <p className="text-sm text-slate-700 leading-relaxed">{t.summary}</p>
                )}

                {/* 主要メタ情報グリッド */}
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  {dateWareki && (
                    <div className="flex gap-2">
                      <dt className="font-medium text-slate-500 whitespace-nowrap min-w-[4rem]">開催日時</dt>
                      <dd className="text-slate-800 break-words">{dateDisplay}</dd>
                    </div>
                  )}
                  {t.location && (
                    <div className="flex gap-2">
                      <dt className="font-medium text-slate-500 whitespace-nowrap min-w-[4rem]">会場</dt>
                      <dd className="text-slate-800 break-words">{t.location}</dd>
                    </div>
                  )}
                  {t.organizer && (
                    <div className="flex gap-2">
                      <dt className="font-medium text-slate-500 whitespace-nowrap min-w-[4rem]">主催</dt>
                      <dd className="text-slate-800 break-words">{t.organizer}</dd>
                    </div>
                  )}
                  {t.instructor && (
                    <div className="flex gap-2">
                      <dt className="font-medium text-slate-500 whitespace-nowrap min-w-[4rem]">講師</dt>
                      <dd className="text-slate-800 break-words">{t.instructor}</dd>
                    </div>
                  )}
                  {t.capacity > 0 && (
                    <div className="flex gap-2">
                      <dt className="font-medium text-slate-500 whitespace-nowrap min-w-[4rem]">定員</dt>
                      <dd className="text-slate-800">{t.capacity}名</dd>
                    </div>
                  )}
                  {endDateWareki && (
                    <div className="flex gap-2">
                      <dt className="font-medium text-slate-500 whitespace-nowrap min-w-[4rem]">申込締切</dt>
                      <dd className="text-slate-800">{endDateWareki}</dd>
                    </div>
                  )}
                </dl>

                {/* 詳細内容 */}
                {t.content && (
                  <div className="bg-slate-50 border border-slate-100 rounded-md p-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {t.content}
                  </div>
                )}

                {/* 費用 */}
                {costs.length > 0 && (
                  <div className="text-sm text-slate-700">
                    <span className="font-medium text-slate-500">参加費</span>
                    {costs.map((c, i) => (
                      <span key={i} className="ml-2 inline-block">
                        <span className="text-slate-600">{c.label}：</span>
                        <span className="font-semibold text-slate-900">
                          {c.amount === 0 ? '無料' : `${c.amount.toLocaleString()}円`}
                        </span>
                      </span>
                    ))}
                  </div>
                )}

                {/* 問合せ先 */}
                {inquiry && (
                  <div className="text-sm text-slate-600">
                    <span className="font-medium text-slate-500">問合せ先</span>
                    {inquiry.person && <span className="ml-2">{inquiry.person}</span>}
                    {inquiry.value && (
                      <span className="ml-2">
                        {inquiry.type === 'EMAIL' ? (
                          <a href={`mailto:${inquiry.value}`} className="text-primary-600 underline break-all">
                            {inquiry.value}
                          </a>
                        ) : (
                          <span className="break-all">{inquiry.value}</span>
                        )}
                      </span>
                    )}
                  </div>
                )}

                {/* CTA — v376.30: applicationUrl が設定されていれば外部申込フォームへのリンクに置換 */}
                <div className="mt-auto pt-3 border-t border-slate-100 flex justify-end">
                  {t.applicationUrl ? (
                    <a
                      href={t.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] items-center justify-center gap-1 px-6 py-2 bg-primary-600 text-white text-sm font-bold rounded-md hover:bg-primary-700 transition-colors"
                      aria-label={`${t.name} の申込フォームを別タブで開く`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      申込フォームへ
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onApply(t)}
                      disabled={isFull}
                      className="inline-flex min-h-[44px] items-center justify-center gap-1 px-6 py-2 bg-primary-600 text-white text-sm font-bold rounded-md hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                      aria-label={`${t.name} に申し込む`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      {isFull ? '満員' : '申し込む'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </article>
        );
      })}
      {/* v358: PDF プレビュー lightbox (高解像度 PNG モーダル) */}
      <PdfPreviewModal
        open={!!previewTraining}
        onClose={() => setPreviewTraining(null)}
        fileUrl={previewTraining?.fileUrl || ''}
        title={previewTraining?.title}
        fetchHighResImage={fetchPublicHighResImage}
      />
    </div>
  );
};

export default PublicTrainingList;
