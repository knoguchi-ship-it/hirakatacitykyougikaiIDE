/**
 * PaymentHistoryConsole — 役員支払い履歴の管理コンソール（管理者用）
 *
 * 機能:
 * - 支払い履歴一覧（明細の展開表示・会員/日付フィルター）
 * - 新規支払い登録フォーム（明細行の追加/削除・合計自動計算）
 * - 支払い削除（明細と請求ステータスの巻き戻しをサーバー側で実行）
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiClient } from '../services/api';
import {
  OfficerManagementData,
  OfficerMasterData,
  PaymentLine,
  PaymentRecord,
} from '../shared/types';

interface PaymentHistoryConsoleProps {
  api: ApiClient;
}

// ── スタイル定数 ──────────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50';
const inputErrCls =
  'w-full rounded-lg border border-red-400 bg-red-50 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-400';
const fi = (e?: string) => (e ? inputErrCls : inputCls);

const btnPrimary =
  'rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50';
const btnSec =
  'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';
const btnDanger =
  'rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50';

// ── バリデーション ────────────────────────────────────────────────────────────

function isValidDate(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));
}

function formatYen(n: number): string {
  return `¥${n.toLocaleString('ja-JP')}`;
}

// ── ライン明細の型 ────────────────────────────────────────────────────────────

interface LineItemDraft {
  _key: string;        // UI 内部 key
  typeCode: string;
  roleCode: string;
  organizationCode: string;
  amount: string;      // 文字列で保持（入力中の状態を正確に反映）
  periodFrom: string;
  periodTo: string;
  note: string;
}

const newLine = (): LineItemDraft => ({
  _key: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
  typeCode: '', roleCode: '', organizationCode: '',
  amount: '', periodFrom: '', periodTo: '', note: '',
});

interface LineErrors {
  typeCode?: string;
  amount?: string;
}

interface FormErrors {
  memberId?: string;
  paymentDate?: string;
  paymentMethod?: string;
  lines?: string;          // 全体エラー
  lineErrors?: LineErrors[]; // 行ごとエラー
}

// ── メインコンポーネント ──────────────────────────────────────────────────────

const PaymentHistoryConsole: React.FC<PaymentHistoryConsoleProps> = ({ api }) => {
  const [masterData, setMasterData] = useState<OfficerMasterData | null>(null);
  const [officerData, setOfficerData] = useState<OfficerManagementData | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // フィルター
  const [filterMemberId, setFilterMemberId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // 展開表示
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // フォーム表示フラグ
  const [formVisible, setFormVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [m, o, p] = await Promise.all([
        api.getOfficerMasterData(),
        api.getOfficerManagementData(),
        api.getPaymentHistory(),
      ]);
      setMasterData(m);
      setOfficerData(o);
      setPayments(p);
    } catch (e: any) {
      setLoadError(e?.message || '読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  const activeOfficers = useMemo(
    () => (officerData?.officers ?? [])
      .filter(o => !o.退任日)
      .sort((a, b) => a.表示名.localeCompare(b.表示名, 'ja')),
    [officerData],
  );

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (filterMemberId && p.会員ID !== filterMemberId) return false;
      if (filterDateFrom && p.支払い日 < filterDateFrom) return false;
      if (filterDateTo && p.支払い日 > filterDateTo) return false;
      return true;
    }).sort((a, b) => (b.支払い日 || '').localeCompare(a.支払い日 || ''));
  }, [payments, filterMemberId, filterDateFrom, filterDateTo]);

  const totalAmount = useMemo(
    () => filteredPayments.reduce((s, p) => s + Number(p.合計金額 || 0), 0),
    [filteredPayments],
  );

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const orgMap = useMemo(
    () => Object.fromEntries((masterData?.organizations ?? []).map(o => [o.組織コード, o.組織名])),
    [masterData],
  );
  const roleMap = useMemo(
    () => Object.fromEntries((masterData?.roles ?? []).map(r => [r.役職コード, r.役職名])),
    [masterData],
  );
  const typeMap = useMemo(
    () => Object.fromEntries((masterData?.paymentTypes ?? []).map(t => [t.種別コード, t.種別名])),
    [masterData],
  );

  if (loading) {
    return <div className="mx-auto max-w-5xl p-6 text-center text-sm text-slate-500">読み込み中…</div>;
  }
  if (loadError) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
          <button onClick={() => void load()} className="ml-3 underline hover:no-underline">再読み込み</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">支払い履歴管理コンソール</h2>
        <p className="mt-1 text-sm text-slate-500">
          役員への報酬・活動費・謝礼等の支払い記録を管理します。支払い登録時に振込先口座のスナップショットが保存されます。
        </p>
      </div>

      {/* フィルターバー */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex-1 min-w-40">
          <label className="mb-1 block text-xs font-medium text-slate-600">役員で絞り込み</label>
          <select
            value={filterMemberId}
            onChange={e => setFilterMemberId(e.target.value)}
            className={inputCls}
          >
            <option value="">すべての役員</option>
            {activeOfficers.map(o => (
              <option key={o.会員ID} value={o.会員ID}>{o.表示名}（{o.会員ID}）</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">支払い日（開始）</label>
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">支払い日（終了）</label>
          <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className={inputCls} />
        </div>
        {(filterMemberId || filterDateFrom || filterDateTo) && (
          <button
            type="button"
            onClick={() => { setFilterMemberId(''); setFilterDateFrom(''); setFilterDateTo(''); }}
            className={btnSec}
          >
            クリア
          </button>
        )}
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => { setFormVisible(v => !v); }}
            className={btnPrimary}
          >
            ＋ 支払いを登録
          </button>
        </div>
      </div>

      {/* 新規支払いフォーム */}
      {formVisible && masterData && officerData && (
        <PaymentForm
          masterData={masterData}
          officerData={officerData}
          activeOfficers={activeOfficers}
          api={api}
          onSaved={async () => {
            setFormVisible(false);
            await load();
          }}
          onCancel={() => setFormVisible(false)}
        />
      )}

      {/* 集計バー */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
        <p className="text-sm text-slate-600">
          表示件数: <span className="font-semibold text-slate-800">{filteredPayments.length}</span> 件
        </p>
        <p className="text-sm text-slate-600">
          表示合計: <span className="font-bold text-slate-800 text-base">{formatYen(totalAmount)}</span>
        </p>
      </div>

      {/* 支払い履歴テーブル */}
      {filteredPayments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
          <p className="text-sm text-slate-400">支払い記録がありません。</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <tr>
                <th className="w-8 px-3 py-3" />
                <th className="px-3 py-3">受取人</th>
                <th className="px-3 py-3">支払い日</th>
                <th className="px-3 py-3">方法</th>
                <th className="px-3 py-3 text-right">合計金額</th>
                <th className="px-3 py-3">登録者</th>
                <th className="px-3 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredPayments.map(p => (
                <PaymentRow
                  key={p.支払いID}
                  payment={p}
                  expanded={expandedIds.has(p.支払いID)}
                  onToggle={() => toggleExpand(p.支払いID)}
                  typeMap={typeMap}
                  roleMap={roleMap}
                  orgMap={orgMap}
                  api={api}
                  onDeleted={() => void load()}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── 支払い行コンポーネント ────────────────────────────────────────────────────

const PaymentRow: React.FC<{
  payment: PaymentRecord;
  expanded: boolean;
  onToggle: () => void;
  typeMap: Record<string, string>;
  roleMap: Record<string, string>;
  orgMap: Record<string, string>;
  api: ApiClient;
  onDeleted: () => void;
}> = ({ payment, expanded, onToggle, typeMap, roleMap, orgMap, api, onDeleted }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(
      `この支払い記録を削除しますか？\n受取人: ${payment.表示名}\n支払い日: ${payment.支払い日}\n合計: ¥${Number(payment.合計金額 || 0).toLocaleString('ja-JP')}\n\n※削除すると紐づく請求の状態も「承認済み」に戻ります。`
    )) return;
    setDeleting(true);
    try {
      await api.deletePayment({ paymentId: payment.支払いID });
      onDeleted();
    } catch (e: any) {
      alert(e?.message || '削除に失敗しました。');
      setDeleting(false);
    }
  };

  return (
    <>
      <tr className={expanded ? 'bg-primary-50/30' : undefined}>
        <td className="px-3 py-3">
          <button
            type="button"
            onClick={onToggle}
            aria-label={expanded ? '明細を閉じる' : '明細を開く'}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-colors"
          >
            <svg viewBox="0 0 12 12" fill="currentColor" className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </td>
        <td className="px-3 py-3">
          <p className="font-semibold text-slate-800">{payment.表示名}</p>
          <p className="text-xs text-slate-400">会員番号: {payment.会員ID}</p>
        </td>
        <td className="px-3 py-3 text-slate-700">{payment.支払い日 || '—'}</td>
        <td className="px-3 py-3">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {payment.支払い方法 || '—'}
          </span>
        </td>
        <td className="px-3 py-3 text-right font-semibold text-slate-800">
          {formatYen(Number(payment.合計金額 || 0))}
        </td>
        <td className="px-3 py-3 text-xs text-slate-400">{payment.登録者メール}</td>
        <td className="px-3 py-3 text-right">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className={btnDanger}
          >
            {deleting ? '…' : '削除'}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="bg-primary-50/20 px-4 pb-4 pt-2">
            <LineItemsDetail
              lines={payment.明細}
              typeMap={typeMap}
              roleMap={roleMap}
              orgMap={orgMap}
              note={payment.備考}
              accountJson={payment.振込先口座JSON}
            />
          </td>
        </tr>
      )}
    </>
  );
};

