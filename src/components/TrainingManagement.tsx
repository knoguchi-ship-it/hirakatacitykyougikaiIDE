import React, { useState, useRef } from 'react';
import { Training, TrainingFee, TrainingFieldConfig, DEFAULT_FIELD_CONFIG, DEFAULT_FEES } from '../types';
import { api } from '../services/api';
import { PlusIcon, TrashIcon } from './Icons';

interface Props {
  trainings: Training[];
  onSave: (training: Training) => Promise<Training>;
}

// 常に表示する必須フィールド（トグル不可）
const ALWAYS_ON_FIELDS = ['title', 'date', 'capacity', 'status', 'isOnline'] as const;

// トグル可能なオプションフィールドの定義
const OPTIONAL_FIELD_DEFS: { key: keyof TrainingFieldConfig; label: string }[] = [
  { key: 'organizer',          label: '主催者' },
  { key: 'summary',            label: '研修概要' },
  { key: 'description',        label: '研修内容' },
  { key: 'location',           label: '開催場所' },
  { key: 'instructor',         label: '講師' },
  { key: 'applicationOpenDate', label: '参加受付開始日' },
  { key: 'applicationCloseDate', label: '参加締め切り日' },
  { key: 'fees',               label: '費用区分' },
  { key: 'isNonMandatory',     label: '法定外研修フラグ' },
  { key: 'guidePdfUrl',        label: '案内状ファイル' },
];

const EMPTY_FORM: Training = {
  id: '',
  title: '',
  date: '',
  organizer: '',
  isNonMandatory: false,
  summary: '',
  description: '',
  capacity: 0,
  applicants: 0,
  fees: DEFAULT_FEES.map(f => ({ ...f })),
  applicationOpenDate: '',
  applicationCloseDate: '',
  location: '',
  isOnline: false,
  status: 'OPEN',
  instructor: '',
  guidePdfUrl: '',
  fieldConfig: { ...DEFAULT_FIELD_CONFIG },
};

