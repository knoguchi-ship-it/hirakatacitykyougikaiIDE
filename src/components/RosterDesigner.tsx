import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiClient } from '../services/api';
import {
  RosterColumnDef,
  RosterDesignerRow,
  RosterFieldDef,
  RosterLayoutDef,
  RosterOutputUnit,
  RosterTemplateV2,
  RowFilterDef,
  RowFilterOperator,
} from '../types';

// v372: 名簿出力 Visual Template Designer (S1: 骨組み + 列ビルダー + CSV + 件数表示)
// drag-drop / 計算式 / 条件付き書式 / PDF / Excel は S2-S5 で実装

interface RosterDesignerProps {
  api: ApiClient;
}

const MEMBER_TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: '個人会員',
  BUSINESS: '事業所会員',
  SUPPORT: '賛助会員',
};

const calcCurrentFY = (): number => {
  const now = new Date();
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
};

const DEFAULT_LAYOUT: RosterLayoutDef = {
  paperSize: 'A4',
  orientation: 'portrait',
  fontSize: 10,
  showRecordCount: true,
  recordCountPosition: 'header',
  recordCountFormat: '出力対象: {{count}} 名',
};

const emptyTemplate = (): RosterTemplateV2 => ({
  id: '',
  name: '',
  description: '',
  target: 'ALL',
  outputUnit: 'MEMBER',
  columns: [],
  layout: { ...DEFAULT_LAYOUT },
});

// 演算子定義（型別）
const OPERATORS_BY_TYPE: Record<string, Array<{ value: RowFilterOperator; label: string; valueKind: 'none' | 'single' | 'double' | 'multi' }>> = {
  string: [
    { value: 'contains',     label: '含む',         valueKind: 'single' },
    { value: 'notContains',  label: '含まない',     valueKind: 'single' },
    { value: 'equals',       label: '等しい',       valueKind: 'single' },
    { value: 'notEquals',    label: '等しくない',   valueKind: 'single' },
    { value: 'startsWith',   label: '始まる',       valueKind: 'single' },
    { value: 'endsWith',     label: '終わる',       valueKind: 'single' },
    { value: 'isEmpty',      label: '空',           valueKind: 'none' },
    { value: 'isNotEmpty',   label: '空でない',     valueKind: 'none' },
  ],
  number: [
    { value: 'equals',       label: '=',           valueKind: 'single' },
    { value: 'notEquals',    label: '≠',           valueKind: 'single' },
    { value: 'gt',           label: '>',           valueKind: 'single' },
    { value: 'lt',           label: '<',           valueKind: 'single' },
    { value: 'gte',          label: '≥',           valueKind: 'single' },
    { value: 'lte',          label: '≤',           valueKind: 'single' },
    { value: 'between',      label: '範囲',         valueKind: 'double' },
    { value: 'isEmpty',      label: '空',           valueKind: 'none' },
    { value: 'isNotEmpty',   label: '空でない',     valueKind: 'none' },
  ],
  date: [
    { value: 'equals',       label: '等しい',       valueKind: 'single' },
    { value: 'before',       label: '以前',         valueKind: 'single' },
    { value: 'after',        label: '以降',         valueKind: 'single' },
    { value: 'between',      label: '期間',         valueKind: 'double' },
    { value: 'isEmpty',      label: '空',           valueKind: 'none' },
    { value: 'isNotEmpty',   label: '空でない',     valueKind: 'none' },
  ],
  enum: [
    { value: 'in',           label: 'いずれか',     valueKind: 'multi' },
    { value: 'notIn',        label: '除外',         valueKind: 'multi' },
    { value: 'isEmpty',      label: '空',           valueKind: 'none' },
    { value: 'isNotEmpty',   label: '空でない',     valueKind: 'none' },
  ],
  boolean: [
    { value: 'equals',       label: '等しい',       valueKind: 'single' },
  ],
};
const operatorsFor = (type?: string) => OPERATORS_BY_TYPE[type || 'string'] || OPERATORS_BY_TYPE.string;
const operatorLabel = (op?: RowFilterOperator): string => {
  for (const list of Object.values(OPERATORS_BY_TYPE)) {
    const f = list.find((o) => o.value === op);
    if (f) return f.label;
  }
  return String(op || '');
};
const operatorValueKind = (type: string, op: RowFilterOperator): 'none' | 'single' | 'double' | 'multi' => {
  const list = operatorsFor(type);
  const f = list.find((o) => o.value === op);
  return f?.valueKind ?? 'single';
};

