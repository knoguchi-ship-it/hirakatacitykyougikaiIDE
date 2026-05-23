// v360: 研修名簿管理コンポーネント
import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { normalizeKana } from '../utils/kanaNormalize';
import { TrainingRosterRow, TrainingStats, AttendanceStatus, ApplicantType } from '../shared/types';
import { downloadAsCsv } from '../lib/xlsx';
import { TrashIcon } from './Icons';

interface Props {
  trainingId: string;
  trainingTitle: string;
  trainingDate?: string;
  onBack: () => void;
}

const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  UNRECORDED: '未記録',
  PRESENT: '出席',
  ABSENT: '欠席',
  LATE: '遅刻',
  SAMEDAY_CANCEL: '当日キャンセル',
};
const APPLICANT_TYPE_LABEL: Record<ApplicantType, string> = {
  MEMBER: '会員',
  STAFF: '事業所職員',
  EXTERNAL: '非会員',
};

const TrainingRoster: React.FC<Props> = ({ trainingId, trainingTitle, trainingDate, onBack }) => {
  const [rows, setRows] = useState<TrainingRosterRow[]>([]);
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [filterAttendance, setFilterAttendance] = useState<AttendanceStatus | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<ApplicantType | 'ALL'>('ALL');
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rosterRes, statsRes] = await Promise.all([
        api.getTrainingRosterDetail(trainingId),
        api.getTrainingStats(trainingId),
      ]);
      setRows(rosterRes.applicants || []);
      setStats(statsRes);
    } catch (e) {
      setError(e instanceof Error ? e.message : '名簿の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainingId]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filterType !== 'ALL' && r.applicantType !== filterType) return false;
      if (filterAttendance !== 'ALL' && r.attendanceStatus !== filterAttendance) return false;
      if (filterText) {
        const q = filterText.toLowerCase();
        if (
          !r.name.toLowerCase().includes(q) &&
          !r.officeName.toLowerCase().includes(q) &&
          !r.email.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [rows, filterText, filterAttendance, filterType]);

  const applied = rows.filter((r) => r.status === 'APPLIED');

  const updateAttendance = async (applyId: string, status: AttendanceStatus) => {
    const before = rows;
    setRows((prev) => prev.map((r) => (r.applyId === applyId ? { ...r, attendanceStatus: status } : r)));
    try {
      const res = await api.saveAttendance({ applyId, status });
      if (!res.ok) {
        setRows(before);
        setError(res.error || '出欠保存に失敗しました');
      } else {
        setNotice(`${ATTENDANCE_LABEL[status]} に更新しました`);
        setTimeout(() => setNotice(null), 2000);
      }
    } catch (e) {
      setRows(before);
      setError(e instanceof Error ? e.message : '出欠保存に失敗しました');
    }
  };

  const bulkSet = async (status: AttendanceStatus) => {
    if (!confirm(`表示中の ${filtered.length} 名を「${ATTENDANCE_LABEL[status]}」に一括設定します。よろしいですか？`)) return;
    setBusy(true);
    try {
      const entries = filtered.map((r) => ({ applyId: r.applyId, status }));
      await api.saveAttendanceBatch(entries);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '一括更新に失敗しました');
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    const header = ['連番', '申込ID', '氏名', '事業所', '区分', 'メール', '電話', '申込状態', '出欠状態', '事務局メモ', '申込日'];
    const data = filtered.map((r, i) => [
      i + 1, r.applyId, r.name, r.officeName, APPLICANT_TYPE_LABEL[r.applicantType],
      r.email, r.phone, r.status === 'APPLIED' ? '申込済' : '取消',
      ATTENDANCE_LABEL[r.attendanceStatus], r.adminMemo, r.applyDate,
    ]);
    downloadAsCsv([header, ...data], `roster_${trainingId}_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const cancel = async (applyId: string, name: string) => {
    const reason = prompt(`${name} の申込をキャンセルします。理由（任意）:`);
    if (reason === null) return;
    setBusy(true);
    try {
      await api.cancelRosterEntry({ applyId, reason });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'キャンセルに失敗しました');
    } finally {
      setBusy(false);
    }
  };

  const editMemo = async (row: TrainingRosterRow) => {
    const memo = prompt(`${row.name} の事務局メモを編集（最大 1000 文字、管理者専用）:`, row.adminMemo);
    if (memo === null) return;
    setBusy(true);
    try {
      await api.updateRosterEntry({ applyId: row.applyId, adminMemo: memo });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'メモ保存に失敗しました');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <button onClick={onBack} className="text-sm text-blue-600 hover:underline min-h-[44px]">← 研修一覧へ戻る</button>
          <h2 className="text-xl font-bold mt-1">{trainingTitle} の名簿</h2>
          {trainingDate && <p className="text-sm text-gray-500">{trainingDate}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={load} disabled={loading || busy} className="px-3 py-2 min-h-[44px] bg-gray-100 hover:bg-gray-200 rounded text-sm">更新</button>
          <button onClick={() => setShowAddDialog(true)} className="px-3 py-2 min-h-[44px] bg-blue-600 text-white rounded text-sm">+ 会員を追加</button>
          <button onClick={() => setShowGuestDialog(true)} className="px-3 py-2 min-h-[44px] bg-violet-600 text-white rounded text-sm">+ ゲスト追加</button>
          <button onClick={exportCsv} className="px-3 py-2 min-h-[44px] bg-emerald-500 text-white rounded text-sm">📄 CSV 出力</button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800" role="alert">{error}</div>}
      {notice && <div className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">{notice}</div>}

      {/* 集計カード */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="申込者数" value={stats.applicantCount} sub={`定員 ${stats.capacity} / 残 ${stats.remainingSlots}`} />
          <StatCard label="出席" value={stats.attendanceBreakdown.PRESENT} sub={`出席率 ${stats.attendanceRate ?? '-'}%`} color="green" />
          <StatCard label="欠席" value={stats.attendanceBreakdown.ABSENT} sub={`未記録 ${stats.attendanceBreakdown.UNRECORDED}`} color="yellow" />
          <StatCard label="当日キャンセル" value={stats.attendanceBreakdown.SAMEDAY_CANCEL} sub={`遅刻 ${stats.attendanceBreakdown.LATE}`} color="red" />
        </div>
      )}

      {stats && stats.officeBreakdown.length > 0 && (
        <details className="bg-white border rounded p-3 text-sm">
          <summary className="cursor-pointer font-semibold">事業所別 申込数</summary>
          <ul className="mt-2 space-y-1">
            {stats.officeBreakdown.slice(0, 15).map((o) => (
              <li key={o.officeName} className="flex justify-between border-b py-1">
                <span>{o.officeName}</span><span className="font-semibold">{o.count}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* フィルタ + 一括操作 */}
      <div className="flex flex-wrap gap-2 items-center bg-gray-50 border rounded p-3">
        <input
          type="text"
          placeholder="氏名 / 事業所 / メール で検索"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="flex-1 min-w-[200px] min-h-[44px] px-3 py-2 border rounded text-sm"
        />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="min-h-[44px] px-2 border rounded text-sm">
          <option value="ALL">全区分</option>
          <option value="MEMBER">会員</option>
          <option value="STAFF">事業所職員</option>
          <option value="EXTERNAL">非会員</option>
        </select>
        <select value={filterAttendance} onChange={(e) => setFilterAttendance(e.target.value as any)} className="min-h-[44px] px-2 border rounded text-sm">
          <option value="ALL">全出欠</option>
          {(Object.keys(ATTENDANCE_LABEL) as AttendanceStatus[]).map((s) => (
            <option key={s} value={s}>{ATTENDANCE_LABEL[s]}</option>
          ))}
        </select>
        <div className="flex gap-1">
          <button onClick={() => bulkSet('PRESENT')} disabled={busy || filtered.length === 0} className="px-2 py-2 min-h-[44px] bg-green-600 text-white rounded text-xs">表示全員 出席</button>
          <button onClick={() => bulkSet('ABSENT')} disabled={busy || filtered.length === 0} className="px-2 py-2 min-h-[44px] bg-yellow-600 text-white rounded text-xs">表示全員 欠席</button>
        </div>
        <span className="text-xs text-gray-600 ml-auto">{filtered.length} / {applied.length} 名表示</span>
      </div>

      {/* 名簿テーブル */}
      {loading ? (
        <div className="p-4 text-center text-gray-500">読み込み中…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-100 text-xs">
              <tr>
                <th className="px-2 py-2 border text-left">#</th>
                <th className="px-2 py-2 border text-left">氏名</th>
                <th className="px-2 py-2 border text-left">事業所</th>
                <th className="px-2 py-2 border text-left">区分</th>
                <th className="px-2 py-2 border text-left">連絡先</th>
                <th className="px-2 py-2 border text-left">申込状態</th>
                <th className="px-2 py-2 border text-left">出欠</th>
                <th className="px-2 py-2 border text-left">事務局メモ</th>
                <th className="px-2 py-2 border text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.applyId} className={r.status !== 'APPLIED' ? 'bg-gray-50 text-gray-500' : ''}>
                  <td className="px-2 py-2 border">{i + 1}</td>
                  <td className="px-2 py-2 border font-semibold">{r.name}</td>
                  <td className="px-2 py-2 border">{r.officeName}</td>
                  <td className="px-2 py-2 border text-xs">{APPLICANT_TYPE_LABEL[r.applicantType]}</td>
                  <td className="px-2 py-2 border text-xs break-all">
                    {r.email && <div>{r.email}</div>}
                    {r.phone && <div className="text-gray-500">{r.phone}</div>}
                  </td>
                  <td className="px-2 py-2 border text-xs">{r.status === 'APPLIED' ? '申込済' : '取消'}</td>
                  <td className="px-2 py-2 border">
                    {r.status === 'APPLIED' ? (
                      <select
                        value={r.attendanceStatus}
                        onChange={(e) => updateAttendance(r.applyId, e.target.value as AttendanceStatus)}
                        className="min-h-[44px] px-2 border rounded text-xs"
                      >
                        {(Object.keys(ATTENDANCE_LABEL) as AttendanceStatus[]).map((s) => (
                          <option key={s} value={s}>{ATTENDANCE_LABEL[s]}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-2 py-2 border text-xs max-w-[180px] truncate" title={r.adminMemo}>{r.adminMemo || '-'}</td>
                  <td className="px-2 py-2 border">
                    <div className="flex gap-1">
                      <button onClick={() => editMemo(r)} className="px-2 py-1 min-h-[44px] text-xs bg-gray-100 hover:bg-gray-200 rounded">メモ</button>
                      {r.status === 'APPLIED' && (
                        <button onClick={() => cancel(r.applyId, r.name)} className="px-2 py-1 min-h-[44px] text-xs bg-red-100 hover:bg-red-200 text-red-800 rounded" aria-label="キャンセル">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-2 py-8 text-center text-gray-400">該当者なし</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showGuestDialog && (
        <GuestAddDialog
          trainingId={trainingId}
          onClose={() => setShowGuestDialog(false)}
          onAdded={() => { setShowGuestDialog(false); load(); }}
        />
      )}
      {showAddDialog && (
        <MemberAddDialog
          trainingId={trainingId}
          onClose={() => setShowAddDialog(false)}
          onAdded={() => { setShowAddDialog(false); load(); }}
        />
      )}
    </div>
  );
};

// ── 集計カード ─────────────────────────────────────────────────────
const StatCard: React.FC<{ label: string; value: number; sub?: string; color?: 'green' | 'yellow' | 'red' }> = ({ label, value, sub, color }) => {
  const colorMap = { green: 'border-green-300 bg-green-50', yellow: 'border-yellow-300 bg-yellow-50', red: 'border-red-300 bg-red-50' };
  const cls = color ? colorMap[color] : 'border-gray-200 bg-white';
  return (
    <div className={`border rounded p-3 ${cls}`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
};

// ── ゲスト追加ダイアログ ───────────────────────────────────────────
const GuestAddDialog: React.FC<{ trainingId: string; onClose: () => void; onAdded: () => void }> = ({ trainingId, onClose, onAdded }) => {
  const [name, setName] = useState('');
  const [kana, setKana] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [officeName, setOfficeName] = useState('');
  const [memo, setMemo] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) { setErr('氏名は必須です'); return; }
    setBusy(true);
    setErr(null);
    try {
      const res = await api.addGuestRosterEntry({
        trainingId,
        // v376: kana 列を全角カタカナに正規化
        guest: { name: name.trim(), kana: normalizeKana(kana), email: email.trim(), phone: phone.trim(), officeName: officeName.trim() },
        memo: memo.trim(),
      });
      if (!res.ok) { setErr(res.error || '追加に失敗しました'); return; }
      onAdded();
    } catch (e) {
      setErr(e instanceof Error ? e.message : '追加に失敗しました');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[100dvh] sm:max-h-[90dvh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">ゲスト（非会員）を追加</h3>
        {err && <div className="mb-3 p-2 bg-red-50 text-red-800 text-sm rounded">{err}</div>}
        <div className="space-y-3">
          <Field label="氏名 *" value={name} onChange={setName} />
          <Field label="フリガナ" value={kana} onChange={setKana} />
          <Field label="事業所名" value={officeName} onChange={setOfficeName} />
          <Field label="メール" value={email} onChange={setEmail} type="email" />
          <Field label="電話" value={phone} onChange={setPhone} type="tel" />
          <Field label="事務局メモ" value={memo} onChange={setMemo} />
        </div>
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={onClose} disabled={busy} className="px-4 py-2 min-h-[44px] border rounded">キャンセル</button>
          <button onClick={submit} disabled={busy || !name.trim()} className="px-4 py-2 min-h-[44px] bg-violet-600 text-white rounded">追加</button>
        </div>
      </div>
    </div>
  );
};

// ── 会員追加ダイアログ（簡易: ID 直接入力。検索 UI は次回拡張）─────────────────
const MemberAddDialog: React.FC<{ trainingId: string; onClose: () => void; onAdded: () => void }> = ({ trainingId, onClose, onAdded }) => {
  const [mode, setMode] = useState<'member' | 'staff'>('member');
  const [id, setId] = useState('');
  const [memo, setMemo] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!id.trim()) { setErr('IDを入力してください'); return; }
    setBusy(true); setErr(null);
    try {
      const payload: any = { trainingId, memo: memo.trim() };
      if (mode === 'member') payload.memberId = id.trim();
      else payload.staffId = id.trim();
      const res = await api.addRosterEntry(payload);
      if (!res.ok) { setErr(res.error || '追加に失敗しました'); return; }
      onAdded();
    } catch (e) {
      setErr(e instanceof Error ? e.message : '追加に失敗しました');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[100dvh] sm:max-h-[90dvh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">会員 / 事業所職員を追加</h3>
        {err && <div className="mb-3 p-2 bg-red-50 text-red-800 text-sm rounded">{err}</div>}
        <div className="space-y-3">
          <div className="flex gap-2">
            <label className="flex items-center gap-2 min-h-[44px]"><input type="radio" checked={mode === 'member'} onChange={() => setMode('member')} /> 会員</label>
            <label className="flex items-center gap-2 min-h-[44px]"><input type="radio" checked={mode === 'staff'} onChange={() => setMode('staff')} /> 事業所職員</label>
          </div>
          <Field label={mode === 'member' ? '会員ID' : '職員ID'} value={id} onChange={setId} />
          <Field label="事務局メモ" value={memo} onChange={setMemo} />
          <p className="text-xs text-gray-500">※ 会員一覧から ID を確認のうえ入力してください。検索 UI は今後拡張予定です。</p>
        </div>
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={onClose} disabled={busy} className="px-4 py-2 min-h-[44px] border rounded">キャンセル</button>
          <button onClick={submit} disabled={busy || !id.trim()} className="px-4 py-2 min-h-[44px] bg-blue-600 text-white rounded">追加</button>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string }> = ({ label, value, onChange, type = 'text' }) => (
  <label className="block">
    <span className="block text-xs text-gray-600 mb-1">{label}</span>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 min-h-[44px] border rounded" />
  </label>
);

export default TrainingRoster;
