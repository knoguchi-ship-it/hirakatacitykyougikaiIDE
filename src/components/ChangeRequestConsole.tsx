import React, { useState, useEffect, useCallback } from 'react';
import { callApi } from '../shared/api-base';

// ── 型定義 ────────────────────────────────────────────────────────────────────

interface ChangeData {
  fields?: Record<string, string>;
  staffAdd?: Array<{
    lastName: string; firstName: string; lastKana: string; firstKana: string;
    careManagerNumber: string; email: string;
  }>;
  staffRemove?: Array<{ lastName: string; firstName: string; careManagerNumber: string }>;
}

interface ChangeRequest {
  requestId: string;
  memberId: string;
  memberType: string;
  requestType: string;
  status: string;
  contactEmail: string;
  applicantName: string;
  requestedAt: string;
  processedAt: string;
  processedByEmail: string;
  processNote: string;
  changeData: ChangeData;
}

// ── ラベル定義 ────────────────────────────────────────────────────────────────

const MEMBER_TYPE_LABEL: Record<string, string> = {
  INDIVIDUAL: '個人会員',
  BUSINESS: '事業所会員',
  SUPPORT: '賛助会員',
};
const REQUEST_TYPE_LABEL: Record<string, string> = {
  MEMBER_UPDATE: '登録情報変更',
  WITHDRAWAL: '退会申請',
  STAFF_ADD: '職員追加',
  STAFF_REMOVE: '職員除籍',
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: '未処理',
  APPROVED: '承認済',
  REJECTED: '却下済',
};
const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const FIELD_LABEL: Record<string, string> = {
  lastName: '氏（姓）', firstName: '名', lastKana: 'フリガナ（氏）', firstKana: 'フリガナ（名）',
  email: 'メールアドレス', mobilePhone: '携帯電話番号',
  phone: '電話番号', fax: 'FAX番号',
  officePostCode: '勤務先郵便番号', officePrefecture: '勤務先都道府県', officeCity: '勤務先市区町村',
  officeAddressLine: '勤務先番地', officeAddressLine2: '勤務先建物名',
  homePostCode: '自宅郵便番号', homePrefecture: '自宅都道府県', homeCity: '自宅市区町村',
  homeAddressLine: '自宅番地', homeAddressLine2: '自宅建物名',
  careManagerNumber: '介護支援専門員番号', officeNumber: '事業所番号', officeName: '事業所名',
  mailingPreference: '通知方法', preferredMailDestination: '郵送先区分',
};

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ── 変更内容表示コンポーネント ────────────────────────────────────────────────

