import React, { useState } from 'react';
import { ApiClient } from '../services/api';
import { MailingListFilterType, MailingListExcelResult } from '../shared/types';

interface MailingListExportProps {
  api: ApiClient;
}

const MailingListExport: React.FC<MailingListExportProps> = ({ api }) => {
  const [filterType, setFilterType] = useState<MailingListFilterType>('KOHOUSHI');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MailingListExcelResult | null>(null);

  const handleExport = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.generateMailingListExcel({ filterType });
      setResult(res);

      // base64 → Blob → ダウンロード
      const binary = atob(res.base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message || '出力中にエラーが発生しました。');
    } finally {
      setBusy(false);
    }
  };

  const filterOptions: { value: MailingListFilterType; label: string; description: string }[] = [
    {
      value: 'KOHOUSHI',
      label: '広報誌発送',
      description: '在籍中の全会員（退会予定を含む）が対象です。',
    },
    {
      value: 'OSHIRASE',
      label: 'お知らせ発送',
      description: '事業所会員の全員 + 個人・賛助会員のうち発送方法が「郵送」の方が対象です。',
    },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">宛名リスト出力コンソール</h2>
        <p className="text-sm text-slate-500 mt-1">
          会員の郵送先住所を Excel ファイル（.xlsx）で出力します。
          シート構成: 事業所会員 / 個人会員 / 賛助会員 / 住所不備
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-700">発送区分の選択</h3>
        <div className="space-y-3">
          {filterOptions.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                filterType === opt.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="filterType"
                value={opt.value}
                checked={filterType === opt.value}
                onChange={() => setFilterType(opt.value)}
                className="mt-0.5 accent-primary-600"
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
        <p className="font-semibold">出力内容について</p>
        <ul className="list-disc list-inside space-y-0.5 text-xs">
          <li>退会予定の会員は発送対象に含まれますが、ステータスは表示されません。</li>
          <li>大阪府は住所欄に表示しません（他府県は表示します）。</li>
          <li>郵便番号・市区町村・番地のいずれかが未入力の場合は「住所不備」シートに分類されます。</li>
          <li>個人・賛助会員の郵送先は「郵送先区分」設定（事業所または自宅）に従います。</li>
        </ul>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-green-800">出力完了 — {result.filename}</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <p className="text-slate-500">事業所会員</p>
              <p className="text-xl font-bold text-slate-800">{result.counts.business}<span className="text-sm font-normal ml-1">件</span></p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <p className="text-slate-500">個人会員</p>
              <p className="text-xl font-bold text-slate-800">{result.counts.individual}<span className="text-sm font-normal ml-1">件</span></p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <p className="text-slate-500">賛助会員</p>
              <p className="text-xl font-bold text-slate-800">{result.counts.support}<span className="text-sm font-normal ml-1">件</span></p>
            </div>
            <div className={`bg-white rounded-lg p-3 border ${result.counts.invalid > 0 ? 'border-amber-300' : 'border-green-200'}`}>
              <p className="text-slate-500">住所不備</p>
              <p className={`text-xl font-bold ${result.counts.invalid > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                {result.counts.invalid}<span className="text-sm font-normal ml-1">件</span>
              </p>
            </div>
          </div>
          {result.counts.invalid > 0 && (
            <p className="text-xs text-amber-700">
              住所不備の {result.counts.invalid} 件は「住所不備」シートに記録されています。会員情報を確認・更新してください。
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleExport}
        disabled={busy}
        className="w-full rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {busy ? '出力中...' : 'Excel ファイルを出力・ダウンロード'}
      </button>
    </div>
  );
};

export default MailingListExport;
