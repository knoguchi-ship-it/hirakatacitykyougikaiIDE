import React, { useRef, useState } from 'react';
import { Training, TrainingFee, TrainingFieldConfig, DEFAULT_FIELD_CONFIG, DEFAULT_FEES } from '../types';
import { api } from '../services/api';
import { PlusIcon, TrashIcon } from './Icons';
import TrainingMailSender from './TrainingMailSender';

interface Props {
  trainings: Training[];
  onSave: (training: Training) => Promise<Training>;
}

const OPTIONAL_FIELD_DEFS: { key: keyof TrainingFieldConfig; label: string }[] = [
  { key: 'description', label: '詳細説明' },
  { key: 'instructor', label: '講師' },
  { key: 'applicationOpenDate', label: '申込開始日' },
  { key: 'applicationCloseDate', label: '申込締切日' },
  { key: 'fees', label: '研修費用' },
  { key: 'isNonMandatory', label: '法定外研修フラグ' },
  { key: 'guidePdfUrl', label: '案内PDF' },
];

const EMPTY_FORM: Training = {
  id: '',
  title: '',
  date: '',
  endTime: '',
  organizer: '',
  isNonMandatory: false,
  summary: '',
  description: '',
  capacity: 0,
  applicants: 0,
  fees: DEFAULT_FEES.map((f) => ({ ...f })),
  applicationOpenDate: '',
  applicationCloseDate: '',
  location: '',
  status: 'OPEN',
  instructor: '',
  guidePdfUrl: '',
  cancelAllowed: false,
  inquiryPerson: '',
  inquiryContactValue: '',
  fieldConfig: { ...DEFAULT_FIELD_CONFIG },
};

const PHONE_PATTERN = /^[0-9+\-() ]{6,}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PanelView = 'form' | 'mail';

