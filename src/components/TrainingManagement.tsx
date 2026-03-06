import React, { useState, useRef } from 'react';
import { Training } from '../types';
import { api } from '../services/api';
import { PlusIcon, TrashIcon } from './Icons';

interface Props {
  trainings: Training[];
  onSave: (training: Training) => Promise<Training>;
}

const EMPTY_FORM: Omit<Training, 'id' | 'applicants'> = {
  title: '',
  date: '',
  organizer: '',
  isNonMandatory: false,
  summary: '',
  description: '',
  capacity: 0,
  fee: 0,
  applicationOpenDate: '',
  applicationCloseDate: '',
  location: '',
  isOnline: false,
  status: 'OPEN',
  instructor: '',
  guidePdfUrl: '',
};

const TrainingManagement: React.FC<Props> = ({ trainings, onSave }) => {
  const [form, setForm] = useState<Training>({ ...EMPTY_FORM, id: '', applicants: 0 });
  const [isNew, setIsNew] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startNew = () => {
    setForm({ ...EMPTY_FORM, id: '', applicants: 0 });
    setIsNew(true);
    setSaveError(null);
    setSaveSuccess(false);
    setUploadedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const normalizeDateTime = (v: string) => {
    if (!v) return '';
    // "YYYY-MM-DD" → "YYYY-MM-DDT00:00" for datetime-local input
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v + 'T00:00';
    return v;
  };

  const loadTraining = (t: Training) => {
    setForm({ ...t, date: normalizeDateTime(t.date) });
    setIsNew(false);
    setSaveError(null);
    setSaveSuccess(false);
    setUploadedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (type === 'number') {
      setForm((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      setSaveError('ファイルサイズは5MB以下にしてください。');
      return;
    }

    setUploading(true);
    setSaveError(null);
    try {
      const base64 = await readFileAsBase64(file);
      const result = await api.uploadTrainingFile(base64, file.name, file.type);
      setForm((prev) => ({ ...prev, guidePdfUrl: result.url }));
      setUploadedFileName(file.name);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'ファイルアップロードに失敗しました。');
    } finally {
      setUploading(false);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // strip "data:...;base64," prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました。'));
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setSaveError('研修タイトルを入力してください。');
      return;
    }
    if (!form.date) {
      setSaveError('開催日時を入力してください。');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const saved = await onSave(form);
      setForm(saved);
      setIsNew(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">研修登録・変更</h2>
          <p className="text-slate-500 text-sm mt-1">研修情報の新規登録・既存研修の変更ができます。</p>
        </div>
        <button
          onClick={startNew}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          新規登録
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Training list */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700 text-sm">研修一覧</h3>
          </div>
          <ul className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {trainings.length === 0 && (
              <li className="p-4 text-sm text-slate-400 text-center">研修データがありません</li>
            )}
            {trainings.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => loadTraining(t)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                    form.id === t.id && !isNew ? 'bg-primary-50 border-l-2 border-primary-500' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-slate-800 truncate">{t.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.date} · {t.status === 'OPEN' ? '受付中' : '締切'}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Form */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700 text-sm">
              {isNew ? '新規研修登録' : `編集: ${form.title || '(無題)'}`}
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label className={labelCls}>研修タイトル <span className="text-red-500">*</span></label>
              <input className={inputCls} name="title" value={form.title} onChange={handleChange} placeholder="例: 令和8年度 介護報酬改定研修" />
            </div>

            {/* Date + Organizer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>開催日時 <span className="text-red-500">*</span></label>
                <input className={inputCls} type="datetime-local" name="date" value={form.date} onChange={handleChange} />
              </div>
              <div>
                <label className={labelCls}>主催者</label>
                <input className={inputCls} name="organizer" value={form.organizer || ''} onChange={handleChange} placeholder="例: 枚方市介護支援専門員連絡協議会" />
              </div>
            </div>

            {/* Summary */}
            <div>
              <label className={labelCls}>研修概要</label>
              <textarea className={inputCls} name="summary" value={form.summary || ''} onChange={handleChange} rows={2} placeholder="研修の概要を入力してください" />
            </div>

            {/* Description */}
            <div>
              <label className={labelCls}>研修内容</label>
              <textarea className={inputCls} name="description" value={form.description || ''} onChange={handleChange} rows={4} placeholder="研修の詳細内容を入力してください" />
            </div>

            {/* Location + Format */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>開催場所</label>
                <input className={inputCls} name="location" value={form.location} onChange={handleChange} placeholder="例: 枚方市市民会館 会議室A" />
              </div>
              <div>
                <label className={labelCls}>開催形式</label>
                <select className={inputCls} name="isOnline" value={form.isOnline ? 'true' : 'false'} onChange={(e) => setForm((p) => ({ ...p, isOnline: e.target.value === 'true' }))}>
                  <option value="false">対面（会場）</option>
                  <option value="true">オンライン</option>
                </select>
              </div>
            </div>

            {/* Capacity + Fee */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>定員（名）</label>
                <input className={inputCls} type="number" name="capacity" value={form.capacity} onChange={handleChange} min={0} />
              </div>
              <div>
                <label className={labelCls}>費用（円）</label>
                <input className={inputCls} type="number" name="fee" value={form.fee ?? 0} onChange={handleChange} min={0} />
              </div>
            </div>

            {/* Application dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>参加受付開始日</label>
                <input className={inputCls} type="date" name="applicationOpenDate" value={form.applicationOpenDate || ''} onChange={handleChange} />
              </div>
              <div>
                <label className={labelCls}>参加締め切り日</label>
                <input className={inputCls} type="date" name="applicationCloseDate" value={form.applicationCloseDate || ''} onChange={handleChange} />
              </div>
            </div>

            {/* Instructor + Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>講師</label>
                <input className={inputCls} name="instructor" value={form.instructor || ''} onChange={handleChange} placeholder="例: 田中 一郎 先生" />
              </div>
              <div>
                <label className={labelCls}>受付状態</label>
                <select className={inputCls} name="status" value={form.status} onChange={handleChange}>
                  <option value="OPEN">受付中</option>
                  <option value="CLOSED">締切</option>
                </select>
              </div>
            </div>

            {/* Non-mandatory flag */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isNonMandatory"
                name="isNonMandatory"
                checked={form.isNonMandatory || false}
                onChange={handleChange}
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="isNonMandatory" className="text-sm text-slate-700">法定外研修（任意参加）</label>
            </div>

            {/* File upload */}
            <div>
              <label className={labelCls}>案内状（PDF・画像、最大5MB）</label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  {uploading ? (
                    <span className="animate-pulse">アップロード中...</span>
                  ) : (
                    <>ファイルを選択</>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
                {(uploadedFileName || form.guidePdfUrl) && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    {uploadedFileName && <span className="truncate max-w-48">{uploadedFileName}</span>}
                    {form.guidePdfUrl && (
                      <a href={form.guidePdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-xs">
                        現在のファイルを開く
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => { setForm((p) => ({ ...p, guidePdfUrl: '' })); setUploadedFileName(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="text-slate-400 hover:text-red-500"
                      title="削除"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Error / Success */}
            {saveError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{saveError}</div>
            )}
            {saveSuccess && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">保存しました。</div>
            )}

            {/* Submit */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving || uploading}
                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? '保存中...' : isNew ? '登録する' : '変更を保存'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TrainingManagement;