const ChangeDataView: React.FC<{ data: ChangeData; requestType: string }> = ({ data, requestType }) => {
  const fields = data.fields || {};
  const staffAdd = data.staffAdd || [];
  const staffRemove = data.staffRemove || [];
  const fieldEntries = Object.entries(fields).filter(([, v]) => v !== '');

  return (
    <div className="space-y-4">
      {fieldEntries.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">変更フィールド</p>
          <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {fieldEntries.map(([k, v]) => (
              <div key={k} className="flex items-start gap-3 px-4 py-2 text-sm">
                <dt className="w-48 shrink-0 text-slate-500">{FIELD_LABEL[k] || k}</dt>
                <dd className="font-medium text-slate-800 break-all">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {requestType === 'WITHDRAWAL' && fieldEntries.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          年度末退会申請（当年度末 3月31日に適用）
        </div>
      )}

      {staffAdd.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">職員追加（{staffAdd.length}名）</p>
          <div className="space-y-2">
            {staffAdd.map((s, i) => (
              <div key={i} className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm">
                <div className="font-semibold text-slate-800">{s.lastName} {s.firstName}（{s.lastKana} {s.firstKana}）</div>
                <div className="mt-1 text-slate-600">CM番号: {s.careManagerNumber}　メール: {s.email}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {staffRemove.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">職員除籍（{staffRemove.length}名）</p>
          <div className="space-y-2">
            {staffRemove.map((s, i) => (
              <div key={i} className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm">
                <div className="font-semibold text-slate-800">{s.lastName} {s.firstName}</div>
                <div className="mt-1 text-slate-600">CM番号: {s.careManagerNumber}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── メインコンポーネント ───────────────────────────────────────────────────────

const ChangeRequestConsole: React.FC = () => {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const payload: Record<string, string> = {};
      if (statusFilter) payload.status = statusFilter;
      const data = await callApi<ChangeRequest[]>('getAdminChangeRequests', payload);
      setRequests(data ?? []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'データ取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleApprove = async (req: ChangeRequest) => {
    if (!window.confirm(`申請 ${req.requestId} を承認しますか？\n変更内容がDBに即時反映されます。`)) return;
    setBusy(req.requestId);
    setActionError(prev => ({ ...prev, [req.requestId]: '' }));
    try {
      await callApi('approveAdminChangeRequest', { requestId: req.requestId, note: note[req.requestId] || '' });
      await load();
    } catch (e) {
      setActionError(prev => ({ ...prev, [req.requestId]: e instanceof Error ? e.message : '承認に失敗しました' }));
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async (req: ChangeRequest) => {
    const reason = note[req.requestId]?.trim();
    if (!reason) { setActionError(prev => ({ ...prev, [req.requestId]: '却下理由を入力してください' })); return; }
    if (!window.confirm(`申請 ${req.requestId} を却下しますか？`)) return;
    setBusy(req.requestId);
    setActionError(prev => ({ ...prev, [req.requestId]: '' }));
    try {
      await callApi('rejectAdminChangeRequest', { requestId: req.requestId, note: reason });
      await load();
    } catch (e) {
      setActionError(prev => ({ ...prev, [req.requestId]: e instanceof Error ? e.message : '却下に失敗しました' }));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">変更申請管理</h2>
          <p className="mt-1 text-sm text-slate-600">
            公開ポータルから送信された変更・退会申請を確認・承認します。承認するとDBに反映されます。
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:opacity-50">
          {loading ? '読み込み中...' : '再読み込み'}
        </button>
      </div>

      {/* フィルター */}
      <div className="flex flex-wrap gap-2">
        {(['PENDING', 'APPROVED', 'REJECTED', ''] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              statusFilter === s ? 'bg-slate-800 text-white' : 'border border-slate-300 bg-white text-slate-600 hover:border-slate-400'
            }`}>
            {s === '' ? 'すべて' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {/* 一覧 */}
      {!loading && requests.length === 0 && !loadError && (
        <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-500">
          {statusFilter === 'PENDING' ? '未処理の申請はありません' : '申請がありません'}
        </div>
      )}

      <div className="space-y-4">
        {requests.map(req => (
          <div key={req.requestId}
            className={`rounded-2xl border bg-white shadow-sm ${req.status === 'PENDING' ? 'border-amber-200' : 'border-slate-200'}`}>
            {/* カードヘッダー */}
            <div className="flex flex-wrap items-start gap-4 p-5">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[req.status] || 'bg-slate-100 text-slate-600'}`}>
                    {STATUS_LABEL[req.status] || req.status}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {MEMBER_TYPE_LABEL[req.memberType] || req.memberType}
                  </span>
                  <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                    {REQUEST_TYPE_LABEL[req.requestType] || req.requestType}
                  </span>
                </div>
                <p className="text-base font-semibold text-slate-900">{req.applicantName || req.memberId}</p>
                <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                  <p>申請ID: <span className="font-mono">{req.requestId}</span></p>
                  <p>会員ID: <span className="font-mono">{req.memberId}</span></p>
                  <p>申請日時: {formatDate(req.requestedAt)}</p>
                  <p>返信先メール: {req.contactEmail}</p>
                  {req.processedAt && <p>処理日時: {formatDate(req.processedAt)}（{req.processedByEmail}）</p>}
                  {req.processNote && <p>処理備考: {req.processNote}</p>}
                </div>
              </div>
              <button onClick={() => toggleExpand(req.requestId)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100">
                {expanded.has(req.requestId) ? '▲ 閉じる' : '▼ 変更内容を確認'}
              </button>
            </div>

            {/* 変更内容詳細 */}
            {expanded.has(req.requestId) && (
              <div className="border-t border-slate-100 px-5 py-4">
                <ChangeDataView data={req.changeData} requestType={req.requestType} />
              </div>
            )}

            {/* 承認・却下操作（PENDING のみ） */}
            {req.status === 'PENDING' && (
              <div className="border-t border-slate-100 px-5 py-4">
                <div className="mb-3">
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    備考・却下理由（却下時は必須）
                  </label>
                  <input type="text"
                    value={note[req.requestId] || ''}
                    onChange={e => setNote(prev => ({ ...prev, [req.requestId]: e.target.value }))}
                    placeholder="例: 書類確認済・内容相違のため却下"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-200" />
                </div>
                {actionError[req.requestId] && (
                  <p className="mb-3 text-xs text-red-600">{actionError[req.requestId]}</p>
                )}
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => handleApprove(req)} disabled={busy === req.requestId}
                    className="rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                    {busy === req.requestId ? '処理中...' : '承認してDBに反映'}
                  </button>
                  <button onClick={() => handleReject(req)} disabled={busy === req.requestId}
                    className="rounded-full border border-red-300 bg-white px-5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">
                    {busy === req.requestId ? '処理中...' : '却下'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChangeRequestConsole;
