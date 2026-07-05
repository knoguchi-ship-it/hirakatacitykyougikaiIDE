import React, { useMemo, useRef, useState } from 'react';
import { Training, TrainingFee, TrainingFieldConfig, DEFAULT_FIELD_CONFIG, DEFAULT_FEES } from '../types';
import { api } from '../services/api';
import { PlusIcon, TrashIcon } from './Icons';
import TrainingMailSender from './TrainingMailSender';
import TrainingRoster from './TrainingRoster';
import PdfThumbnail from './PdfThumbnail';
import PdfPreviewModal from './PdfPreviewModal';
import TrainingDetailModal from './TrainingDetailModal';
import LinePostEditorModal, { LinePostEditorForm } from './LinePostEditorModal';
import { buildPublicTrainingApplyUrl } from '../config/publicPortal';
import { buildTrainingLinePostDraft } from '../shared/lineTemplate';
import { EMAIL_PATTERN, PHONE_PATTERN } from '../shared/validators';

interface Props {
  trainings: Training[];
  onSave: (training: Training) => Promise<Training>;
  // v376.7: 削除・復元ハンドラ（admin のみ）
  onDelete?: (trainingId: string) => Promise<void>;
  onRestore?: (trainingId: string) => Promise<void>;
  defaultFieldConfig?: TrainingFieldConfig | null;
}

// v376.7: 日本の年度（4 月開始）。開催日 "2026-03-15" → 2025 年度、"2026-04-01" → 2026 年度。
const fiscalYearOf = (eventDate: string | undefined | null): number | null => {
  if (!eventDate) return null;
  const d = new Date(eventDate);
  if (isNaN(d.getTime())) return null;
  return d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
};

const currentFiscalYear = (): number => {
  const now = new Date();
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
};

// 法定外研修フラグは常時表示のため除外
export const TRAINING_OPTIONAL_FIELD_DEFS: { key: keyof TrainingFieldConfig; label: string }[] = [
  { key: 'description', label: '詳細説明' },
  { key: 'instructor', label: '講師' },
  { key: 'applicationOpenDate', label: '申込開始日' },
  { key: 'applicationCloseDate', label: '申込締切日' },
  { key: 'fees', label: '研修費用' },
  { key: 'guidePdfUrl', label: '案内PDF' },
  // v376.30: 外部申込フォーム URL（Google フォーム等）
  { key: 'applicationUrl', label: '申込URL' },
];

const toDateString = (d: Date) => d.toISOString().slice(0, 10);
const getDefaultDates = () => {
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  return { open: toDateString(today), close: toDateString(nextMonth) };
};

const buildEmptyForm = (fieldConfig: TrainingFieldConfig): Training => {
  const { open, close } = getDefaultDates();
  return {
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
    applicationOpenDate: fieldConfig.applicationOpenDate !== false ? open : '',
    applicationCloseDate: fieldConfig.applicationCloseDate !== false ? close : '',
    location: '',
    status: 'OPEN',
    instructor: '',
    guidePdfUrl: '',
    thumbnailUrl: '',
    applicationUrl: '', // v376.30: 外部申込フォーム URL
    cancelAllowed: false,
    inquiryPerson: '',
    inquiryPhone: '',
    inquiryEmail: '',
    fieldConfig: { ...fieldConfig },
  };
};


type PanelView = 'form' | 'mail' | 'roster';

