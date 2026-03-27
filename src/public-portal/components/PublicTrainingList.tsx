import React from 'react';
import { PublicTraining } from '../../shared/types';

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
        // 公開APIでは申込者数を返していないため、定員判定はサーバー側で実施する。
        const isFull = false;

        return (
          <div key={t.id} className="bg-white rounded-lg shadow p-6 space-y-4">
            {/* タイトル */}
            <h2 className="text-lg font-semibold text-gray-900">{t.name}</h2>

            {/* 基本情報グリッド */}
            <dl className="text-sm text-gray-700 space-y-2">
              {dateWareki && (
                <div className="flex gap-2">
                  <dt className="font-medium text-gray-600 whitespace-nowrap">開催日時</dt>
                  <dd>{dateDisplay}</dd>
                </div>
              )}
              {t.location && (
                <div className="flex gap-2">
                  <dt className="font-medium text-gray-600 whitespace-nowrap">会場</dt>
                  <dd>{t.location}</dd>
                </div>
              )}
              {t.organizer && (
                <div className="flex gap-2">
                  <dt className="font-medium text-gray-600 whitespace-nowrap">主催</dt>
                  <dd>{t.organizer}</dd>
                </div>
              )}
              {t.instructor && (
                <div className="flex gap-2">
                  <dt className="font-medium text-gray-600 whitespace-nowrap">講師</dt>
                  <dd>{t.instructor}</dd>
                </div>
              )}
              {t.capacity > 0 && (
                <div className="flex gap-2">
                  <dt className="font-medium text-gray-600 whitespace-nowrap">定員</dt>
                  <dd>{t.capacity}名</dd>
                </div>
              )}
              {endDateWareki && (
                <div className="flex gap-2">
                  <dt className="font-medium text-gray-600 whitespace-nowrap">申込締切</dt>
                  <dd>{endDateWareki}</dd>
                </div>
              )}
            </dl>

            {/* 研修概要 */}
            {t.summary && (
              <p className="text-sm text-gray-700">{t.summary}</p>
            )}

            {/* 詳細内容 */}
            {t.content && (
              <div className="bg-gray-50 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap">
                {t.content}
              </div>
            )}

            {/* 費用 */}
            {costs.length > 0 && (
              <div className="text-sm">
                <span className="font-medium text-gray-600">参加費：</span>
                {costs.map((c, i) => (
                  <span key={i} className="ml-2">
                    {c.label}：{c.amount === 0 ? '無料' : `${c.amount.toLocaleString()}円`}
                  </span>
                ))}
              </div>
            )}

            {/* 問合せ先 */}
            {inquiry && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">問合せ先：</span>
                {inquiry.person && <span className="ml-1">{inquiry.person}</span>}
                {inquiry.value && (
                  <span className="ml-2">
                    {inquiry.type === 'EMAIL' ? (
                      <a href={`mailto:${inquiry.value}`} className="text-primary-600 underline">{inquiry.value}</a>
                    ) : (
                      inquiry.value
                    )}
                  </span>
                )}
              </div>
            )}

            {/* 案内状 + 申込ボタン */}
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-100">
              <div>
                {t.fileUrl && (
                  <a
                    href={t.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary-600 underline hover:text-primary-900"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    案内状（PDF）を開く
                  </a>
                )}
              </div>
              <button
                onClick={() => onApply(t)}
                disabled={isFull}
                className="px-5 py-2 bg-primary-600 text-white text-sm font-medium rounded hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {isFull ? '満員' : '申込する'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PublicTrainingList;