const TrainingManagement: React.FC<Props> = ({ trainings, onSave }) => {
  const [form, setForm] = useState<Training>({ ...EMPTY_FORM });
  const [isNew, setIsNew] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [panelView, setPanelView] = useState<PanelView>('form');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fieldConfig: TrainingFieldConfig = form.fieldConfig ?? { ...DEFAULT_FIELD_CONFIG };
  const isFieldOn = (key: keyof TrainingFieldConfig) => fieldConfig[key] !== false;

  const toggleField = (key: keyof TrainingFieldConfig) => {
    setForm((prev) => ({
      ...prev,
      fieldConfig: { ...(prev.fieldConfig ?? DEFAULT_FIELD_CONFIG), [key]: !isFieldOn(key) },
    }));
  };

  const normalizeDateTime = (v: string) => {
    if (!v) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00`;
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(v)) return v.replace(' ', 'T').substring(0, 16);
    return v;
  };

  const startNew = () => {
    setForm({ ...EMPTY_FORM, fees: DEFAULT_FEES.map((f) => ({ ...f })), fieldConfig: { ...DEFAULT_FIELD_CONFIG } });
    setIsNew(true);
    setSaveError(null);
    setSaveSuccess(false);
    setUploadedFileName('');
    setSettingsOpen(false);
    setPanelView('form');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadTraining = (training: Training) => {
    setForm({
      ...training,
      date: normalizeDateTime(training.date),
      fees: training.fees && training.fees.length > 0 ? training.fees : DEFAULT_FEES.map((f) => ({ ...f })),
      fieldConfig: training.fieldConfig ?? { ...DEFAULT_FIELD_CONFIG },
    });
    setIsNew(false);
    setSaveError(null);
    setSaveSuccess(false);
    setUploadedFileName('');
    setPanelView('form');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
      return;
    }
    if (type === 'number') {
      setForm((prev) => ({ ...prev, [name]: Number(value) }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFeeChange = (idx: number, field: keyof TrainingFee, value: string) => {
    setForm((prev) => {
      const fees = (prev.fees ?? []).map((f, i) =>
        i === idx ? { ...f, [field]: field === 'amount' ? Number(value) : value } : f,
      );
      return { ...prev, fees };
    });
  };

  const addFee = () => {
    setForm((prev) => ({ ...prev, fees: [...(prev.fees ?? []), { label: '', amount: 0 }] }));
  };

  const removeFee = (idx: number) => {
    setForm((prev) => ({ ...prev, fees: (prev.fees ?? []).filter((_, i) => i !== idx) }));
  };

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = () => reject(new Error('ファイル読み込みに失敗しました。'));
      reader.readAsDataURL(file);
    });

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
      setForm((prev) => ({ ...prev, guidePdfUrl: result.url }));
      setUploadedFileName(file.name);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'ファイルアップロードに失敗しました。');
    } finally {
      setUploading(false);
    }
  };

  const renderFieldHeader = (label: string, key: keyof TrainingFieldConfig) => (
    <div className="mb-1 flex items-center justify-between gap-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
        <span className={`text-[11px] font-semibold ${isFieldOn(key) ? 'text-emerald-700' : 'text-slate-500'}`}>
          {isFieldOn(key) ? '表示中' : '非表示中'}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isFieldOn(key)}
          aria-label={`${label}の表示切替`}
          onClick={() => toggleField(key)}
          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            isFieldOn(key) ? 'bg-primary-600' : 'bg-slate-300'
          }`}
          title={isFieldOn(key) ? 'この項目を非表示にする' : 'この項目を表示する'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isFieldOn(key) ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );

  const renderOffHint = () => (
    <p className="text-xs text-slate-500 mt-1">この項目は現在非表示です。スイッチをONにすると入力欄が表示されます。</p>
  );

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
    if (!String(form.organizer || '').trim()) {
      setSaveError('主催者を入力してください。');
      return;
    }
    if (!String(form.location || '').trim()) {
      setSaveError('開催場所を入力してください。');
      return;
    }
    if (!String(form.summary || '').trim()) {
      setSaveError('研修概要を入力してください。');
      return;
    }

    const inquiryPerson = String(form.inquiryPerson || '').trim();
    if (!inquiryPerson) {
      setSaveError('問い合わせ窓口の担当者を入力してください。');
      return;
    }

    const inquiryContactValue = String(form.inquiryContactValue || '').trim();
    if (!inquiryContactValue) {
      setSaveError('問い合わせ窓口の連絡先を入力してください。');
      return;
    }

    if (!EMAIL_PATTERN.test(inquiryContactValue) && !PHONE_PATTERN.test(inquiryContactValue)) {
      setSaveError('連絡先は電話番号またはメールアドレス形式で入力してください。');
      return;
    }

    if (isFieldOn('fees') && (form.fees ?? []).some((f) => !f.label.trim())) {
      setSaveError('研修費用のラベルを入力してください。');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const saved = await onSave({
        ...form,
        inquiryPerson,
        inquiryContactValue,
        inquiryContactType: EMAIL_PATTERN.test(inquiryContactValue) ? 'EMAIL' : 'PHONE',
      });
      setForm({ ...saved, date: normalizeDateTime(saved.date) });
      setIsNew(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">研修登録・変更</h2>
          <p className="text-slate-500 text-sm mt-1">研修情報の新規登録と既存研修の編集を行います。</p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <PlusIcon className="w-4 h-4" />
          新規登録
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700 text-sm">研修一覧</h3>
          </div>
          <ul className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
            {trainings.length === 0 && (
              <li className="p-4 text-sm text-slate-400 text-center">研修データがありません。</li>
            )}
            {trainings.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => loadTraining(t)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 ${
                    form.id === t.id && !isNew ? 'bg-primary-50 border-l-2 border-primary-500' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-slate-800 truncate">{t.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{normalizeDateTime(t.date)} / {t.status}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 text-sm">
              {panelView === 'mail' ? `メール送信: ${form.title || ''}` : (isNew ? '新規研修登録' : `編集: ${form.title || '(未入力)'}`)}
            </h3>
            {!isNew && (
              <button
                type="button"
                onClick={() => setPanelView(panelView === 'form' ? 'mail' : 'form')}
                className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  panelView === 'mail'
                    ? 'border-primary-500 bg-primary-50 text-primary-700 hover:bg-primary-100'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {panelView === 'mail' ? '← 研修編集に戻る' : '申込者一覧・メール送信'}
              </button>
            )}
          </div>

          {panelView === 'mail' && !isNew ? (
            <div className="p-4">
              <TrainingMailSender
                trainingId={form.id}
                trainingTitle={form.title}
                onBack={() => setPanelView('form')}
              />
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setSettingsOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700"
              >
                <span>表示項目設定（任意項目）</span>
                <span className="text-xs text-slate-500">
                  {OPTIONAL_FIELD_DEFS.filter((f) => isFieldOn(f.key)).length}/{OPTIONAL_FIELD_DEFS.length}
                </span>
              </button>
              {settingsOpen && (
                <div className="px-4 py-4 border-t border-slate-200 bg-white">
                  <p className="text-xs text-slate-500 mb-3">各項目の表示状態は「表示中/非表示中」スイッチ、または以下一覧から切り替えできます。</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {OPTIONAL_FIELD_DEFS.map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isFieldOn(key)}
                          onChange={() => toggleField(key)}
                          className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">研修タイトル <span className="text-red-500">*</span></label>
              <input className={inputCls} name="title" value={form.title} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">開催日時（開始） <span className="text-red-500">*</span></label>
                <input className={inputCls} type="datetime-local" name="date" value={form.date} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">終了時刻</label>
                <input className={inputCls} type="time" name="endTime" value={form.endTime || ''} onChange={handleChange} placeholder="例: 12:00" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">主催者 <span className="text-red-500">*</span></label>
                <input className={inputCls} name="organizer" value={form.organizer || ''} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">研修概要 <span className="text-red-500">*</span></label>
              <textarea className={inputCls} name="summary" value={form.summary || ''} onChange={handleChange} rows={2} />
            </div>

            <div>
              {renderFieldHeader('詳細説明', 'description')}
              {isFieldOn('description') ? (
                <textarea className={inputCls} name="description" value={form.description || ''} onChange={handleChange} rows={4} />
              ) : (
                renderOffHint()
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">開催場所 <span className="text-red-500">*</span></label>
                <input className={inputCls} name="location" value={form.location} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">定員 <span className="text-red-500">*</span></label>
                <input className={inputCls} type="number" min={0} name="capacity" value={form.capacity} onChange={handleChange} />
              </div>
            </div>

            <div>
              {renderFieldHeader('研修費用', 'fees')}
              {isFieldOn('fees') ? (
                <div className="space-y-2">
                  {(form.fees ?? []).map((fee, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-40"
                        placeholder="費用名"
                        value={fee.label}
                        onChange={(e) => handleFeeChange(idx, 'label', e.target.value)}
                      />
                      <input
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-32"
                        type="number"
                        min={0}
                        value={fee.amount}
                        onChange={(e) => handleFeeChange(idx, 'amount', e.target.value)}
                      />
                      <span className="text-sm text-slate-500">円</span>
                      {(form.fees ?? []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFee(idx)}
                          className="text-slate-400 hover:text-red-500"
                          title="削除"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addFee} className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
                    <PlusIcon className="w-4 h-4" />費用行を追加
                  </button>
                </div>
              ) : (
                renderOffHint()
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                {renderFieldHeader('申込開始日', 'applicationOpenDate')}
                {isFieldOn('applicationOpenDate') ? (
                  <input className={inputCls} type="date" name="applicationOpenDate" value={form.applicationOpenDate || ''} onChange={handleChange} />
                ) : (
                  renderOffHint()
                )}
              </div>
              <div>
                {renderFieldHeader('申込締切日', 'applicationCloseDate')}
                {isFieldOn('applicationCloseDate') ? (
                  <input className={inputCls} type="date" name="applicationCloseDate" value={form.applicationCloseDate || ''} onChange={handleChange} />
                ) : (
                  renderOffHint()
                )}
              </div>
            </div>

            <div>
              {renderFieldHeader('講師', 'instructor')}
              {isFieldOn('instructor') ? (
                <input className={inputCls} name="instructor" value={form.instructor || ''} onChange={handleChange} />
              ) : (
                renderOffHint()
              )}
            </div>

            <div>
              {renderFieldHeader('法定外研修フラグ', 'isNonMandatory')}
              {isFieldOn('isNonMandatory') ? (
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    id="isNonMandatory"
                    name="isNonMandatory"
                    checked={form.isNonMandatory || false}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  法定外研修として登録する
                </label>
              ) : (
                renderOffHint()
              )}
            </div>

            <div>
              {renderFieldHeader('案内PDF（最大5MB）', 'guidePdfUrl')}
              {isFieldOn('guidePdfUrl') ? (
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
                    {uploading ? 'アップロード中...' : 'ファイルを選択'}
                    <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
                  </label>
                  {(uploadedFileName || form.guidePdfUrl) && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      {uploadedFileName && <span className="truncate max-w-40">{uploadedFileName}</span>}
                      {form.guidePdfUrl && (
                        <a href={form.guidePdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-xs">
                          ファイルを開く
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, guidePdfUrl: '' }));
                          setUploadedFileName('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-slate-400 hover:text-red-500"
                        title="削除"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                renderOffHint()
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="cancelAllowed"
                name="cancelAllowed"
                checked={form.cancelAllowed === true}
                onChange={handleChange}
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="cancelAllowed" className="text-sm text-slate-700">この研修は申込キャンセルを許可する</label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">問い合わせ窓口 担当者 <span className="text-red-500">*</span></label>
                <input className={inputCls} name="inquiryPerson" value={form.inquiryPerson || ''} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">問い合わせ窓口 連絡先 <span className="text-red-500">*</span></label>
                <input className={inputCls} name="inquiryContactValue" value={form.inquiryContactValue || ''} onChange={handleChange} placeholder="072-000-0000 / support@example.com" />
              </div>
            </div>

            {saveError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{saveError}</div>}
            {saveSuccess && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">保存しました。</div>}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving || uploading}
                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium"
              >
                {saving ? '保存中...' : isNew ? '登録する' : '変更を保存'}
              </button>
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingManagement;
