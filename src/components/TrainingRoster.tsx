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
  // v376.8: 選択ベースの一括操作（誤操作防止）
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addMenuOpen, setAddMenuOpen] = useState(false);

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

  // v376.8: 選択行に対する一括出欠変更（誤操作防止：選択明示が必要）
  const bulkSetSelected = async (status: AttendanceStatus) => {
    const targets = filtered.filter((r) => selectedIds.has(r.applyId) && r.status === 'APPLIED');
    if (targets.length === 0) return;
    if (!confirm(`選択中の ${targets.length} 名を「${ATTENDANCE_LABEL[status]}」に変更します。よろしいですか？`)) return;
    setBusy(true);
    try {
      const entries = targets.map((r) => ({ applyId: r.applyId, status }));
      await api.saveAttendanceBatch(entries);
      setSelectedIds(new Set());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '一括更新に失敗しました');
    } finally {
      setBusy(false);
    }
  };

  // 表示中行の全選択 / 解除（APPLIED のみ対象）
  const toggleSelectAllFiltered = () => {
    const eligible = filtered.filter((r) => r.status === 'APPLIED').map((r) => r.applyId);
    const allSelected = eligible.length > 0 && eligible.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        eligible.forEach((id) => next.delete(id));
      } else {
        eligible.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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

  // v376.8: 選択状態（filter 切替時に範囲外の選択を保持・visible 制御は selectionCount で判定）
  const visibleEligibleIds = filtered.filter((r) => r.status === 'APPLIED').map((r) => r.applyId);
  const selectedVisibleCount = visibleEligibleIds.filter((id) => selectedIds.has(id)).length;
  const allVisibleSelected = visibleEligibleIds.length > 0 && selectedVisibleCount === visibleEligibleIds.length;

  // segmented control 共通スタイル
  const segBase = 'px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-md transition-colors border';
  const segActive = 'bg-primary-600 text-white border-primary-600';
  const segInactive = 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50';

  return (
    <div className="space-y-4">
      {/* v376.8: header 簡素化 — タイトル/日付/出席率を 1 行に。「研修一覧へ戻る」は親タブ往復で代替するため廃止 */}
      <div className="flex flex-wrap items-baseline justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-sm text-slate-500">📅 {trainingDate || '-'}</span>
          {stats && (
            <>
              <span className="text-sm text-slate-500">申込 {stats.applicantCount} / {stats.capacity}</span>
              <span className="text-sm text-slate-500">出席率 {stats.attendanceRate ?? '-'}%</span>
            </>
          )}
        </div>
        <button onClick={load} disabled={loading || busy}
          className="px-3 py-2 min-h-[36px] bg-white hover:bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-600">
          🔄 更新
        </button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800" role="alert">{error}</div>}
      {notice && <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800" role="status">{notice}</div>}

      {/* 集計カード（圧縮版） */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="申込" value={stats.applicantCount} sub={`残 ${stats.remainingSlots}`} />
          <StatCard label="出席" value={stats.attendanceBreakdown.PRESENT} color="green" />
          <StatCard label="欠席" value={stats.attendanceBreakdown.ABSENT} color="yellow" />
          <StatCard label="未記録" value={stats.attendanceBreakdown.UNRECORDED} color="red" />
        </div>
      )}

      {stats && stats.officeBreakdown.length > 0 && (
        <details className="bg-white border border-slate-200 rounded-lg p-3 text-sm">
          <summary className="cursor-pointer font-semibold text-slate-700">事業所別 申込数</summary>
          <ul className="mt-2 space-y-1">
            {stats.officeBreakdown.slice(0, 15).map((o) => (
              <li key={o.officeName} className="flex justify-between border-b border-slate-100 py-1">
                <span>{o.officeName}</span><span className="font-semibold">{o.count}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Primary toolbar: 申込者を追加 (primary) / CSV (neutral) */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <button onClick={() => setAddMenuOpen((o) => !o)}
            className="px-4 py-2 min-h-[44px] bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium flex items-center gap-1"
            aria-expanded={addMenuOpen} aria-haspopup="menu">
            + 申込者を追加 <span aria-hidden="true">▾</span>
          </button>
          {addMenuOpen && (
            <div role="menu" className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[160px]">
              <button role="menuitem"
                onClick={() => { setAddMenuOpen(false); setShowAddDialog(true); }}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-50">会員を追加</button>
              <button role="menuitem"
                onClick={() => { setAddMenuOpen(false); setShowGuestDialog(true); }}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 border-t border-slate-100">ゲスト（非会員）を追加</button>
            </div>
          )}
        </div>
        <button onClick={exportCsv}
          className="px-3 py-2 min-h-[44px] bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-700">
          📄 CSV 出力
        </button>
      </div>

      {/* Filter bar: 検索 + segmented filters */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="🔍 氏名・事業所・メールで検索"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="flex-1 min-h-[40px] px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            aria-label="名簿検索"
          />
          <span className="text-xs text-slate-500 whitespace-nowrap">{filtered.length} / {applied.length} 名</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 mr-1">区分:</span>
          {([
            { v: 'ALL', label: 'すべて' },
            { v: 'MEMBER', label: '会員' },
            { v: 'STAFF', label: '職員' },
            { v: 'EXTERNAL', label: '非会員' },
          ] as { v: ApplicantType | 'ALL'; label: string }[]).map((opt) => (
            <button key={opt.v} type="button"
              onClick={() => setFilterType(opt.v)}
              className={`${segBase} ${filterType === opt.v ? segActive : segInactive}`}
              aria-pressed={filterType === opt.v}>
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 mr-1">出欠:</span>
          {([
            { v: 'ALL', label: 'すべて' },
            { v: 'UNRECORDED', label: '未記録' },
            { v: 'PRESENT', label: '出席' },
            { v: 'ABSENT', label: '欠席' },
            { v: 'LATE', label: '遅刻' },
            { v: 'SAMEDAY_CANCEL', label: '当日キャンセル' },
          ] as { v: AttendanceStatus | 'ALL'; label: string }[]).map((opt) => (
            <button key={opt.v} type="button"
              onClick={() => setFilterAttendance(opt.v)}
              className={`${segBase} ${filterAttendance === opt.v ? segActive : segInactive}`}
              aria-pressed={filterAttendance === opt.v}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selection toolbar (選択時のみ) */}
      {selectedVisibleCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 bg-primary-50 border border-primary-200 rounded-lg px-4 py-2"
          role="region" aria-label="一括操作">
          <span className="text-sm font-medium text-primary-900">☑ {selectedVisibleCount} 名選択中</span>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => bulkSetSelected('PRESENT')} disabled={busy}
              className="px-3 py-2 min-h-[36px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium disabled:opacity-50">
              選択中を出席に
            </button>
            <button onClick={() => bulkSetSelected('ABSENT')} disabled={busy}
              className="px-3 py-2 min-h-[36px] bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-medium disabled:opacity-50">
              選択中を欠席に
            </button>
            <button onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 min-h-[36px] bg-white hover:bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-600">
              選択解除
            </button>
          </div>
        </div>
      )}

      {/* 名簿テーブル */}
      {loading ? (
        <div className="p-4 text-center text-slate-500">読み込み中…</div>
      ) : (
        <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-700 border-b border-slate-200">
              <tr>
                <th className="px-2 py-2 text-center w-10">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllFiltered}
                    aria-label="表示中の全員を選択"
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="px-2 py-2 text-left">#</th>
                <th className="px-2 py-2 text-left">氏名</th>
                <th className="px-2 py-2 text-left">事業所</th>
                <th className="px-2 py-2 text-left">区分</th>
                <th className="px-2 py-2 text-left">連絡先</th>
                <th className="px-2 py-2 text-left">申込状態</th>
                <th className="px-2 py-2 text-left">出欠</th>
                <th className="px-2 py-2 text-left">事務局メモ</th>
                <th className="px-2 py-2 text-left">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r, i) => (
                <tr key={r.applyId} className={r.status !== 'APPLIED' ? 'bg-slate-50 text-slate-400' : 'hover:bg-slate-50'}>
                  <td className="px-2 py-2 text-center">
                    {r.status === 'APPLIED' && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r.applyId)}
                        onChange={() => toggleSelectOne(r.applyId)}
                        aria-label={`${r.name} を選択`}
                        className="w-4 h-4 cursor-pointer"
                      />
                    )}
                  </td>
                  <td className="px-2 py-2 text-slate-500">{i + 1}</td>
                  <td className="px-2 py-2 font-medium text-slate-800">{r.name}</td>
                  <td className="px-2 py-2 text-slate-700">{r.officeName}</td>
                  <td className="px-2 py-2 text-xs text-slate-600">{APPLICANT_TYPE_LABEL[r.applicantType]}</td>
                  <td className="px-2 py-2 text-xs break-all text-slate-600">
                    {r.email && <div>{r.email}</div>}
                    {r.phone && <div className="text-slate-400">{r.phone}</div>}
                  </td>
                  <td className="px-2 py-2 text-xs">{r.status === 'APPLIED' ? <span className="text-emerald-700">申込済</span> : <span className="text-slate-400">取消</span>}</td>
                  <td className="px-2 py-2">
                    {r.status === 'APPLIED' ? (
                      <select
                        value={r.attendanceStatus}
                        onChange={(e) => updateAttendance(r.applyId, e.target.value as AttendanceStatus)}
                        className="min-h-[36px] px-2 py-1 border border-slate-300 rounded-md text-xs bg-white"
                        aria-label={`${r.name} の出欠`}
                      >
                        {(Object.keys(ATTENDANCE_LABEL) as AttendanceStatus[]).map((s) => (
                          <option key={s} value={s}>{ATTENDANCE_LABEL[s]}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-xs max-w-[180px] truncate text-slate-600" title={r.adminMemo}>{r.adminMemo || '-'}</td>
                  <td className="px-2 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => editMemo(r)}
                        className="px-2 py-1 min-h-[32px] text-xs bg-white hover:bg-slate-100 border border-slate-300 rounded-md text-slate-700">メモ</button>
                      {r.status === 'APPLIED' && (
                        <button onClick={() => cancel(r.applyId, r.name)}
                          className="px-2 py-1 min-h-[32px] text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-md" aria-label={`${r.name} の申込を取り消す`}>
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="px-2 py-8 text-center text-slate-400">該当者なし</td></tr>
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
          <p className="text-xs text-gray-500">※ 会員一覧から会員 ID を確認のうえ入力してください。検索画面は今後拡張予定です。</p>
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