const TrainingManagement: React.FC<Props> = ({ trainings, onSave, onDelete, onRestore, defaultFieldConfig }) => {
  const effectiveDefault = defaultFieldConfig ?? DEFAULT_FIELD_CONFIG;
  const [form, setForm] = useState<Training>(() => buildEmptyForm(effectiveDefault));
  const [isNew, setIsNew] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  // v350: サムネイル生成/再生成の即時状態
  const [thumbnailStatus, setThumbnailStatus] = useState<'idle' | 'pending' | 'failed' | 'regenerating'>('idle');
  const [thumbnailStatusMsg, setThumbnailStatusMsg] = useState<string>('');
  // v355: PDF プレビュー lightbox
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [panelView, setPanelView] = useState<PanelView>('form');
  // v376.11: 既存研修選択時の大画面モーダル制御
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  // v376.32: 申込ディープリンクのコピー用（クリップボード不可環境でも手動コピーできるよう URL も保持）
  const [applyLinkUrl, setApplyLinkUrl] = useState('');
  const [applyLinkMsg, setApplyLinkMsg] = useState('');
  // v376.39: 公式LINE投稿依頼を当該研修に紐づけた状態でポップアップ（null=非表示）
  const [lineEditorInitial, setLineEditorInitial] = useState<Partial<LinePostEditorForm> | null>(null);
  // v376.16: 新規登録の入力中に既存研修を選んでもデータを失わないよう、新規入力を退避する。
  // 画面を開いている間は保持し、モーダルを閉じると右ペインへ復元する。
  const [pendingNewForm, setPendingNewForm] = useState<Training | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // v376.7: 一覧フィルター（admin のみ）
  const [filterYear, setFilterYear] = useState<number | 'ALL'>(() => currentFiscalYear());
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'CLOSED' | 'DELETED'>('ALL');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [deleting, setDeleting] = useState(false);

  // 利用可能な年度（既存研修の開催日から派生 + 今年度を必ず含む）
  const availableYears = useMemo(() => {
    const set = new Set<number>([currentFiscalYear()]);
    for (const t of trainings) {
      const y = fiscalYearOf(t.date);
      if (y !== null) set.add(y);
    }
    return Array.from(set).sort((a, b) => b - a); // 新しい年度が先頭
  }, [trainings]);

  // フィルター適用後の一覧
  const filteredTrainings = useMemo(() => {
    const kw = filterKeyword.trim().toLowerCase();
    return trainings.filter((t) => {
      // 年度フィルター
      if (filterYear !== 'ALL') {
        const y = fiscalYearOf(t.date);
        if (y !== filterYear) return false;
      }
      // 状態フィルター
      if (filterStatus === 'DELETED') {
        if (!t.isDeleted) return false;
      } else {
        if (t.isDeleted) return false; // 削除済は通常表示で除外
        if (filterStatus === 'OPEN' && t.status !== 'OPEN') return false;
        if (filterStatus === 'CLOSED' && t.status !== 'CLOSED') return false;
      }
      // キーワード（研修名 + 主催者）
      if (kw) {
        const hay = (t.title + ' ' + (t.organizer || '')).toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [trainings, filterYear, filterStatus, filterKeyword]);

  const handleDelete = async () => {
    if (!form.id || !onDelete) return;
    const applicantCount = form.applicants || 0;
    const warning = applicantCount > 0
      ? `\n※既に申込が ${applicantCount} 件あります。申込履歴は保持されますが、研修自体は一覧から非表示になります。`
      : '';
    if (!window.confirm(`研修「${form.title}」を削除しますか?\n削除後も「削除済」フィルタから復元可能です。${warning}`)) return;
    setDeleting(true);
    try {
      await onDelete(form.id);
      window.alert('研修を削除しました。');
      closeDetail(); // v376.16: モーダルを閉じ、退避中の新規入力を復元
    } catch (e) {
      window.alert('削除に失敗しました: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async () => {
    if (!form.id || !onRestore) return;
    if (!window.confirm(`研修「${form.title}」を復元しますか?`)) return;
    setDeleting(true);
    try {
      await onRestore(form.id);
      window.alert('研修を復元しました。');
      closeDetail(); // v376.16: モーダルを閉じ、退避中の新規入力を復元
    } catch (e) {
      window.alert('復元に失敗しました: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setDeleting(false);
    }
  };

  const fieldConfig: TrainingFieldConfig = form.fieldConfig ?? { ...effectiveDefault };
  const isFieldOn = (key: keyof TrainingFieldConfig) => fieldConfig[key] !== false;

  const toggleField = (key: keyof TrainingFieldConfig) => {
    setForm((prev) => ({
      ...prev,
      fieldConfig: { ...(prev.fieldConfig ?? effectiveDefault), [key]: !isFieldOn(key) },
    }));
  };

  const normalizeDateTime = (v: string) => {
    if (!v) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00`;
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(v)) return v.replace(' ', 'T').substring(0, 16);
    return v;
  };

  const startNew = () => {
    setForm(buildEmptyForm(effectiveDefault));
    setPendingNewForm(null); // v376.16: 明示的な新規開始では退避中の入力も破棄
    setIsNew(true);
    setSaveError(null);
    setSaveSuccess(false);
    setUploadedFileName('');
    setSettingsOpen(false);
    setPanelView('form');
    setDetailModalOpen(false); // v376.11: 新規登録時はモーダルを閉じる
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadTraining = (training: Training) => {
    // v376.16: 新規入力中だった内容を退避（既に編集モードならそのまま既存退避を維持）
    if (isNew) setPendingNewForm(form);
    setForm({
      ...training,
      date: normalizeDateTime(training.date),
      fees: training.fees && training.fees.length > 0 ? training.fees : DEFAULT_FEES.map((f) => ({ ...f })),
      fieldConfig: training.fieldConfig ?? { ...effectiveDefault },
      // 旧データ後方互換: inquiryPhone/Email が未設定なら inquiryContactValue から復元
      inquiryPhone: training.inquiryPhone || (training.inquiryContactType === 'PHONE' ? (training.inquiryContactValue || '') : ''),
      inquiryEmail: training.inquiryEmail || (training.inquiryContactType === 'EMAIL' ? (training.inquiryContactValue || '') : ''),
    });
    setIsNew(false);
    setSaveError(null);
    setSaveSuccess(false);
    setUploadedFileName('');
    setApplyLinkUrl(''); // v376.32: 別研修の申込リンク表示を持ち越さない
    setApplyLinkMsg('');
    // v376.10: 研修選択時の既定ビューは「名簿・出欠」（業務頻度の最も高い操作）
    setPanelView('roster');
    // v376.11: 既存研修選択時は大画面モーダルで表示
    setDetailModalOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // v376.16: 既存研修モーダルを閉じる。退避していた新規入力があれば右ペインへ復元する。
  const closeDetail = () => {
    setDetailModalOpen(false);
    setForm(pendingNewForm ?? buildEmptyForm(effectiveDefault));
    setPendingNewForm(null);
    setIsNew(true);
    setSaveError(null);
    setSaveSuccess(false);
    setUploadedFileName('');
    setSettingsOpen(false);
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
      // v354: v351 で導入した client (pdfjs-dist) レンダリング経路は
      // pdfjs-dist の Node-only コードに含まれる import.meta が vite-singlefile の
      // plain script bundle で SyntaxError を起こし会員/管理者シェルを破壊した
      // ため完全撤去（src/lib/pdfThumbnail.ts と pdfjs-dist 依存ごと削除）。
      // サムネイル生成は v350 のサーバサイド polling + 10 分 trigger backfill +
      // 「サムネイル再生成」ボタンで充分に賄う。
      const result = await api.uploadTrainingFile(base64, file.name, file.type);
      setForm((prev) => ({ ...prev, guidePdfUrl: result.url, thumbnailUrl: result.thumbnailUrl || '' }));
      setUploadedFileName(file.name);
      // v350: 生成状態を即時反映。
      // 'generated' = サーバ同期生成 / 'pending' = trigger 後追い / 'failed' = 手動再生成促し
      const st = result.thumbnailGenerationStatus;
      if (st === 'generated') { setThumbnailStatus('idle'); setThumbnailStatusMsg(''); }
      else if (st === 'pending') {
        setThumbnailStatus('pending');
        setThumbnailStatusMsg('サムネイル生成に時間がかかっています。10 分以内に自動生成されます。すぐ反映したい場合は「サムネイル再生成」を押してください。');
      } else if (st === 'failed') {
        setThumbnailStatus('failed');
        setThumbnailStatusMsg('サムネイル生成に失敗しました。「サムネイル再生成」で再試行してください。');
      } else {
        setThumbnailStatus('idle');
        setThumbnailStatusMsg('');
      }
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
          {isFieldOn(key) ? '有効' : '無効'}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isFieldOn(key)}
          aria-label={`${label}の有効/無効切替`}
          onClick={() => toggleField(key)}
          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            isFieldOn(key) ? 'bg-primary-600' : 'bg-slate-300'
          }`}
          title={isFieldOn(key) ? 'この項目を無効にする（申込画面に表示しない）' : 'この項目を有効にする'}
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
    <p className="text-xs text-slate-500 mt-1">この項目は<span className="font-semibold">無効</span>です。申込画面（公開ポータル）にも表示されません。スイッチをONにすると有効化され、入力・公開表示されます。</p>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wasNew = isNew; // v376.16: 新規作成か既存更新かを送信時点で確定

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

    const inquiryPhone = String(form.inquiryPhone || '').trim();
    const inquiryEmail = String(form.inquiryEmail || '').trim();
    if (!inquiryPhone && !inquiryEmail) {
      setSaveError('問い合わせ窓口の電話番号またはメールアドレスを入力してください（どちらか必須）。');
      return;
    }
    if (inquiryPhone && !PHONE_PATTERN.test(inquiryPhone)) {
      setSaveError('電話番号の形式が正しくありません。');
      return;
    }
    if (inquiryEmail && !EMAIL_PATTERN.test(inquiryEmail)) {
      setSaveError('メールアドレスの形式が正しくありません。');
      return;
    }

    if (isFieldOn('fees') && (form.fees ?? []).some((f) => !f.label.trim())) {
      setSaveError('研修費用のラベルを入力してください。');
      return;
    }

    // 後方互換: inquiryContactValue には電話優先で1件格納
    const primaryContact = inquiryPhone || inquiryEmail;
    const primaryType = inquiryPhone ? 'PHONE' : 'EMAIL';

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const saved = await onSave({
        ...form,
        inquiryPerson,
        inquiryPhone,
        inquiryEmail,
        inquiryContactValue: primaryContact,
        inquiryContactType: primaryType,
      });
      if (wasNew) {
        // v376.16: 新規作成（inline 右ペイン）成功後は空の新規フォームへ戻し、次の登録に備える。
        // 右ペインは isNew のときのみ表示されるため、ここで isNew を維持しないと空白化する。
        setForm(buildEmptyForm(effectiveDefault));
        setUploadedFileName('');
        setSettingsOpen(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        // 既存更新（モーダル）はモーダルを開いたまま最新値を反映
        setForm({ ...saved, date: normalizeDateTime(saved.date) });
      }
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

  // v376.11: 編集 form JSX を関数抽出。inline (新規登録) とモーダル (既存編集) の双方で同一 form を再利用する。
  const renderEditForm = () => (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setSettingsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700"
        >
          <span>表示項目設定（任意項目）</span>
          <span className="text-xs text-slate-500">
            {TRAINING_OPTIONAL_FIELD_DEFS.filter((f) => isFieldOn(f.key)).length}/{TRAINING_OPTIONAL_FIELD_DEFS.length}
          </span>
        </button>
        {settingsOpen && (
          <div className="px-4 py-4 border-t border-slate-200 bg-white">
            <p className="text-xs text-slate-500 mb-3">各項目の有効/無効は「有効/無効」スイッチ、または以下一覧から切り替えできます。<span className="font-semibold">無効にした項目は申込画面（公開ポータル）に表示されません</span>。<br /><span className="font-semibold">申込URL</span> を無効にすると公開ポータルで<span className="font-semibold">申込ボタン自体を表示しません（閲覧のみ）</span>。有効＋URL空＝内部申込フォーム、有効＋URL設定＝外部フォームへのリンク。</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TRAINING_OPTIONAL_FIELD_DEFS.map(({ key, label }) => (
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
        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
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
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">研修タイトル <span className="text-red-500">*</span></label>
        <input className={inputCls} name="title" value={form.title} onChange={handleChange} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">開催日時(開始) <span className="text-red-500">*</span></label>
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
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2 mt-1">
            参加費無料として申込者に表示されます。費用を設定する場合はスイッチをONにしてください。
          </p>
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
        {renderFieldHeader('案内PDF(最大5MB)', 'guidePdfUrl')}
        {isFieldOn('guidePdfUrl') ? (
          <div className="flex items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
              {uploading ? 'アップロード中...' : 'ファイルを選択'}
              <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
            </label>
            {(uploadedFileName || form.guidePdfUrl) && (
              <div className="space-y-2">
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
                      setForm((prev) => ({ ...prev, guidePdfUrl: '', thumbnailUrl: '' }));
                      setUploadedFileName('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-slate-400 hover:text-red-500"
                    title="削除"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
                {form.guidePdfUrl && (
                  <div className="max-w-sm space-y-2">
                    {form.thumbnailUrl ? (
                      <PdfThumbnail
                        thumbnailUrl={form.thumbnailUrl}
                        fileUrl={form.guidePdfUrl}
                        fetchThumbnail={api.getFileThumbnail.bind(api)}
                        height={130}
                        onPreview={form.guidePdfUrl ? () => setPdfPreviewOpen(true) : undefined}
                      />
                    ) : (
                      <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded p-2">
                        サムネイル画像はまだ生成されていません。
                      </p>
                    )}
                    {(thumbnailStatusMsg || thumbnailStatus !== 'idle') && (
                      <p className={`text-xs ${thumbnailStatus === 'failed' ? 'text-red-600' : 'text-amber-700'}`}>
                        {thumbnailStatusMsg}
                      </p>
                    )}
                    {form.id && (
                      <button
                        type="button"
                        disabled={thumbnailStatus === 'regenerating'}
                        onClick={async () => {
                          setThumbnailStatus('regenerating');
                          setThumbnailStatusMsg('サムネイルを再生成中...');
                          try {
                            const r = await api.regenerateThumbnailForTraining(form.id!);
                            if (r.thumbnailGenerationStatus === 'generated' && r.thumbnailUrl) {
                              setForm((prev) => ({ ...prev, thumbnailUrl: r.thumbnailUrl }));
                              setThumbnailStatus('idle');
                              setThumbnailStatusMsg('サムネイルを再生成しました。');
                            } else if (r.thumbnailGenerationStatus === 'pending') {
                              setThumbnailStatus('pending');
                              setThumbnailStatusMsg('Drive 側のサムネイル生成がまだ完了していません。1〜5 分待って再試行してください。');
                            } else {
                              setThumbnailStatus('failed');
                              setThumbnailStatusMsg(`サムネイル再生成に失敗しました: ${r.reason || r.thumbnailGenerationStatus}`);
                            }
                          } catch (e) {
                            setThumbnailStatus('failed');
                            setThumbnailStatusMsg(e instanceof Error ? e.message : 'サムネイル再生成に失敗しました。');
                          }
                        }}
                        className="inline-flex min-h-[44px] items-center gap-2 px-3 py-2 text-xs rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
                      >
                        {thumbnailStatus === 'regenerating' ? '再生成中...' : 'サムネイル再生成'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          renderOffHint()
        )}
      </div>

      {/* v376.30: 外部申込フォーム URL（Google フォーム等）。設定すると公開ポータルの「申し込む」ボタンが外部リンクに置換される */}
      <div>
        {renderFieldHeader('申込URL', 'applicationUrl')}
        {isFieldOn('applicationUrl') ? (
          <>
            <input
              type="url"
              className={inputCls}
              name="applicationUrl"
              value={form.applicationUrl || ''}
              onChange={handleChange}
              placeholder="https://forms.gle/... または https://docs.google.com/forms/..."
            />
            <p className="text-xs text-slate-500 mt-1">
              入力すると公開ポータルの「申し込む」ボタンが外部申込フォームへのリンクに置換されます。空欄にすると内部申込フローを使用します。
            </p>
          </>
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

      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">問い合わせ窓口</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">担当者 <span className="text-red-500">*</span></label>
            <input className={inputCls} name="inquiryPerson" value={form.inquiryPerson || ''} onChange={handleChange} placeholder="例: 事務局 田中" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              電話番号 <span className="text-slate-400 text-xs">(どちらか必須)</span>
            </label>
            <input className={inputCls} type="tel" name="inquiryPhone" value={form.inquiryPhone || ''} onChange={handleChange} placeholder="072-000-0000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              メールアドレス <span className="text-slate-400 text-xs">(どちらか必須)</span>
            </label>
            <input className={inputCls} type="email" name="inquiryEmail" value={form.inquiryEmail || ''} onChange={handleChange} placeholder="support@example.com" />
          </div>
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
  );

  // v376.32: 申込ディープリンク（…/exec?t=<研修ID>）をコピー。
  // GAS iframe ではクリップボード API が拒否され得るため、失敗時は URL を表示して手動コピーさせる。
  const handleCopyApplyLink = async () => {
    if (!form.id) return;
    const url = buildPublicTrainingApplyUrl(form.id);
    setApplyLinkUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      setApplyLinkMsg('✓ 申込リンクをコピーしました');
    } catch {
      setApplyLinkMsg('コピーできませんでした。下のリンクを選択して手動でコピーしてください。');
    }
  };

  // v376.39: 当該研修に紐づけた公式LINE投稿依頼を事前入力で開く（文脈起点の作成）。
  // 申込リンクは trainingApplyUrl に格納（本文には重複させない）。保存後は DRAFT で投稿依頼コンソールに合流。
  const handleCreateLinePost = () => {
    if (!form.id) return;
    setLineEditorInitial({
      targetType: 'TRAINING',
      targetId: form.id,
      // v376.45: 研修の申込URL→無ければ公開申込ディープリンクを自動入力
      trainingApplyUrl: String(form.applicationUrl || '').trim() || buildPublicTrainingApplyUrl(form.id),
      text: buildTrainingLinePostDraft({ title: form.title, date: form.date, location: form.location }),
    });
  };

  // v376.11: タブ + 削除/復元 ボタン群（inline で使わず、モーダル header にのみ表示）。
  const tabsJsx = !isNew ? (
    <div className="flex flex-col gap-2">
    <div className="flex gap-1 flex-nowrap">
      <button
        type="button"
        onClick={() => setPanelView('roster')}
        className={`text-sm px-3 py-2 min-h-[44px] rounded-lg border font-medium transition-colors ${panelView === 'roster' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
      >名簿 / 出欠</button>
      <button
        type="button"
        onClick={() => setPanelView('mail')}
        className={`text-sm px-3 py-2 min-h-[44px] rounded-lg border font-medium transition-colors ${panelView === 'mail' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
      >メール送信</button>
      <button
        type="button"
        onClick={() => setPanelView('form')}
        className={`text-sm px-3 py-2 min-h-[44px] rounded-lg border font-medium transition-colors ${panelView === 'form' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
      >編集</button>
      {!form.isDeleted && onDelete && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm px-3 py-2 min-h-[44px] rounded-lg border border-red-300 text-red-600 hover:bg-red-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="この研修を削除"
        >{deleting ? '処理中...' : '🗑 削除'}</button>
      )}
      {form.isDeleted && onRestore && (
        <button
          type="button"
          onClick={handleRestore}
          disabled={deleting}
          className="text-sm px-3 py-2 min-h-[44px] rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="この研修を復元"
        >{deleting ? '処理中...' : '↺ 復元'}</button>
      )}
      {!form.isDeleted && form.id && (
        <button
          type="button"
          onClick={handleCopyApplyLink}
          className="text-sm px-3 py-2 min-h-[44px] rounded-lg border border-sky-300 text-sky-700 hover:bg-sky-50 font-medium transition-colors"
          aria-label="申込ページの共有リンク（ディープリンク）をコピー"
        >🔗 申込リンク</button>
      )}
      {!form.isDeleted && form.id && (
        <button
          type="button"
          onClick={handleCreateLinePost}
          className="text-sm px-3 py-2 min-h-[44px] rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-medium transition-colors"
          aria-label="この研修に紐づけて公式LINE投稿依頼を作成"
        >📱 LINE投稿依頼</button>
      )}
    </div>
    {applyLinkUrl && (
      <div className="text-xs text-slate-600">
        <div className="mb-1">{applyLinkMsg}</div>
        <input
          readOnly
          value={applyLinkUrl}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded border border-slate-300 px-2 py-1 font-mono text-[11px]"
          aria-label="申込共有リンク"
        />
      </div>
    )}
    </div>
  ) : null;

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
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-lg font-bold text-slate-800">研修一覧</h3>
              <span className="text-xs text-slate-500">
                {filteredTrainings.length} / {trainings.length} 件
              </span>
            </div>
            {/* v376.7: フィルター UI */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={String(filterYear)}
                  onChange={(e) => setFilterYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="flex-1 text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  aria-label="年度フィルター"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y} 年度{y === currentFiscalYear() ? '（今年度）' : ''}</option>
                  ))}
                  <option value="ALL">すべての年度</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                  className="flex-1 text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  aria-label="状態フィルター"
                >
                  <option value="ALL">すべて</option>
                  <option value="OPEN">申込受付中</option>
                  <option value="CLOSED">締切済</option>
                  <option value="DELETED">削除済</option>
                </select>
              </div>
              <input
                type="text"
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                placeholder="🔍 研修名・主催者で検索"
                className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                aria-label="キーワード検索"
              />
            </div>
          </div>
          <ul className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
            {filteredTrainings.length === 0 && (
              <li className="p-4 text-sm text-slate-400 text-center">
                {trainings.length === 0 ? '研修データがありません。' : '該当する研修がありません。'}
              </li>
            )}
            {filteredTrainings.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => loadTraining(t)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 ${
                    form.id === t.id && !isNew ? 'bg-primary-50 border-l-2 border-primary-500' : ''
                  } ${t.isDeleted ? 'opacity-60' : ''}`}
                >
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {t.isDeleted && <span className="inline-block mr-1 px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] align-middle">削除済</span>}
                    {t.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{normalizeDateTime(t.date)} / {t.status}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* v376.15: 右ペインは「新規登録専用エリア」として固定。既存研修の編集・名簿・メールは
            すべてモーダルで扱うため、右ペインはモーダル非表示時（=isNew）に新規登録フォームのみ表示する。 */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          {isNew && (
            <>
              <div className="p-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">新規研修登録</h3>
              </div>
              {renderEditForm()}
            </>
          )}
        </div>
      </div>

      {/* v376.11: 既存研修詳細を大画面モーダルで表示。新規登録は inline で従来通り */}
      <TrainingDetailModal
        open={detailModalOpen && !isNew}
        title={form.title || '(未入力)'}
        onClose={closeDetail}
        headerActions={tabsJsx}
      >
        {detailModalOpen && !isNew && (
          panelView === 'roster' ? (
            <TrainingRoster
              trainingId={form.id}
              trainingTitle={form.title}
              trainingDate={form.date}
              onBack={() => setPanelView('form')}
            />
          ) : panelView === 'mail' ? (
            <TrainingMailSender
              trainingId={form.id}
              trainingTitle={form.title}
              onBack={() => setPanelView('form')}
            />
          ) : (
            renderEditForm()
          )
        )}
      </TrainingDetailModal>

      {/* v358: PDF プレビュー lightbox (高解像度 PNG モーダル) */}
      <PdfPreviewModal
        open={pdfPreviewOpen}
        onClose={() => setPdfPreviewOpen(false)}
        fileUrl={form.guidePdfUrl || ''}
        title={form.title || '案内PDFプレビュー'}
        fetchHighResImage={(url) => api.getFileThumbnail(url, 2000)}
      />

      {/* v376.39: 当該研修に紐づけた公式LINE投稿依頼ポップアップ（z-[60] で研修モーダルの上に重畳） */}
      {lineEditorInitial !== null && (
        <LinePostEditorModal
          key={lineEditorInitial.targetId || 'line-new'}
          api={api}
          trainings={trainings}
          initial={lineEditorInitial}
          onClose={() => setLineEditorInitial(null)}
          onSaved={() => setLineEditorInitial(null)}
        />
      )}
    </div>
  );
};

export default TrainingManagement;