const genId = (): string => {
  // crypto.randomUUID() は GAS iframe 内で動作するブラウザのみ。fallback 用意。
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const fmtValue = (raw: unknown, type: string, enumLabels?: Record<string, string>): string => {
  if (raw == null || raw === '') return '';
  const s = String(raw);
  if (type === 'enum' && enumLabels && enumLabels[s]) return enumLabels[s];
  return s;
};

const groupOrder: Array<RosterFieldDef['group']> = ['member', 'office', 'staff', 'fee', 'computed'];
const groupLabel: Record<string, string> = {
  member: '会員（個人情報）',
  office: '勤務先',
  staff: '事業所職員',
  fee: '年会費',
  computed: '計算済み',
};

const btnCls =
  'rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]';
const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

const RosterDesigner: React.FC<RosterDesignerProps> = ({ api }) => {
  // --- フィールド辞書とテンプレ ---
  const [dictionary, setDictionary] = useState<RosterFieldDef[]>([]);
  const [templates, setTemplates] = useState<RosterTemplateV2[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [working, setWorking] = useState<RosterTemplateV2>(emptyTemplate);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  // --- フィルタ ---
  const currentFY = useMemo(calcCurrentFY, []);
  const [filterTypes, setFilterTypes] = useState<string[]>(['INDIVIDUAL', 'BUSINESS', 'SUPPORT']);
  const [filterStatus, setFilterStatus] = useState('ACTIVE');
  const [filterYear, setFilterYear] = useState(currentFY);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // --- 対象データ ---
  const [rows, setRows] = useState<RosterDesignerRow[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string> | null>(null);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  // 初回ロード: 辞書 + テンプレ一覧
  useEffect(() => {
    void (async () => {
      try {
        const [dict, tplResp] = await Promise.all([
          api.getRosterFieldDictionary(),
          api.loadRosterTemplatesV2(),
        ]);
        setDictionary(dict);
        setTemplates(tplResp.templates);
        const def = tplResp.templates.find((t) => t.isDefault) ?? tplResp.templates[0];
        if (def) {
          setSelectedTemplateId(def.id);
          setWorking(JSON.parse(JSON.stringify(def)));
        } else {
          // テンプレなし → 新規 (デフォルト列セット)
          const init: RosterTemplateV2 = {
            ...emptyTemplate(),
            id: genId(),
            name: '新規テンプレート',
            columns: [
              { id: genId(), source: 'field', fieldKey: 'fullName',          label: '氏名', align: 'left' },
              { id: genId(), source: 'field', fieldKey: 'careManagerNumber', label: 'CM番号', align: 'left' },
              { id: genId(), source: 'field', fieldKey: 'officeName',        label: '勤務先', align: 'left' },
              { id: genId(), source: 'field', fieldKey: 'annualFeeStatus',   label: '年会費', align: 'center' },
            ],
          };
          setWorking(init);
        }
      } catch (e) {
        setBootError(e instanceof Error ? e.message : '初期データの読み込みに失敗しました。');
      }
    })();
  }, [api]);

  // データロード
  const loadData = useCallback(async () => {
    setLoadingData(true);
    setLoadError(null);
    try {
      const data = await api.getRosterDesignerData({
        memberTypes: filterTypes,
        memberStatus: filterStatus,
        year: filterYear,
        outputUnit: working.outputUnit ?? 'MEMBER',
      });
      setRows(data.rows);
      setAvailableYears(data.years.length > 0 ? data.years : [currentFY]);
      setSelectedIds(null);
      setExcludedIds(new Set());
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'データの読み込みに失敗しました。');
    } finally {
      setLoadingData(false);
    }
  }, [api, filterTypes, filterStatus, filterYear, currentFY, working.outputUnit]);

  useEffect(() => { void loadData(); }, [loadData]);

  // --- 列フィルタ評価（rowFilter）---
  const dictByKeyForFilter = useMemo(() => {
    const map = new Map<string, RosterFieldDef>();
    dictionary.forEach((d) => map.set(d.key, d));
    return map;
  }, [dictionary]);

  const evalRowFilter = useCallback((row: RosterDesignerRow, col: RosterColumnDef): boolean => {
    const rf = col.rowFilter;
    if (!rf || !rf.operator) return true;
    const fdef = col.fieldKey ? dictByKeyForFilter.get(col.fieldKey) : null;
    const type = fdef?.type || 'string';
    const valueKind = operatorValueKind(type, rf.operator);
    // 値未入力フィルタは無視
    if (valueKind === 'single' && !rf.value) return true;
    if (valueKind === 'double' && !rf.value && !rf.value2) return true;
    if (valueKind === 'multi' && (!rf.values || rf.values.length === 0)) return true;
    const raw = col.fieldKey ? row[col.fieldKey] : undefined;
    const sval = raw == null ? '' : String(raw);
    switch (rf.operator) {
      case 'isEmpty': return sval === '';
      case 'isNotEmpty': return sval !== '';
      case 'contains': return sval.indexOf(String(rf.value || '')) >= 0;
      case 'notContains': return sval.indexOf(String(rf.value || '')) < 0;
      case 'equals': return sval === String(rf.value || '');
      case 'notEquals': return sval !== String(rf.value || '');
      case 'startsWith': return sval.indexOf(String(rf.value || '')) === 0;
      case 'endsWith': return sval.length >= String(rf.value || '').length && sval.lastIndexOf(String(rf.value || '')) === sval.length - String(rf.value || '').length;
      case 'gt':  return Number(sval) >  Number(rf.value);
      case 'lt':  return Number(sval) <  Number(rf.value);
      case 'gte': return Number(sval) >= Number(rf.value);
      case 'lte': return Number(sval) <= Number(rf.value);
      case 'between': {
        const n = type === 'number' ? Number(sval) : sval;
        const lo = type === 'number' ? Number(rf.value)  : String(rf.value  || '');
        const hi = type === 'number' ? Number(rf.value2) : String(rf.value2 || '');
        return (n as number) >= (lo as number) && (n as number) <= (hi as number);
      }
      case 'in': return Array.isArray(rf.values) && rf.values.indexOf(sval) >= 0;
      case 'notIn': return Array.isArray(rf.values) && rf.values.indexOf(sval) < 0;
      case 'before': return sval !== '' && sval <= String(rf.value || '');
      case 'after':  return sval !== '' && sval >= String(rf.value || '');
      default: return true;
    }
  }, [dictByKeyForFilter]);

  // 行フィルタ適用後の rows
  const filteredRows = useMemo(() => {
    if (!working.columns.some((c) => c.rowFilter && c.rowFilter.operator)) return rows;
    return rows.filter((r) => working.columns.every((c) => evalRowFilter(r, c)));
  }, [rows, working.columns, evalRowFilter]);

  // 適用中フィルタ chip リスト
  const activeFilters = useMemo(() => {
    return working.columns
      .filter((c) => c.rowFilter && c.rowFilter.operator)
      .map((c) => {
        const rf = c.rowFilter!;
        const fdef = c.fieldKey ? dictByKeyForFilter.get(c.fieldKey) : null;
        const type = fdef?.type || 'string';
        const valueKind = operatorValueKind(type, rf.operator);
        let valStr = '';
        if (valueKind === 'single') valStr = rf.value || '';
        else if (valueKind === 'double') valStr = `${rf.value || ''}〜${rf.value2 || ''}`;
        else if (valueKind === 'multi') valStr = (rf.values || []).join(',');
        return { colId: c.id, label: c.label, opLabel: operatorLabel(rf.operator), valStr };
      });
  }, [working.columns, dictByKeyForFilter]);

  const isSelected = (id: string) =>
    selectedIds === null ? !excludedIds.has(id) : selectedIds.has(id);
  const effectiveRows = useMemo(() => {
    return filteredRows.filter((r) => isSelected(String(r.memberId)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredRows, selectedIds, excludedIds]);

  // --- 列ビルダー ---
  const dictByKey = useMemo(() => {
    const map = new Map<string, RosterFieldDef>();
    dictionary.forEach((d) => map.set(d.key, d));
    return map;
  }, [dictionary]);

  const dictionaryByGroup = useMemo(() => {
    const map = new Map<string, RosterFieldDef[]>();
    dictionary.forEach((d) => {
      const arr = map.get(d.group) ?? [];
      arr.push(d);
      map.set(d.group, arr);
    });
    return map;
  }, [dictionary]);

  const usedKeys = useMemo(() => {
    const s = new Set<string>();
    working.columns.forEach((c) => { if (c.source === 'field' && c.fieldKey) s.add(c.fieldKey); });
    return s;
  }, [working.columns]);

  const addFieldColumn = (field: RosterFieldDef) => {
    if (usedKeys.has(field.key)) return; // 同フィールドは1度のみ
    const newCol: RosterColumnDef = {
      id: genId(),
      source: 'field',
      fieldKey: field.key,
      label: field.label,
      align: field.type === 'number' ? 'right' : 'left',
    };
    setWorking((w) => ({ ...w, columns: [...w.columns, newCol] }));
    setDirty(true);
  };

  const removeColumn = (id: string) => {
    setWorking((w) => ({ ...w, columns: w.columns.filter((c) => c.id !== id) }));
    setDirty(true);
  };

  const moveColumn = (id: string, direction: -1 | 1) => {
    setWorking((w) => {
      const idx = w.columns.findIndex((c) => c.id === id);
      if (idx < 0) return w;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= w.columns.length) return w;
      const next = w.columns.slice();
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return { ...w, columns: next };
    });
    setDirty(true);
  };

  const updateColumn = (id: string, patch: Partial<RosterColumnDef>) => {
    setWorking((w) => ({
      ...w,
      columns: w.columns.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
    setDirty(true);
  };

  // --- テンプレ操作 ---
  const selectTemplate = (id: string) => {
    if (dirty && !confirm('未保存の変更があります。破棄して切り替えますか？')) return;
    setSelectedTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (t) setWorking(JSON.parse(JSON.stringify(t)));
    setDirty(false);
  };

  const newTemplate = () => {
    if (dirty && !confirm('未保存の変更があります。破棄して新規作成しますか？')) return;
    const init: RosterTemplateV2 = {
      ...emptyTemplate(),
      id: genId(),
      name: '新規テンプレート',
      columns: [],
    };
    setSelectedTemplateId('');
    setWorking(init);
    setDirty(true);
  };

  const saveTemplate = async () => {
    if (!working.name.trim()) { alert('テンプレート名を入力してください。'); return; }
    if (working.columns.length === 0) { alert('列を1つ以上追加してください。'); return; }
    setSaving(true);
    try {
      const next: RosterTemplateV2 = { ...working, id: working.id || genId() };
      const r = await api.saveRosterTemplateV2(next);
      setTemplates(r.templates);
      setSelectedTemplateId(next.id);
      setWorking(JSON.parse(JSON.stringify(next)));
      setDirty(false);
      alert('テンプレートを保存しました。');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'テンプレートの保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const duplicateTemplate = async () => {
    if (!selectedTemplateId) { alert('複製対象を選択してください。'); return; }
    if (dirty && !confirm('未保存の変更があります。破棄して複製しますか？')) return;
    try {
      const r = await api.duplicateRosterTemplateV2(selectedTemplateId);
      setTemplates(r.templates);
      const newest = r.templates[r.templates.length - 1];
      setSelectedTemplateId(newest.id);
      setWorking(JSON.parse(JSON.stringify(newest)));
      setDirty(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : '複製に失敗しました。');
    }
  };

  const deleteTemplate = async () => {
    if (!selectedTemplateId) return;
    if (!confirm(`テンプレート「${working.name}」を削除しますか？この操作は取り消せません。`)) return;
    try {
      const r = await api.deleteRosterTemplateV2(selectedTemplateId);
      setTemplates(r.templates);
      const def = r.templates.find((t) => t.isDefault) ?? r.templates[0];
      if (def) {
        setSelectedTemplateId(def.id);
        setWorking(JSON.parse(JSON.stringify(def)));
      } else {
        newTemplate();
      }
      setDirty(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : '削除に失敗しました。');
    }
  };

  // --- 値抽出 ---
  const valueFor = useCallback((row: RosterDesignerRow, col: RosterColumnDef): string => {
    if (col.source === 'literal') return col.literal ?? '';
    if (col.source === 'field' && col.fieldKey) {
      const fdef = dictByKey.get(col.fieldKey);
      const raw = row[col.fieldKey];
      return fmtValue(raw, fdef?.type || 'string', fdef?.enumLabels);
    }
    // formula は S3
    return '';
  }, [dictByKey]);

  // --- 件数表示テキスト生成 ---
  const recordCountText = useMemo(() => {
    if (!working.layout?.showRecordCount) return '';
    const fmt = working.layout.recordCountFormat || '出力対象: {{count}} 名';
    return fmt.replace(/\{\{count\}\}/g, String(effectiveRows.length));
  }, [working.layout, effectiveRows.length]);

  // --- CSV 出力 ---
  const exportCsv = () => {
    if (working.columns.length === 0) { alert('列を1つ以上追加してください。'); return; }
    const lines: string[] = [];
    // 件数行（ヘッダー位置 or both）
    const pos = working.layout?.recordCountPosition || 'header';
    if (working.layout?.showRecordCount && (pos === 'header' || pos === 'both')) {
      lines.push(`# ${recordCountText}`);
    }
    // ヘッダー
    lines.push(working.columns.map((c) => csvEscape(c.label)).join(','));
    // データ
    effectiveRows.forEach((r) => {
      lines.push(working.columns.map((c) => csvEscape(valueFor(r, c))).join(','));
    });
    // フッター
    if (working.layout?.showRecordCount && (pos === 'footer' || pos === 'both')) {
      lines.push(`# ${recordCountText}`);
    }
    const csv = lines.join('\r\n');
    const bom = '﻿';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (working.name || 'roster').replace(/[\\/:*?"<>|]/g, '_');
    a.download = `${safeName}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- 一括選択 ---
  const selectAll = () => { setSelectedIds(null); setExcludedIds(new Set()); };
  const deselectAll = () => { setSelectedIds(new Set()); setExcludedIds(new Set()); };
  const toggleOne = (id: string) => {
    if (selectedIds === null) {
      setExcludedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev ?? []);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    }
  };

  const previewRows = effectiveRows.slice(0, 5);

  // ============================ RENDER ============================
  if (bootError) {
    return (
      <div className="p-6">
        <p className="rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{bootError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">名簿出力（Visual Designer）</h2>
        <p className="text-sm text-slate-600">列をチェックボックスで選択し、並び替え・名前変更・CSV出力ができます。<strong>v372 S1 段階</strong>のためドラッグ＆ドロップ・計算式・PDF出力は今後のリリースで追加されます。</p>
      </header>

      {/* ① テンプレート選択 */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <h3 className="text-base font-semibold text-slate-700">① テンプレート</h3>
        <div className="flex flex-wrap gap-2 items-center">
          <select className={inputCls + ' max-w-xs'} value={selectedTemplateId}
            onChange={(e) => selectTemplate(e.target.value)}>
            <option value="">(新規・未保存)</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}{t.isDefault ? ' ★' : ''}</option>
            ))}
          </select>
          <button className={`${btnCls} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
            onClick={newTemplate}>+ 新規</button>
          <button className={`${btnCls} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50`}
            disabled={!selectedTemplateId} onClick={duplicateTemplate}>複製</button>
          <button className={`${btnCls} border border-rose-300 bg-white text-rose-700 hover:bg-rose-50 disabled:opacity-50`}
            disabled={!selectedTemplateId} onClick={deleteTemplate}>削除</button>
          <span className="ml-auto inline-flex items-center gap-2">
            <button
              className={`${btnCls} ${dirty ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
              onClick={saveTemplate} disabled={saving || !dirty}>
              {saving ? '保存中…' : dirty ? '💾 保存' : '✓ 保存済み'}
            </button>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <p className="text-sm font-medium text-slate-600 shrink-0">出力単位:</p>
          {(['MEMBER', 'STAFF', 'MIXED'] as const).map((u) => (
            <label key={u} className="flex items-center gap-2 text-sm min-h-[44px] cursor-pointer">
              <input type="radio" name="outputUnit" value={u}
                checked={(working.outputUnit ?? 'MEMBER') === u}
                onChange={() => { setWorking((w) => ({ ...w, outputUnit: u })); setDirty(true); }} />
              {u === 'MEMBER' ? '会員単位（既定）' : u === 'STAFF' ? '事業所職員単位' : '混合（個人/賛助/事業所職員）'}
            </label>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">名称</label>
            <input className={inputCls} value={working.name}
              onChange={(e) => { setWorking((w) => ({ ...w, name: e.target.value })); setDirty(true); }} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">説明（任意）</label>
            <input className={inputCls} value={working.description || ''}
              onChange={(e) => { setWorking((w) => ({ ...w, description: e.target.value })); setDirty(true); }} />
          </div>
        </div>
      </section>

      {/* ② フィルタ */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-700">② 出力対象フィルタ</h3>
          <button className={`${btnCls} border border-slate-300 bg-white text-xs text-slate-600 hover:bg-slate-50`}
            onClick={loadData} disabled={loadingData}>
            {loadingData ? '読み込み中...' : '再読み込み'}
          </button>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-slate-600">会員種別</p>
          <div className="flex flex-wrap gap-4">
            {(['INDIVIDUAL', 'BUSINESS', 'SUPPORT'] as const).map((mt) => (
              <label key={mt} className="flex cursor-pointer items-center gap-2 text-sm min-h-[44px]">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300"
                  checked={filterTypes.includes(mt)}
                  onChange={() => setFilterTypes((p) => p.includes(mt) ? p.filter((x) => x !== mt) : [...p, mt])} />
                {MEMBER_TYPE_LABELS[mt]}
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">在籍判定年度</label>
            <select className={inputCls} value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}>
              {(availableYears.length > 0 ? availableYears : [currentFY]).map((y) => (
                <option key={y} value={y}>{y}年度</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">在籍状態</label>
            <select className={inputCls} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="ACTIVE">在籍中のみ</option>
              <option value="INCLUDING_SCHEDULED">退会予定を含む</option>
              <option value="ALL">すべて</option>
            </select>
          </div>
        </div>
        {loadError && (
          <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{loadError}</p>
        )}
      </section>

      {/* ③ 列ビルダー */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <h3 className="text-base font-semibold text-slate-700">③ 列ビルダー</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 利用可能フィールド */}
          <div className="rounded border border-slate-200 bg-slate-50 p-3 space-y-3 max-h-[480px] overflow-y-auto">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">利用可能フィールド</p>
            {groupOrder.map((grp) => {
              const items = dictionaryByGroup.get(grp) || [];
              if (items.length === 0) return null;
              return (
                <div key={grp}>
                  <p className="mb-1 text-xs font-semibold text-slate-600">{groupLabel[grp] || grp}</p>
                  <div className="space-y-1">
                    {items.map((f) => (
                      <button key={f.key} type="button"
                        onClick={() => addFieldColumn(f)}
                        disabled={usedKeys.has(f.key)}
                        className={`w-full flex items-center justify-between rounded border px-2 py-1.5 text-sm text-left transition-colors min-h-[44px] ${
                          usedKeys.has(f.key)
                            ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'border-slate-200 bg-white hover:border-primary-400 hover:bg-primary-50 text-slate-800'
                        }`}
                        title={f.description || `例: ${f.sample}`}
                      >
                        <span className="truncate">{f.label}</span>
                        <span className="ml-2 shrink-0 text-xs text-slate-400">{usedKeys.has(f.key) ? '追加済' : '+'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {/* 出力列 */}
          <div className="rounded border border-slate-200 bg-white p-3 space-y-2 max-h-[480px] overflow-y-auto">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">出力列（{working.columns.length} 列）</p>
            {working.columns.length === 0 && (
              <p className="rounded border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-center text-sm text-slate-400">
                左から列を追加してください
              </p>
            )}
            {working.columns.map((col, idx) => {
              const fdef = col.fieldKey ? dictByKey.get(col.fieldKey) : null;
              const fieldType = fdef?.type || 'string';
              const ops = operatorsFor(fieldType);
              const rf = col.rowFilter;
              const valKind = rf?.operator ? operatorValueKind(fieldType, rf.operator) : 'single';
              const enumOpts = fdef?.enumLabels ? Object.entries(fdef.enumLabels) : [];
              return (
                <div key={col.id} className="rounded border border-slate-200 bg-slate-50 p-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-6 text-center">{idx + 1}</span>
                    <input className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                      value={col.label}
                      onChange={(e) => updateColumn(col.id, { label: e.target.value })} />
                    <button type="button" onClick={() => moveColumn(col.id, -1)}
                      disabled={idx === 0}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                      aria-label="上へ移動">↑</button>
                    <button type="button" onClick={() => moveColumn(col.id, 1)}
                      disabled={idx === working.columns.length - 1}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                      aria-label="下へ移動">↓</button>
                    <button type="button" onClick={() => removeColumn(col.id)}
                      className="rounded border border-rose-200 bg-white px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                      aria-label="削除">×</button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="shrink-0">フィールド:</span>
                    <span className="truncate">{fdef?.label ?? (col.source === 'literal' ? `文字列: "${col.literal}"` : '不明')}</span>
                    <span className="ml-auto shrink-0">配置:</span>
                    <select className="rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
                      value={col.align || 'left'}
                      onChange={(e) => updateColumn(col.id, { align: e.target.value as 'left' | 'center' | 'right' })}>
                      <option value="left">左</option>
                      <option value="center">中央</option>
                      <option value="right">右</option>
                    </select>
                  </div>
                  {/* 行フィルタ */}
                  <div className="flex flex-wrap items-center gap-2 text-xs bg-white rounded border border-slate-200 px-2 py-1.5">
                    <span className="shrink-0 text-slate-500">条件:</span>
                    <select className="rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
                      value={rf?.operator || ''}
                      onChange={(e) => {
                        const opVal = e.target.value as RowFilterOperator | '';
                        if (!opVal) { updateColumn(col.id, { rowFilter: undefined }); return; }
                        updateColumn(col.id, { rowFilter: { operator: opVal } });
                      }}>
                      <option value="">（なし）</option>
                      {ops.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    {rf?.operator && valKind === 'single' && (
                      fieldType === 'enum' ? (
                        <select className="flex-1 min-w-[120px] rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
                          value={rf.value || ''}
                          onChange={(e) => updateColumn(col.id, { rowFilter: { ...rf, value: e.target.value } as RowFilterDef })}>
                          <option value="">選択</option>
                          {enumOpts.map(([k, lbl]) => <option key={k} value={k}>{lbl}</option>)}
                        </select>
                      ) : (
                        <input
                          type={fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'}
                          className="flex-1 min-w-[100px] rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
                          value={rf.value || ''}
                          onChange={(e) => updateColumn(col.id, { rowFilter: { ...rf, value: e.target.value } as RowFilterDef })}
                          placeholder="値" />
                      )
                    )}
                    {rf?.operator && valKind === 'double' && (
                      <>
                        <input
                          type={fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'}
                          className="flex-1 min-w-[80px] rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
                          value={rf.value || ''}
                          onChange={(e) => updateColumn(col.id, { rowFilter: { ...rf, value: e.target.value } as RowFilterDef })}
                          placeholder="下限" />
                        <span className="text-slate-400">〜</span>
                        <input
                          type={fieldType === 'number' ? 'number' : fieldType === 'date' ? 'date' : 'text'}
                          className="flex-1 min-w-[80px] rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
                          value={rf.value2 || ''}
                          onChange={(e) => updateColumn(col.id, { rowFilter: { ...rf, value2: e.target.value } as RowFilterDef })}
                          placeholder="上限" />
                      </>
                    )}
                    {rf?.operator && valKind === 'multi' && (
                      <div className="flex flex-wrap items-center gap-1">
                        {enumOpts.map(([k, lbl]) => {
                          const arr = rf.values || [];
                          const selected = arr.indexOf(k) >= 0;
                          return (
                            <label key={k} className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs cursor-pointer border ${selected ? 'border-primary-500 bg-primary-50' : 'border-slate-300 bg-white'}`}>
                              <input type="checkbox" className="h-3 w-3" checked={selected}
                                onChange={(e) => {
                                  const next = e.target.checked ? Array.from(new Set([...arr, k])) : arr.filter((x) => x !== k);
                                  updateColumn(col.id, { rowFilter: { ...rf, values: next } as RowFilterDef });
                                }} />
                              {lbl}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ④ レイアウト（S1 では件数表示のみ） */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <h3 className="text-base font-semibold text-slate-700">④ レイアウト</h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="flex items-center gap-2 text-sm min-h-[44px]">
            <input type="checkbox"
              checked={working.layout?.showRecordCount ?? true}
              onChange={(e) => { setWorking((w) => ({ ...w, layout: { ...w.layout, showRecordCount: e.target.checked } })); setDirty(true); }} />
            出力件数を表示する
          </label>
          <select className={inputCls + ' max-w-[160px]'}
            value={working.layout?.recordCountPosition || 'header'}
            disabled={!(working.layout?.showRecordCount ?? true)}
            onChange={(e) => { setWorking((w) => ({ ...w, layout: { ...w.layout, recordCountPosition: e.target.value as 'header' | 'footer' | 'both' } })); setDirty(true); }}>
            <option value="header">ヘッダのみ</option>
            <option value="footer">フッタのみ</option>
            <option value="both">ヘッダとフッタ</option>
          </select>
          <input className={inputCls + ' max-w-md'}
            value={working.layout?.recordCountFormat || ''}
            disabled={!(working.layout?.showRecordCount ?? true)}
            onChange={(e) => { setWorking((w) => ({ ...w, layout: { ...w.layout, recordCountFormat: e.target.value } })); setDirty(true); }}
            placeholder="例: 出力対象: {{count}} 名" />
        </div>
        <p className="text-xs text-slate-500">差込変数: <code className="bg-slate-100 px-1 rounded">{'{{count}}'}</code> が出力件数に置換されます。</p>
      </section>

      {/* ⑤ プレビュー（先頭 5 件 + 件数） */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <h3 className="text-base font-semibold text-slate-700">⑤ プレビュー</h3>
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2">
            <span className="text-xs font-semibold text-amber-700 shrink-0">適用中の列フィルタ:</span>
            {activeFilters.map((af) => (
              <span key={af.colId} className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white px-2 py-0.5 text-xs text-amber-800">
                <span className="font-medium">{af.label}</span>
                <span className="text-slate-500">{af.opLabel}</span>
                {af.valStr && <span className="text-slate-700">{af.valStr}</span>}
                <button type="button"
                  onClick={() => updateColumn(af.colId, { rowFilter: undefined })}
                  className="ml-1 rounded-full hover:bg-amber-100 px-1 text-amber-700"
                  aria-label={`${af.label}の条件を解除`}>×</button>
              </span>
            ))}
            <span className="ml-auto text-xs text-amber-700">{filteredRows.length} / {rows.length} 件</span>
          </div>
        )}
        {working.layout?.showRecordCount && recordCountText && (
          <p className="text-sm text-slate-600 font-medium">{recordCountText}</p>
        )}
        <div className="overflow-x-auto rounded border border-slate-200">
          {working.columns.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">列を追加するとプレビューが表示されます</p>
          ) : previewRows.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">該当データがありません</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  {working.columns.map((c) => (
                    <th key={c.id} className="border-b border-slate-200 px-3 py-2 text-left font-semibold"
                      style={{ textAlign: c.align || 'left' }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r, i) => (
                  <tr key={String(r.memberId) + i} className="even:bg-slate-50">
                    {working.columns.map((c) => (
                      <td key={c.id} className="border-b border-slate-100 px-3 py-1.5 text-slate-800"
                        style={{ textAlign: c.align || 'left' }}>{valueFor(r, c)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <p className="text-xs text-slate-500">※ 先頭 5 件のみ表示。全 {effectiveRows.length} 件 / フィルタ後 {filteredRows.length} 件</p>
      </section>

      {/* ⑥ 対象一覧（チェックボックス選択） */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-700">⑥ 出力対象（{effectiveRows.length} / {filteredRows.length} 件選択中）</h3>
          <div className="flex flex-wrap gap-2">
            <button className={`${btnCls} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`} onClick={selectAll}>すべて選択</button>
            <button className={`${btnCls} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`} onClick={deselectAll}>すべて解除</button>
          </div>
        </div>
        <div className="max-h-[360px] overflow-y-auto rounded border border-slate-200">
          {filteredRows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">該当データがありません</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-700 sticky top-0">
                <tr>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2 text-left">氏名/事業所</th>
                  <th className="px-3 py-2 text-left">種別</th>
                  <th className="px-3 py-2 text-left">勤務先</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => {
                  const id = String(r.memberId);
                  return (
                    <tr key={id} className="even:bg-slate-50">
                      <td className="px-3 py-1.5">
                        <input type="checkbox" checked={isSelected(id)} onChange={() => toggleOne(id)}
                          aria-label={`${r.displayName}を選択`} />
                      </td>
                      <td className="px-3 py-1.5">{String(r.displayName || '')}</td>
                      <td className="px-3 py-1.5">{MEMBER_TYPE_LABELS[String(r.memberType)] || String(r.memberType)}</td>
                      <td className="px-3 py-1.5 text-slate-600">{String(r.officeName || '')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ⑦ 保存 & 出力 */}
      <section className="rounded-xl border border-primary-200 bg-primary-50 p-5 flex flex-wrap items-center gap-3">
        <button className={`${btnCls} bg-primary-600 text-white hover:bg-primary-700 disabled:bg-slate-400`}
          onClick={saveTemplate} disabled={saving || !dirty}>
          {saving ? '保存中...' : dirty ? 'テンプレートを保存' : '保存済み'}
        </button>
        <button className={`${btnCls} bg-emerald-600 text-white hover:bg-emerald-700`}
          onClick={exportCsv} disabled={working.columns.length === 0 || effectiveRows.length === 0}>
          CSV ダウンロード
        </button>
        <button className={`${btnCls} bg-slate-300 text-slate-500 cursor-not-allowed`} disabled title="S4 で実装予定">
          PDF 出力（次期リリース）
        </button>
        <button className={`${btnCls} bg-slate-300 text-slate-500 cursor-not-allowed`} disabled title="S5 で実装予定">
          Excel ダウンロード（次期リリース）
        </button>
        <span className="ml-auto text-xs text-slate-500">
          S2: ドラッグ＆ドロップ・プレビュー強化 / S3: 計算式・条件付き書式 / S4: PDF / S5: Excel
        </span>
      </section>
    </div>
  );
};

function csvEscape(value: string): string {
  if (value == null) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export default RosterDesigner;