const TrainingManagement: React.FC<Props> = ({ trainings, onSave }) => {
  const [form, setForm] = useState<Training>({ ...EMPTY_FORM });
  const [isNew, setIsNew] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // フィールド設定（fieldConfig）
  const fieldConfig: TrainingFieldConfig = form.fieldConfig ?? { ...DEFAULT_FIELD_CONFIG };
  const isFieldOn = (key: keyof TrainingFieldConfig) => fieldConfig[key] !== false;

  const toggleField = (key: keyof TrainingFieldConfig) => {
    setForm(prev => ({
      ...prev,
      fieldConfig: { ...(prev.fieldConfig ?? DEFAULT_FIELD_CONFIG), [key]: !isFieldOn(key) },
    }));
  };

  const normalizeDateTime = (v: string) => {
    if (!v) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v + 'T00:00';
    // GAS formatDateForApi_ outputs "YYYY-MM-DD HH:mm" (space) — convert to datetime-local format
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(v)) return v.replace(' ', 'T').substring(0, 16);
    return v;
  };

  const startNew = () => {
    setForm({ ...EMPTY_FORM, fees: DEFAULT_FEES.map(f => ({ ...f })), fieldConfig: { ...DEFAULT_FIELD_CONFIG } });
    setIsNew(true);
    setSaveError(null);
    setSaveSuccess(false);
    setUploadedFileName('');
    setSettingsOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadTraining = (t: Training) => {
    setForm({
      ...t,
      date: normalizeDateTime(t.date),
      fees: t.fees && t.fees.length > 0 ? t.fees : DEFAULT_FEES.map(f => ({ ...f })),
      fieldConfig: t.fieldConfig ?? { ...DEFAULT_FIELD_CONFIG },
    });
    setIsNew(false);
    setSaveError(null);
    setSaveSuccess(false);
    setUploadedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (type === 'number') {
      setForm(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // 費用区分の操作
  const handleFeeChange = (idx: number, field: keyof TrainingFee, value: string) => {
    setForm(prev => {
      const fees = (prev.fees ?? []).map((f, i) =>
        i === idx ? { ...f, [field]: field === 'amount' ? Number(value) : value } : f
      );
      return { ...prev, fees };
    });
  };

  const addFee = () => {
    setForm(prev => ({ ...prev, fees: [...(prev.fees ?? []), { label: '', amount: 0 }] }));
  };

  const removeFee = (idx: number) => {
    setForm(prev => ({ ...prev, fees: (prev.fees ?? []).filter((_, i) => i !== idx) }));
  };

  // ファイルアップロード
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSaveError('ファイルサイズは5MB以下にしてください。');
      return;
    }
    setUploading(true);
    setSaveError(null);
    try {
      const base64 = await readFileAsBase64(file);
      const result = await api.uploadTrainingFile(base64, file.name, file.type);
      setForm(prev => ({ ...prev, guidePdfUrl: result.url }));
      setUploadedFileName(file.name);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'アップロードに失敗しました。');
    } finally {
      setUploading(false);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = () => reject(new Error('ファイル読み込み失敗'));
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setSaveError('研修タイトルを入力してください。'); return; }
    if (!form.date)          { setSaveError('開催日時を入力してください。'); return; }
    if (isFieldOn('fees') && (form.fees ?? []).some(f => !f.label.trim())) {
      setSaveError('費用区分のラベルを入力してください。');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const saved = await onSave(form);
      setForm({ ...saved, date: normalizeDateTime(saved.date) });
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
      {/* ヘッダー */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">研修登録・変更</h2>
          <p className="text-slate-500 text-sm mt-1">研修情報の新規登録・既存研修の変更ができます。</p>
        </div>
        <button onClick={startNew} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <PlusIcon className="w-4 h-4" />
          新規登録
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 研修一覧 */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700 text-sm">研修一覧</h3>
          </div>
          <ul className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {trainings.length === 0 && (
              <li className="p-4 text-sm text-slate-400 text-center">研修データがありません</li>
            )}
            {trainings.map(t => (
              <li key={t.id}>
                <button
                  onClick={() => loadTraining(t)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${form.id === t.id && !isNew ? 'bg-primary-50 border-l-2 border-primary-500' : ''}`}
                >
                  <p className="text-sm font-medium text-slate-800 truncate">{t.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.date} · {t.status === 'OPEN' ? '受付中' : '締切'}
                    {t.fees && t.fees.length > 0 && (
                      <span className="ml-1 text-slate-400">
                        · {t.fees.map(f => `${f.label}¥${f.amount.toLocaleString()}`).join(' / ')}
                      </span>
                    )}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* 登録・変更フォーム */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 text-sm">
              {isNew ? '新規研修登録' : `編集: ${form.title || '(無題)'}`}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* ⚙ 項目設定パネル */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setSettingsOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-medium text-slate-600"
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">⚙</span>
                  表示する項目を設定
                  <span className="text-xs text-slate-400 font-normal">
                    （{OPTIONAL_FIELD_DEFS.filter(f => isFieldOn(f.key)).length}/{OPTIONAL_FIELD_DEFS.length} 項目 ON）
                  </span>
                </span>
                <span className="text-slate-400">{settingsOpen ? '▲' : '▼'}</span>
              </button>

              {settingsOpen && (
                <div className="px-4 py-4 border-t border-slate-200 bg-white">
                  <p className="text-xs text-slate-500 mb-3">ON にした項目のみフォームに表示されます。研修タイトル・開催日時・定員・受付状態・開催形式は常に表示されます。</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {OPTIONAL_FIELD_DEFS.map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer select-none group" onClick={() => toggleField(key)}>
                        {/* トグルスイッチ */}
                        <span
                          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer ${isFieldOn(key) ? 'bg-primary-600' : 'bg-slate-300'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${isFieldOn(key) ? 'translate-x-4' : 'translate-x-0'}`} />
                        </span>
                        <span className={`text-xs ${isFieldOn(key) ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 研修タイトル（常時） */}
            <div>
              <label className={labelCls}>研修タイトル <span className="text-red-500">*</span></label>
              <input className={inputCls} name="title" value={form.title} onChange={handleChange} placeholder="例: 令和8年度 介護報酬改定研修" />
            </div>

            {/* 開催日時 + 主催者 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>開催日時 <span className="text-red-500">*</span></label>
                <input className={inputCls} type="datetime-local" name="date" value={form.date} onChange={handleChange} />
              </div>
              {isFieldOn('organizer') && (
                <div>
                  <label className={labelCls}>主催者</label>
                  <input className={inputCls} name="organizer" value={form.organizer || ''} onChange={handleChange} placeholder="例: 枚方市介護支援専門員連絡協議会" />
                </div>
              )}
            </div>

            {/* 研修概要 */}
            {isFieldOn('summary') && (
              <div>
                <label className={labelCls}>研修概要</label>
                <textarea className={inputCls} name="summary" value={form.summary || ''} onChange={handleChange} rows={2} placeholder="研修の概要を入力してください" />
              </div>
            )}

            {/* 研修内容 */}
            {isFieldOn('description') && (
              <div>
                <label className={labelCls}>研修内容</label>
                <textarea className={inputCls} name="description" value={form.description || ''} onChange={handleChange} rows={4} placeholder="研修の詳細内容を入力してください" />
              </div>
            )}

            {/* 開催場所 + 開催形式（常時） */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isFieldOn('location') && (
                <div>
                  <label className={labelCls}>開催場所</label>
                  <input className={inputCls} name="location" value={form.location} onChange={handleChange} placeholder="例: 枚方市市民会館 会議室A" />
                </div>
              )}
              <div>
                <label className={labelCls}>開催形式 <span className="text-red-500">*</span></label>
                <select className={inputCls} value={form.isOnline ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, isOnline: e.target.value === 'true' }))}>
                  <option value="false">対面（会場）</option>
                  <option value="true">オンライン</option>
                </select>
              </div>
            </div>

            {/* 定員 + 受付状態（常時） */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>定員（名） <span className="text-red-500">*</span></label>
                <input className={inputCls} type="number" name="capacity" value={form.capacity} onChange={handleChange} min={0} />
              </div>
              <div>
                <label className={labelCls}>受付状態 <span className="text-red-500">*</span></label>
                <select className={inputCls} name="status" value={form.status} onChange={handleChange}>
                  <option value="OPEN">受付中</option>
                  <option value="CLOSED">締切</option>
                </select>
              </div>
            </div>

            {/* ── 費用区分（動的） ── */}
            {isFieldOn('fees') && (
              <div>
                <label className={labelCls}>費用区分</label>
                <div className="space-y-2">
                  {(form.fees ?? []).map((fee, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-28"
                        placeholder="例: 会員"
                        value={fee.label}
                        onChange={e => handleFeeChange(idx, 'label', e.target.value)}
                      />
                      <span className="text-slate-400 text-sm shrink-0">¥</span>
                      <input
                        type="number"
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-32"
                        placeholder="0"
                        value={fee.amount}
                        min={0}
                        onChange={e => handleFeeChange(idx, 'amount', e.target.value)}
                      />
                      <span className="text-slate-400 text-sm shrink-0">円</span>
                      {(form.fees ?? []).length > 1 && (
                        <button type="button" onClick={() => removeFee(idx)} className="text-slate-300 hover:text-red-500 transition-colors" title="削除">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFee}
                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <PlusIcon className="w-4 h-4" />
                    区分を追加
                  </button>
                </div>
              </div>
            )}

            {/* 申込日程 */}
            {(isFieldOn('applicationOpenDate') || isFieldOn('applicationCloseDate')) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isFieldOn('applicationOpenDate') && (
                  <div>
                    <label className={labelCls}>参加受付開始日</label>
                    <input className={inputCls} type="date" name="applicationOpenDate" value={form.applicationOpenDate || ''} onChange={handleChange} />
                  </div>
                )}
                {isFieldOn('applicationCloseDate') && (
                  <div>
                    <label className={labelCls}>参加締め切り日</label>
                    <input className={inputCls} type="date" name="applicationCloseDate" value={form.applicationCloseDate || ''} onChange={handleChange} />
                  </div>
                )}
              </div>
            )}

            {/* 講師 */}
            {isFieldOn('instructor') && (
              <div>
                <label className={labelCls}>講師</label>
                <input className={inputCls} name="instructor" value={form.instructor || ''} onChange={handleChange} placeholder="例: 田中 一郎 先生" />
              </div>
            )}

            {/* 法定外研修フラグ */}
            {isFieldOn('isNonMandatory') && (
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
            )}

            {/* 案内状ファイル */}
            {isFieldOn('guidePdfUrl') && (
              <div>
                <label className={labelCls}>案内状（PDF・画像、最大5MB）</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                    {uploading ? <span className="animate-pulse">アップロード中...</span> : <>ファイルを選択</>}
                    <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
                  </label>
                  {(uploadedFileName || form.guidePdfUrl) && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      {uploadedFileName && <span className="truncate max-w-40">{uploadedFileName}</span>}
                      {form.guidePdfUrl && (
                        <a href={form.guidePdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-xs">現在のファイルを開く</a>
                      )}
                      <button
                        type="button"
                        onClick={() => { setForm(p => ({ ...p, guidePdfUrl: '' })); setUploadedFileName(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="text-slate-400 hover:text-red-500"
                        title="削除"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* エラー / 成功 */}
            {saveError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{saveError}</div>}
            {saveSuccess && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">保存しました。</div>}

            {/* 送信 */}
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={saving || uploading} className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
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