// ── 明細表示コンポーネント ────────────────────────────────────────────────────

const LineItemsDetail: React.FC<{
  lines: PaymentLine[];
  typeMap: Record<string, string>;
  roleMap: Record<string, string>;
  orgMap: Record<string, string>;
  note?: string;
  accountJson?: string;
}> = ({ lines, typeMap, roleMap, orgMap, note, accountJson }) => {
  const account = useMemo(() => {
    if (!accountJson) return null;
    try { return JSON.parse(accountJson); } catch { return null; }
  }, [accountJson]);

  return (
    <div className="space-y-4">
      {/* 明細テーブル */}
      <div className="overflow-hidden rounded-lg border border-primary-100">
        <table className="min-w-full divide-y divide-primary-100 text-xs">
          <thead className="bg-primary-100/50 text-left font-semibold text-primary-700">
            <tr>
              <th className="px-3 py-2">種別</th>
              <th className="px-3 py-2">役職 / 組織</th>
              <th className="px-3 py-2">対象期間</th>
              <th className="px-3 py-2">摘要</th>
              <th className="px-3 py-2 text-right">金額</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary-50 bg-white">
            {lines.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-3 text-center text-slate-400">明細なし</td></tr>
            ) : (
              lines.map(l => (
                <tr key={l.明細ID}>
                  <td className="px-3 py-2 font-medium text-slate-700">{typeMap[l.種別コード] ?? l.種別コード}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {roleMap[l.役職コード] && <span>{roleMap[l.役職コード]}</span>}
                    {orgMap[l.組織コード] && <span className="ml-1 text-slate-400">/ {orgMap[l.組織コード]}</span>}
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {l.対象期間FROM && l.対象期間TO
                      ? `${l.対象期間FROM} 〜 ${l.対象期間TO}`
                      : l.対象期間FROM || l.対象期間TO || '—'}
                  </td>
                  <td className="px-3 py-2 text-slate-500">{l.摘要 || '—'}</td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-700">
                    {formatYen(Number(l.金額 || 0))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 補足情報 */}
      <div className="flex flex-wrap gap-4">
        {note && (
          <p className="text-xs text-slate-500">
            <span className="font-medium text-slate-600">備考: </span>{note}
          </p>
        )}
        {account && (
          <p className="text-xs text-slate-500">
            <span className="font-medium text-slate-600">振込先（登録時）: </span>
            {account.金融機関名}（{account.金融機関コード}）{account.支店名} {account.口座種別} {account.口座番号} {account.口座名義カナ}
          </p>
        )}
      </div>
    </div>
  );
};

// ── 新規支払いフォーム ────────────────────────────────────────────────────────

const PAYMENT_METHODS = ['振込', '現金', 'その他'];

const PaymentForm: React.FC<{
  masterData: OfficerMasterData;
  officerData: OfficerManagementData;
  activeOfficers: OfficerManagementData['officers'];
  api: ApiClient;
  onSaved: () => void;
  onCancel: () => void;
}> = ({ masterData, officerData, activeOfficers, api, onSaved, onCancel }) => {
  const [memberId, setMemberId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('振込');
  const [formNote, setFormNote] = useState('');
  const [lines, setLines] = useState<LineItemDraft[]>([newLine()]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const activeTypes = masterData.paymentTypes.filter(t => !t.削除フラグ && t.有効フラグ).sort((a, b) => (a.表示順 || 0) - (b.表示順 || 0));
  const activeRoles = masterData.roles.filter(r => !r.削除フラグ && r.有効フラグ).sort((a, b) => (a.表示順 || 0) - (b.表示順 || 0));
  const activeOrgs = masterData.organizations.filter(o => !o.削除フラグ && o.有効フラグ).sort((a, b) => (a.表示順 || 0) - (b.表示順 || 0));

  // 選択会員の役職一覧（役職・組織の既定値自動入力に使用）
  const memberRoles = useMemo(() => {
    if (!memberId) return [];
    return officerData.officers.filter(o => o.会員ID === memberId && !o.退任日);
  }, [memberId, officerData]);

  const totalAmount = useMemo(
    () => lines.reduce((s, l) => s + (Number(l.amount) || 0), 0),
    [lines],
  );

  const addLine = () => {
    const defaultRole = memberRoles[0];
    setLines(prev => [...prev, {
      ...newLine(),
      roleCode: defaultRole?.役職コード ?? '',
      organizationCode: defaultRole?.組織コード ?? '',
    }]);
  };

  const removeLine = (key: string) => {
    setLines(prev => prev.length > 1 ? prev.filter(l => l._key !== key) : prev);
  };

  const updateLine = (key: string, patch: Partial<LineItemDraft>) => {
    setLines(prev => prev.map(l => l._key === key ? { ...l, ...patch } : l));
  };

  // 会員選択時: 1行目の役職・組織を自動入力
  const handleMemberChange = (id: string) => {
    setMemberId(id);
    if (!id) return;
    const roles = officerData.officers.filter(o => o.会員ID === id && !o.退任日);
    if (roles[0]) {
      setLines(prev => prev.map((l, i) =>
        i === 0 ? { ...l, roleCode: roles[0].役職コード, organizationCode: roles[0].組織コード } : l
      ));
    }
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!memberId) errs.memberId = '役員を選択してください。';
    if (!paymentDate) errs.paymentDate = '支払い日は必須です。';
    else if (!isValidDate(paymentDate)) errs.paymentDate = '正しい日付形式（YYYY-MM-DD）で入力してください。';
    if (!paymentMethod) errs.paymentMethod = '支払い方法を選択してください。';

    const lineErrs: LineErrors[] = lines.map(l => {
      const le: LineErrors = {};
      if (!l.typeCode) le.typeCode = '種別は必須です。';
      if (!l.amount || Number(l.amount) <= 0) le.amount = '1円以上の金額を入力してください。';
      return le;
    });
    if (lineErrs.some(e => Object.keys(e).length > 0)) {
      errs.lineErrors = lineErrs;
    }
    if (totalAmount <= 0) errs.lines = '合計金額が 0 円です。金額を入力してください。';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setServerError(null);
    try {
      await api.savePayment({
        memberId,
        paymentDate,
        paymentMethod,
        totalAmount,
        note: formNote,
        lines: lines.map(l => ({
          typeCode: l.typeCode,
          roleCode: l.roleCode || undefined,
          organizationCode: l.organizationCode || undefined,
          amount: Number(l.amount),
          periodFrom: l.periodFrom || undefined,
          periodTo: l.periodTo || undefined,
          note: l.note || undefined,
        })),
      });
      onSaved();
    } catch (e: any) {
      setServerError(e?.message || '保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50/40 p-6 space-y-6">
      <h3 className="text-base font-semibold text-primary-800">新規支払い登録</h3>

      {/* 基本情報 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            受取人（役員）<span className="ml-0.5 text-red-500">*</span>
          </label>
          <select
            value={memberId}
            onChange={e => handleMemberChange(e.target.value)}
            className={fi(errors.memberId)}
          >
            <option value="">-- 選択してください --</option>
            {activeOfficers.map(o => (
              <option key={o.会員ID} value={o.会員ID}>{o.表示名}（{o.会員ID}）</option>
            ))}
          </select>
          {errors.memberId && <p className="mt-1 text-xs text-red-600" role="alert">{errors.memberId}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            支払い日<span className="ml-0.5 text-red-500">*</span>
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={e => setPaymentDate(e.target.value)}
            max={todayStr}
            className={fi(errors.paymentDate)}
          />
          {errors.paymentDate && <p className="mt-1 text-xs text-red-600" role="alert">{errors.paymentDate}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            支払い方法<span className="ml-0.5 text-red-500">*</span>
          </label>
          <select
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
            className={fi(errors.paymentMethod)}
          >
            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          {errors.paymentMethod && <p className="mt-1 text-xs text-red-600" role="alert">{errors.paymentMethod}</p>}
        </div>
      </div>

      {/* 明細行 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-700">
            支払い明細 <span className="text-red-500">*</span>
          </h4>
          <button type="button" onClick={addLine} className={btnSec}>＋ 明細を追加</button>
        </div>

        {errors.lines && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600" role="alert">
            {errors.lines}
          </p>
        )}

        <div className="space-y-3">
          {lines.map((line, idx) => {
            const le = errors.lineErrors?.[idx];
            return (
              <div key={line._key} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">明細 {idx + 1}</span>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(line._key)}
                      className="text-xs text-red-500 hover:text-red-700"
                      aria-label={`明細 ${idx + 1} を削除`}
                    >
                      ✕ 削除
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      種別<span className="ml-0.5 text-red-500">*</span>
                    </label>
                    <select
                      value={line.typeCode}
                      onChange={e => updateLine(line._key, { typeCode: e.target.value })}
                      className={fi(le?.typeCode)}
                    >
                      <option value="">-- 選択 --</option>
                      {activeTypes.map(t => <option key={t.種別コード} value={t.種別コード}>{t.種別名}</option>)}
                    </select>
                    {le?.typeCode && <p className="mt-0.5 text-[11px] text-red-600" role="alert">{le.typeCode}</p>}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      金額（円）<span className="ml-0.5 text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={line.amount}
                      onChange={e => updateLine(line._key, { amount: e.target.value.replace(/[^\d]/g, '') })}
                      placeholder="例: 10000"
                      className={fi(le?.amount)}
                    />
                    {le?.amount && <p className="mt-0.5 text-[11px] text-red-600" role="alert">{le.amount}</p>}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">役職</label>
                    <select
                      value={line.roleCode}
                      onChange={e => {
                        const role = activeRoles.find(r => r.役職コード === e.target.value);
                        updateLine(line._key, { roleCode: e.target.value, organizationCode: role?.組織コード ?? line.organizationCode });
                      }}
                      className={inputCls}
                    >
                      <option value="">（未指定）</option>
                      {activeOrgs.map(org => {
                        const orgRoles = activeRoles.filter(r => r.組織コード === org.組織コード);
                        if (!orgRoles.length) return null;
                        return (
                          <optgroup key={org.組織コード} label={org.組織名}>
                            {orgRoles.map(r => <option key={r.役職コード} value={r.役職コード}>{r.役職名}</option>)}
                          </optgroup>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">摘要</label>
                    <input
                      type="text"
                      value={line.note}
                      onChange={e => updateLine(line._key, { note: e.target.value })}
                      maxLength={100}
                      placeholder="任意"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">対象期間（開始）</label>
                    <input
                      type="date"
                      value={line.periodFrom}
                      onChange={e => updateLine(line._key, { periodFrom: e.target.value })}
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">対象期間（終了）</label>
                    <input
                      type="date"
                      value={line.periodTo}
                      onChange={e => updateLine(line._key, { periodTo: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 合計表示 */}
      <div className="flex items-center justify-end rounded-lg border border-primary-100 bg-white px-4 py-3">
        <span className="text-sm font-medium text-slate-600">合計金額:</span>
        <span className="ml-3 text-xl font-bold text-slate-800">{formatYen(totalAmount)}</span>
      </div>

      {/* 備考 */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700">備考</label>
        <input
          type="text"
          value={formNote}
          onChange={e => setFormNote(e.target.value)}
          maxLength={200}
          placeholder="任意"
          className={inputCls}
        />
      </div>

      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {serverError}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={handleSave} disabled={saving} className={btnPrimary}>
          {saving ? '登録中…' : `${formatYen(totalAmount)} を登録する`}
        </button>
        <button type="button" onClick={onCancel} className={btnSec}>キャンセル</button>
      </div>
    </div>
  );
};

export default PaymentHistoryConsole;
