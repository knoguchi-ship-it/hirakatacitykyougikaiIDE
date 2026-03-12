import React from 'react';
import { PublicTraining } from '../../shared/types';

interface Props {
  trainings: PublicTraining[];
  onApply: (training: PublicTraining) => void;
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
    <div className="space-y-4">
      {trainings.map((t) => (
        <div key={t.id} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{t.name}</h2>
              <div className="text-sm text-gray-600 space-y-1">
                {t.date && (
                  <div>
                    <span className="font-medium">開催日:</span> {t.date}
                  </div>
                )}
                {t.location && (
                  <div>
                    <span className="font-medium">会場:</span> {t.location}
                  </div>
                )}
                {t.endDate && (
                  <div>
                    <span className="font-medium">申込締切:</span> {t.endDate}
                  </div>
                )}
                {t.capacity > 0 && (
                  <div>
                    <span className="font-medium">定員:</span> {t.capacity}名
                    {t.applicantCount > 0 && (
                      <span className="ml-2 text-gray-500">（申込済: {t.applicantCount}名）</span>
                    )}
                  </div>
                )}
                {t.summary && (
                  <div className="mt-2 text-gray-700">{t.summary}</div>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              {t.fileUrl && (
                <a
                  href={t.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mb-2 text-sm text-blue-600 underline text-center"
                >
                  案内状を見る
                </a>
              )}
              <button
                onClick={() => onApply(t)}
                disabled={t.capacity > 0 && t.applicantCount >= t.capacity}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {t.capacity > 0 && t.applicantCount >= t.capacity ? '満員' : '申込する'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PublicTrainingList;
