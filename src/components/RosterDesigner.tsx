import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ApiClient } from '../services/api';
import {
  RosterColumnDef,
  RosterDesignerRow,
  RosterFieldDef,
  RosterFieldGroup,
  RosterLayoutDef,
  RosterOutputUnit,
  RosterTemplateV2,
  RowFilterDef,
  RowFilterOperator,
} from '../types';

// v372.2 (S1.6): タブ式 2 ステップ + 統合フィールド + 折りたたみ + バッジ + 動的絞り込み
// S2 で drag-drop, S3 で計算式, S4 で PDF, S5 で Excel

interface RosterDesignerProps {
  api: ApiClient;
}

// =============== 定数 ===============

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

const genId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const fmtValue = (raw: unknown, type: string, enumLabels?: Record<string, string>): string => {
  if (raw == null || raw === '') return '';
  const s = String(raw);
  if (type === 'enum' && enumLabels && enumLabels[s]) return enumLabels[s];
  return s;
};

const FORMAT_OPTIONS_BY_TYPE: Record<string, Array<{ value: string; label: string }>> = {
  string: [{ value: '', label: '標準' }],
  enum: [{ value: '', label: '標準' }],
  boolean: [{ value: '', label: '標準' }],
  date: [
    { value: '', label: '標準' },
    { value: 'yyyy-MM-dd', label: '2026-05-20' },
    { value: 'yyyy/MM/dd', label: '2026/05/20' },
    { value: 'ja-date', label: '2026年5月20日' },
  ],
  number: [
    { value: '', label: '標準' },
    { value: '#,##0', label: '1,234' },
    { value: 'currency-jpy', label: '1,234円' },
  ],
};

const formatDateValue = (raw: string, format?: string): string => {
  if (!raw || !format) return raw;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  if (format === 'yyyy-MM-dd') return `${y}-${m}-${day}`;
  if (format === 'yyyy/MM/dd') return `${y}/${m}/${day}`;
  if (format === 'ja-date') return `${y}年${d.getMonth() + 1}月${d.getDate()}日`;
  return raw;
};

const formatNumberValue = (raw: string, format?: string): string => {
  if (!raw || !format) return raw;
  const n = Number(String(raw).replace(/,/g, ''));
  if (!Number.isFinite(n)) return raw;
  if (format === '#,##0') return Math.round(n).toLocaleString('ja-JP');
  if (format === 'currency-jpy') return `${Math.round(n).toLocaleString('ja-JP')}円`;
  return raw;
};

const formatRosterValue = (raw: string, type: string, format?: string): string => {
  if (type === 'date') return formatDateValue(raw, format);
  if (type === 'number') return formatNumberValue(raw, format);
  return raw;
};

const columnWidthStyle = (col: RosterColumnDef): React.CSSProperties => {
  const width = Number(col.width || 0);
  if (!Number.isFinite(width) || width <= 0) return {};
  return { width, minWidth: width };
};

// v372.3: 演算子セットを最小化。冗長な notXxx は廃止し「否定」トグル（negate）で表現する。
// 後方互換: legacy notXxx は normalizeColumnFilter_() で読込時に変換。
const OPERATORS_BY_TYPE: Record<string, Array<{ value: RowFilterOperator; label: string; valueKind: 'none' | 'single' | 'double' | 'multi'; canNegate: boolean }>> = {
  string: [
    { value: 'contains',   label: '含む',     valueKind: 'single', canNegate: true  },
    { value: 'equals',     label: '等しい',   valueKind: 'single', canNegate: true  },
    { value: 'startsWith', label: '始まる',   valueKind: 'single', canNegate: true  },
    { value: 'endsWith',   label: '終わる',   valueKind: 'single', canNegate: true  },
    { value: 'isEmpty',    label: '空',       valueKind: 'none',   canNegate: false },
    { value: 'isNotEmpty', label: '空でない', valueKind: 'none',   canNegate: false },
  ],
  number: [
    { value: 'equals',     label: '=',        valueKind: 'single', canNegate: true  },
    { value: 'gt',         label: '>',        valueKind: 'single', canNegate: true  },
    { value: 'lt',         label: '<',        valueKind: 'single', canNegate: true  },
    { value: 'gte',        label: '≥',        valueKind: 'single', canNegate: true  },
    { value: 'lte',        label: '≤',        valueKind: 'single', canNegate: true  },
    { value: 'between',    label: '範囲',     valueKind: 'double', canNegate: true  },
    { value: 'isEmpty',    label: '空',       valueKind: 'none',   canNegate: false },
    { value: 'isNotEmpty', label: '空でない', valueKind: 'none',   canNegate: false },
  ],
  date: [
    { value: 'equals',     label: '等しい',   valueKind: 'single', canNegate: true  },
    { value: 'before',     label: '以前',     valueKind: 'single', canNegate: true  },
    { value: 'after',      label: '以降',     valueKind: 'single', canNegate: true  },
    { value: 'between',    label: '期間',     valueKind: 'double', canNegate: true  },
    { value: 'isEmpty',    label: '空',       valueKind: 'none',   canNegate: false },
    { value: 'isNotEmpty', label: '空でない', valueKind: 'none',   canNegate: false },
  ],
  enum: [
    { value: 'in',         label: 'いずれか', valueKind: 'multi',  canNegate: true  },
    { value: 'isEmpty',    label: '空',       valueKind: 'none',   canNegate: false },
    { value: 'isNotEmpty', label: '空でない', valueKind: 'none',   canNegate: false },
  ],
  boolean: [
    { value: 'equals',     label: '等しい',   valueKind: 'single', canNegate: true  },
  ],
};

// 後方互換: 旧 notXxx 演算子を { operator: <肯定形>, negate: true } に変換
const normalizeColumnFilter_ = (rf: RowFilterDef | undefined): RowFilterDef | undefined => {
  if (!rf || !rf.operator) return rf;
  const map: Record<string, RowFilterOperator> = {
    notContains: 'contains',
    notEquals:   'equals',
    notIn:       'in',
  };
  if (map[rf.operator as string]) {
    return { ...rf, operator: map[rf.operator as string], negate: true };
  }
  return rf;
};
const normalizeTemplate_ = (t: RosterTemplateV2): RosterTemplateV2 => ({
  ...t,
  columns: (t.columns || []).map((c) => c.rowFilter ? { ...c, rowFilter: normalizeColumnFilter_(c.rowFilter) } : c),
});
const operatorsFor = (type?: string) => OPERATORS_BY_TYPE[type || 'string'] || OPERATORS_BY_TYPE.string;
const operatorLabel = (op?: RowFilterOperator): string => {
  for (const list of Object.values(OPERATORS_BY_TYPE)) {
    const f = list.find((o) => o.value === op);
    if (f) return f.label;
  }
  // legacy fallback
  if (op === 'notContains') return '含まない';
  if (op === 'notEquals') return '等しくない';
  if (op === 'notIn') return '除外';
  return String(op || '');
};
const operatorValueKind = (type: string, op: RowFilterOperator): 'none' | 'single' | 'double' | 'multi' => {
  const list = operatorsFor(type);
  return list.find((o) => o.value === op)?.valueKind ?? 'single';
};
const operatorCanNegate = (type: string, op: RowFilterOperator): boolean => {
  const list = operatorsFor(type);
  return list.find((o) => o.value === op)?.canNegate ?? false;
};

// グループ表示順とラベル
const GROUP_ORDER: RosterFieldGroup[] = ['auto', 'member', 'individual', 'office', 'staff', 'fee', 'computed'];
const GROUP_META: Record<RosterFieldGroup, { label: string; icon: string; description: string }> = {
  auto:       { label: '⭐ 統合（全対応）',      icon: '⭐', description: '会員・職員どちらの行でも自動的に適切な値が入る統合フィールド' },
  member:     { label: '🟢 会員 基本情報',       icon: '🟢', description: '個人/賛助/事業所会員すべてに共通する基本情報' },
  individual: { label: '🟢 個人/賛助 個別情報',  icon: '🟢', description: '個人会員・賛助会員に限定された情報（事業所会員では空）' },
  office:     { label: '🟠 事業所（勤務先）',    icon: '🟠', description: '事業所会員の勤務先情報（職員行も親会員から継承）' },
  staff:      { label: '🔵 事業所職員',          icon: '🔵', description: 'STAFF/MIXED モードでのみ値が入る職員固有情報' },
  fee:        { label: '💰 年会費',              icon: '💰', description: '選択年度の年会費納入状況' },
  computed:   { label: '🧮 計算済み',            icon: '🧮', description: '結合・派生フィールド' },
};

// バッジ表示用: applicableUnits からのラベル
const renderEntityBadges = (def: RosterFieldDef): string[] => {
  const units = def.applicableUnits || [];
  const badges: string[] = [];
  if (units.includes('MEMBER')) badges.push('会員');
  if (units.includes('STAFF')) badges.push('職員');
  return badges;
};

const btnCls =
  'rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]';
const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

// =============== コンポーネント ===============

const SortableColumnShell: React.FC<{
  id: string;
  children: (args: {
    attributes: Record<string, unknown>;
    listeners: Record<string, unknown> | undefined;
    setActivatorNodeRef: (element: HTMLElement | null) => void;
    isDragging: boolean;
  }) => React.ReactNode;
}> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.72 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners, setActivatorNodeRef, isDragging })}
    </div>
  );
};

const RosterDesigner: React.FC<RosterDesignerProps> = ({ api }) => {
  // タブ
  const [activeTab, setActiveTab] = useState<'design' | 'export'>('design');

  // 辞書とテンプレ
  const [dictionary, setDictionary] = useState<RosterFieldDef[]>([]);
  const [templates, setTemplates] = useState<RosterTemplateV2[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [working, setWorking] = useState<RosterTemplateV2>(emptyTemplate);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  // フィルタ
  const currentFY = useMemo(calcCurrentFY, []);
  const [filterTypes, setFilterTypes] = useState<string[]>(['INDIVIDUAL', 'BUSINESS', 'SUPPORT']);
  const [filterStatus, setFilterStatus] = useState('ACTIVE');
  const [filterYear, setFilterYear] = useState(currentFY);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // データ
  const [rows, setRows] = useState<RosterDesignerRow[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string> | null>(null);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  // フィールド検索
  const [fieldSearch, setFieldSearch] = useState('');

  // グループの折りたたみ状態
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // 初回ロード
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
          setWorking(normalizeTemplate_(JSON.parse(JSON.stringify(def))));
        } else {
          const init: RosterTemplateV2 = {
            ...emptyTemplate(),
            id: genId(),
            name: '新規テンプレート',
            columns: [
              { id: genId(), source: 'field', fieldKey: 'autoName',              label: '氏名',     align: 'left' },
              { id: genId(), source: 'field', fieldKey: 'autoCareManagerNumber', label: 'CM番号',   align: 'left' },
              { id: genId(), source: 'field', fieldKey: 'officeName',            label: '事業所名', align: 'left' },
              { id: genId(), source: 'field', fieldKey: 'annualFeeStatus',       label: '年会費',   align: 'center' },
            ],
          };
          setWorking(init);
        }
      } catch (e) {
        setBootError(e instanceof Error ? e.message : '初期データの読み込みに失敗しました。');
      }
    })();
  }, [api]);

  // 出力単位変更時にグループ初期展開状態を再計算
  useEffect(() => {
    if (dictionary.length === 0) return;
    const unit = working.outputUnit ?? 'MEMBER';
    const next: Record<string, boolean> = {};
    GROUP_ORDER.forEach((g) => {
      // 出力単位に該当するフィールドを含むグループは展開、それ以外は折りたたみ
      const hasApplicable = dictionary.some(
        (d) => d.group === g && (d.applicableUnits || []).includes(unit),
      );
      // auto は常に展開
      next[g] = g === 'auto' ? false : !hasApplicable;
    });
    setCollapsedGroups(next);
  }, [working.outputUnit, dictionary]);

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

  // --- 列フィルタ評価 ---
  const dictByKey = useMemo(() => {
    const map = new Map<string, RosterFieldDef>();
    dictionary.forEach((d) => map.set(d.key, d));
    return map;
  }, [dictionary]);

  const evalRowFilter = useCallback((row: RosterDesignerRow, col: RosterColumnDef): boolean => {
    const rf = col.rowFilter;
    if (!rf || !rf.operator) return true;
    const fdef = col.fieldKey ? dictByKey.get(col.fieldKey) : null;
    const type = fdef?.type || 'string';
    const valueKind = operatorValueKind(type, rf.operator);
    if (valueKind === 'single' && !rf.value) return true;
    if (valueKind === 'double' && !rf.value && !rf.value2) return true;
    if (valueKind === 'multi' && (!rf.values || rf.values.length === 0)) return true;
    const raw = col.fieldKey ? row[col.fieldKey] : undefined;
    const sval = raw == null ? '' : String(raw);
    let result: boolean;
    switch (rf.operator) {
      case 'isEmpty': result = sval === ''; break;
      case 'isNotEmpty': result = sval !== ''; break;
      case 'contains': result = sval.indexOf(String(rf.value || '')) >= 0; break;
      case 'notContains': result = sval.indexOf(String(rf.value || '')) < 0; break; // legacy
      case 'equals': result = sval === String(rf.value || ''); break;
      case 'notEquals': result = sval !== String(rf.value || ''); break; // legacy
      case 'startsWith': result = sval.indexOf(String(rf.value || '')) === 0; break;
      case 'endsWith': result = sval.length >= String(rf.value || '').length && sval.lastIndexOf(String(rf.value || '')) === sval.length - String(rf.value || '').length; break;
      case 'gt': result = Number(sval) > Number(rf.value); break;
      case 'lt': result = Number(sval) < Number(rf.value); break;
      case 'gte': result = Number(sval) >= Number(rf.value); break;
      case 'lte': result = Number(sval) <= Number(rf.value); break;
      case 'between': {
        const n = type === 'number' ? Number(sval) : sval;
        const lo = type === 'number' ? Number(rf.value) : String(rf.value || '');
        const hi = type === 'number' ? Number(rf.value2) : String(rf.value2 || '');
        result = (n as number) >= (lo as number) && (n as number) <= (hi as number);
        break;
      }
      case 'in': result = Array.isArray(rf.values) && rf.values.indexOf(sval) >= 0; break;
      case 'notIn': result = Array.isArray(rf.values) && rf.values.indexOf(sval) < 0; break; // legacy
      case 'before': result = sval !== '' && sval <= String(rf.value || ''); break;
      case 'after': result = sval !== '' && sval >= String(rf.value || ''); break;
      default: result = true;
    }
    // v372.3: 否定トグルが ON なら結果を反転（canNegate=false の演算子では効果なし）
    if (rf.negate && operatorCanNegate(type, rf.operator)) {
      return !result;
    }
    return result;
  }, [dictByKey]);

  const filteredRows = useMemo(() => {
    if (!working.columns.some((c) => c.rowFilter && c.rowFilter.operator)) return rows;
    return rows.filter((r) => working.columns.every((c) => evalRowFilter(r, c)));
  }, [rows, working.columns, evalRowFilter]);

  const activeFilters = useMemo(() => {
    return working.columns
      .filter((c) => c.rowFilter && c.rowFilter.operator)
      .map((c) => {
        const rf = c.rowFilter!;
        const fdef = c.fieldKey ? dictByKey.get(c.fieldKey) : null;
        const type = fdef?.type || 'string';
        const valueKind = operatorValueKind(type, rf.operator);
        const canNegate = operatorCanNegate(type, rf.operator);
        let valStr = '';
        if (valueKind === 'single') {
          // enum なら表示用ラベル
          if (type === 'enum' && fdef?.enumLabels && rf.value && fdef.enumLabels[rf.value]) valStr = fdef.enumLabels[rf.value];
          else valStr = rf.value || '';
        } else if (valueKind === 'double') {
          valStr = `${rf.value || ''}〜${rf.value2 || ''}`;
        } else if (valueKind === 'multi') {
          const labels = (rf.values || []).map((v) => (fdef?.enumLabels && fdef.enumLabels[v]) || v);
          valStr = labels.join(',');
        }
        const negate = rf.negate && canNegate;
        return { colId: c.id, label: c.label, opLabel: operatorLabel(rf.operator), valStr, negate };
      });
  }, [working.columns, dictByKey]);

  const isSelected = (id: string) =>
    selectedIds === null ? !excludedIds.has(id) : selectedIds.has(id);
  const effectiveRows = useMemo(() => {
    return filteredRows.filter((_, i) => {
      const id = String(filteredRows[i].memberId ?? '') + ':' + String(filteredRows[i].staffId ?? '');
      return selectedIds === null ? !excludedIds.has(id) : selectedIds.has(id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredRows, selectedIds, excludedIds]);

  // --- フィールド絞り込み（出力単位 + 検索） ---
  const visibleDictionary = useMemo(() => {
    const unit = working.outputUnit ?? 'MEMBER';
    const q = fieldSearch.trim().toLowerCase();
    return dictionary.filter((d) => {
      const units = d.applicableUnits || [];
      // MIXED モードはどちらに値があるフィールドも表示
      if (unit === 'MIXED') {
        // 表示OK（全件）
      } else {
        if (units.length > 0 && !units.includes(unit)) return false;
      }
      if (q) {
        return d.label.toLowerCase().includes(q) || d.key.toLowerCase().includes(q);
      }
      return true;
    });
  }, [dictionary, working.outputUnit, fieldSearch]);

  const dictionaryByGroup = useMemo(() => {
    const map = new Map<string, RosterFieldDef[]>();
    visibleDictionary.forEach((d) => {
      const arr = map.get(d.group) ?? [];
      arr.push(d);
      map.set(d.group, arr);
    });
    return map;
  }, [visibleDictionary]);

  const usedKeys = useMemo(() => {
    const s = new Set<string>();
    working.columns.forEach((c) => { if (c.source === 'field' && c.fieldKey) s.add(c.fieldKey); });
    return s;
  }, [working.columns]);

  // 列ビルダー操作
  const addFieldColumn = (field: RosterFieldDef) => {
    if (usedKeys.has(field.key)) return;
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
  const moveColumn = (id: string, dir: -1 | 1) => {
    setWorking((w) => {
      const idx = w.columns.findIndex((c) => c.id === id);
      if (idx < 0) return w;
      const ni = idx + dir;
      if (ni < 0 || ni >= w.columns.length) return w;
      const next = w.columns.slice();
      [next[idx], next[ni]] = [next[ni], next[idx]];
      return { ...w, columns: next };
    });
    setDirty(true);
  };
  const columnIds = useMemo(() => working.columns.map((c) => c.id), [working.columns]);
  const handleColumnDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setWorking((w) => {
      const oldIndex = w.columns.findIndex((c) => c.id === active.id);
      const newIndex = w.columns.findIndex((c) => c.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return w;
      return { ...w, columns: arrayMove(w.columns, oldIndex, newIndex) };
    });
    setDirty(true);
  }, []);
  const updateColumn = (id: string, patch: Partial<RosterColumnDef>) => {
    setWorking((w) => ({ ...w, columns: w.columns.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
    setDirty(true);
  };

  // テンプレ操作
  const selectTemplate = (id: string) => {
    if (dirty && !confirm('未保存の変更があります。破棄して切り替えますか？')) return;
    setSelectedTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (t) setWorking(normalizeTemplate_(JSON.parse(JSON.stringify(t))));
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
    } finally { setSaving(false); }
  };
  const duplicateTemplate = async () => {
    if (!selectedTemplateId) { alert('複製対象を選択してください。'); return; }
    if (dirty && !confirm('未保存の変更があります。破棄して複製しますか？')) return;
    try {
      const r = await api.duplicateRosterTemplateV2(selectedTemplateId);
      setTemplates(r.templates);
      const newest = r.templates[r.templates.length - 1];
      setSelectedTemplateId(newest.id);
      setWorking(normalizeTemplate_(JSON.parse(JSON.stringify(newest))));
      setDirty(false);
    } catch (e) { alert(e instanceof Error ? e.message : '複製に失敗しました。'); }
  };
  const deleteTemplate = async () => {
    if (!selectedTemplateId) return;
    if (!confirm(`テンプレート「${working.name}」を削除しますか？`)) return;
    try {
      const r = await api.deleteRosterTemplateV2(selectedTemplateId);
      setTemplates(r.templates);
      const def = r.templates.find((t) => t.isDefault) ?? r.templates[0];
      if (def) {
        setSelectedTemplateId(def.id);
        setWorking(normalizeTemplate_(JSON.parse(JSON.stringify(def))));
      } else newTemplate();
      setDirty(false);
    } catch (e) { alert(e instanceof Error ? e.message : '削除に失敗しました。'); }
  };

  // 値抽出
  const valueFor = useCallback((row: RosterDesignerRow, col: RosterColumnDef): string => {
    if (col.source === 'literal') return col.literal ?? '';
    if (col.source === 'field' && col.fieldKey) {
      const fdef = dictByKey.get(col.fieldKey);
      const raw = row[col.fieldKey];
      const type = fdef?.type || 'string';
      return formatRosterValue(fmtValue(raw, type, fdef?.enumLabels), type, col.format);
    }
    return '';
  }, [dictByKey]);

  // 件数表示
  const recordCountText = useMemo(() => {
    if (!working.layout?.showRecordCount) return '';
    const fmt = working.layout.recordCountFormat || '出力対象: {{count}} 名';
    return fmt.replace(/\{\{count\}\}/g, String(effectiveRows.length));
  }, [working.layout, effectiveRows.length]);

  // CSV 出力
  const exportCsv = () => {
    if (working.columns.length === 0) { alert('列を1つ以上追加してください。'); return; }
    const lines: string[] = [];
    const pos = working.layout?.recordCountPosition || 'header';
    if (working.layout?.showRecordCount && (pos === 'header' || pos === 'both')) {
      lines.push(`# ${recordCountText}`);
    }
    lines.push(working.columns.map((c) => csvEscape(c.label)).join(','));
    effectiveRows.forEach((r) => {
      lines.push(working.columns.map((c) => csvEscape(valueFor(r, c))).join(','));
    });
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
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectAll = () => { setSelectedIds(null); setExcludedIds(new Set()); };
  const deselectAll = () => { setSelectedIds(new Set()); setExcludedIds(new Set()); };
  const rowKey = (r: RosterDesignerRow): string => String(r.memberId ?? '') + ':' + String(r.staffId ?? '');
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
  const toggleGroup = (g: string) => setCollapsedGroups((prev) => ({ ...prev, [g]: !prev[g] }));

  // ============================ RENDER ============================
  if (bootError) {
    return (
      <div className="p-6">
        <p className="rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{bootError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-900">名簿出力（Visual Designer）</h2>
        <p className="text-sm text-slate-600">
          <strong>v372.2 S1.6</strong>: タブで設計と出力を分離 / 出力単位（会員・職員・混合）/ 統合フィールドで自動切替 / 列フィルタ
        </p>
      </header>

      {/* タブヘッダー */}
      <div className="flex border-b border-slate-200" role="tablist">
        <button
          role="tab" aria-selected={activeTab === 'design'}
          onClick={() => setActiveTab('design')}
          className={`px-5 py-2.5 text-sm font-semibold border-b-2 min-h-[44px] ${
            activeTab === 'design' ? 'border-primary-600 text-primary-700 bg-primary-50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}>
          ① テンプレ設計
        </button>
        <button
          role="tab" aria-selected={activeTab === 'export'}
          onClick={() => setActiveTab('export')}
          className={`px-5 py-2.5 text-sm font-semibold border-b-2 min-h-[44px] ${
            activeTab === 'export' ? 'border-primary-600 text-primary-700 bg-primary-50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}>
          ② プレビュー & 出力
        </button>
        <div className="ml-auto flex items-center gap-2 pr-2">
          <span className="text-xs text-slate-500">
            {working.name || '(無題)'} {dirty && <span className="text-primary-600 font-semibold">●未保存</span>}
          </span>
          <button
            className={`${btnCls} ${dirty ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
            onClick={saveTemplate} disabled={saving || !dirty}>
            {saving ? '保存中…' : dirty ? '💾 保存' : '✓ 保存済み'}
          </button>
        </div>
      </div>

      {/* ========== タブ ①: テンプレ設計 ========== */}
      {activeTab === 'design' && (
        <div className="space-y-5">
          {/* テンプレ選択 */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <h3 className="text-base font-semibold text-slate-700">テンプレート</h3>
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

          {/* 出力単位 */}
          <section className="rounded-xl border-2 border-primary-200 bg-primary-50 p-5 space-y-3">
            <h3 className="text-base font-semibold text-primary-800">出力単位（何を 1 行として出力するか）</h3>
            <p className="text-xs text-primary-700">これを変えると、利用可能フィールドが自動的に切り替わります。</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([
                { v: 'MEMBER' as const, label: '会員単位', desc: '個人/事業所/賛助 各 1 行' },
                { v: 'STAFF'  as const, label: '事業所職員単位', desc: '事業所職員 1 名ごと 1 行' },
                { v: 'MIXED'  as const, label: '混合', desc: '個人/賛助 + 事業所職員' },
              ]).map(({ v, label, desc }) => (
                <label key={v} className={`flex flex-col gap-1 p-3 rounded-lg border-2 cursor-pointer min-h-[44px] ${
                  (working.outputUnit ?? 'MEMBER') === v ? 'border-primary-500 bg-white' : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="outputUnit" value={v}
                      checked={(working.outputUnit ?? 'MEMBER') === v}
                      onChange={() => { setWorking((w) => ({ ...w, outputUnit: v })); setDirty(true); }} />
                    <span className="font-semibold text-slate-800">{label}</span>
                  </div>
                  <span className="text-xs text-slate-500 pl-6">{desc}</span>
                </label>
              ))}
            </div>
          </section>

          {/* 列ビルダー */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-slate-700">列ビルダー</h3>
              <span className="text-xs text-slate-500">{visibleDictionary.length} 個のフィールドから選択中（{working.columns.length} 列）</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 利用可能フィールド (折りたたみ式 + 検索 + バッジ) */}
              <div className="rounded border border-slate-200 bg-slate-50 p-3 space-y-2 max-h-[600px] overflow-y-auto">
                <div className="sticky top-0 bg-slate-50 pb-2 space-y-2 -mx-3 px-3 z-10">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">利用可能フィールド</p>
                  <input
                    type="search"
                    value={fieldSearch}
                    onChange={(e) => setFieldSearch(e.target.value)}
                    placeholder="🔍 フィールドを検索…"
                    className="w-full rounded border border-slate-300 bg-white px-3 py-1.5 text-sm" />
                </div>
                {GROUP_ORDER.map((g) => {
                  const items = dictionaryByGroup.get(g) || [];
                  if (items.length === 0) return null;
                  const meta = GROUP_META[g];
                  const collapsed = collapsedGroups[g] ?? false;
                  return (
                    <div key={g} className="rounded border border-slate-200 bg-white">
                      <button type="button" onClick={() => toggleGroup(g)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px]"
                        aria-expanded={!collapsed}>
                        <span className="text-base">{collapsed ? '▶' : '▼'}</span>
                        <span className="flex-1">{meta.label}</span>
                        <span className="text-xs text-slate-400 font-normal">{items.length}</span>
                      </button>
                      {!collapsed && (
                        <div className="px-2 pb-2 space-y-1">
                          <p className="text-[10px] text-slate-400 px-1">{meta.description}</p>
                          {items.map((f) => {
                            const used = usedKeys.has(f.key);
                            const badges = renderEntityBadges(f);
                            return (
                              <button key={f.key} type="button"
                                onClick={() => addFieldColumn(f)}
                                disabled={used}
                                className={`w-full flex items-start gap-2 rounded border px-2 py-1.5 text-sm text-left min-h-[44px] ${
                                  used
                                    ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'border-slate-200 bg-white hover:border-primary-400 hover:bg-primary-50 text-slate-800'
                                }`}
                                title={f.description || `例: ${f.sample}`}
                              >
                                <span className="flex-1 truncate">{f.label}</span>
                                <span className="flex shrink-0 gap-0.5 mt-0.5">
                                  {badges.map((b) => (
                                    <span key={b} className={`text-[9px] px-1 py-0.5 rounded ${
                                      b === '会員' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'
                                    }`}>{b}</span>
                                  ))}
                                </span>
                                <span className="shrink-0 text-xs text-slate-400">{used ? '✓' : '+'}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 出力列 */}
              <div className="rounded border border-slate-200 bg-white p-3 space-y-2 max-h-[600px] overflow-y-auto">
                <p className="sticky top-0 bg-white pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 z-10">
                  出力列（{working.columns.length} 列）
                </p>
                {working.columns.length === 0 && (
                  <p className="rounded border border-dashed border-slate-300 bg-slate-50 px-3 py-8 text-center text-sm text-slate-400">
                    ← 左から列を追加してください
                  </p>
                )}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleColumnDragEnd}>
                  <SortableContext items={columnIds} strategy={verticalListSortingStrategy}>
                    {working.columns.map((col, idx) => {
                      const fdef = col.fieldKey ? dictByKey.get(col.fieldKey) : null;
                      const fieldType = fdef?.type || 'string';
                      const ops = operatorsFor(fieldType);
                      const rf = col.rowFilter;
                      const valKind = rf?.operator ? operatorValueKind(fieldType, rf.operator) : 'single';
                      const enumOpts = fdef?.enumLabels ? Object.entries(fdef.enumLabels) : [];
                      return (
                        <SortableColumnShell key={col.id} id={col.id}>
                          {({ attributes, listeners, setActivatorNodeRef, isDragging }) => (
                    <div className={`rounded border p-2 space-y-2 ${isDragging ? 'border-primary-300 bg-primary-50 shadow-lg' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 w-6 text-center shrink-0">{idx + 1}</span>
                        <button
                          type="button"
                          ref={setActivatorNodeRef}
                          {...attributes}
                          {...listeners}
                          className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          aria-label={`${col.label || '列'}をドラッグして並び替え`}
                          title="ドラッグまたはキーボードで並び替え">
                          ↕
                        </button>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500">
                        <label className="flex items-center gap-2">
                          <span className="shrink-0">列幅:</span>
                          <input
                            type="number"
                            min={60}
                            max={320}
                            step={10}
                            className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                            value={col.width ?? ''}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const width = raw === '' ? undefined : Math.min(320, Math.max(60, Number(raw)));
                              updateColumn(col.id, { width });
                            }}
                            placeholder="自動" />
                          <span className="shrink-0 text-slate-400">px</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <span className="shrink-0">書式:</span>
                          <select
                            className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                            value={col.format || ''}
                            onChange={(e) => updateColumn(col.id, { format: e.target.value || undefined })}>
                            {(FORMAT_OPTIONS_BY_TYPE[fieldType] || FORMAT_OPTIONS_BY_TYPE.string).map((opt) => (
                              <option key={opt.value || 'default'} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </label>
                      </div>
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
                        {/* v372.3: 否定トグル */}
                        {rf?.operator && operatorCanNegate(fieldType, rf.operator) && (
                          <button type="button"
                            onClick={() => updateColumn(col.id, { rowFilter: { ...rf, negate: !rf.negate } as RowFilterDef })}
                            className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors min-h-[28px] ${
                              rf.negate ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-300 bg-white text-slate-500 hover:bg-slate-50'
                            }`}
                            aria-label="否定切替"
                            aria-pressed={!!rf.negate}
                            title="クリックで条件を反転（NOT）">
                            <span>{rf.negate ? '🚫 否定' : '○ 否定'}</span>
                          </button>
                        )}
                        {/* 値入力 */}
                        {rf?.operator && valKind === 'single' && (
                          fieldType === 'enum' ? (
                            <select className="flex-1 min-w-[120px] rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
                              value={rf.value || ''}
                              onChange={(e) => updateColumn(col.id, { rowFilter: { ...rf, value: e.target.value } as RowFilterDef })}>
                              <option value="">選択</option>
                              {enumOpts.map(([k, lbl]) => <option key={k} value={k}>{lbl}</option>)}
                            </select>
                          ) : fdef?.valuePicker === 'year' ? (
                            <select className="flex-1 min-w-[100px] rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
                              value={rf.value || ''}
                              onChange={(e) => updateColumn(col.id, { rowFilter: { ...rf, value: e.target.value } as RowFilterDef })}>
                              <option value="">選択</option>
                              {(availableYears.length > 0 ? availableYears : [currentFY]).map((y) => (
                                <option key={y} value={String(y)}>{y}年度</option>
                              ))}
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
                          fdef?.valuePicker === 'year' ? (
                            <>
                              <select className="flex-1 min-w-[90px] rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
                                value={rf.value || ''}
                                onChange={(e) => updateColumn(col.id, { rowFilter: { ...rf, value: e.target.value } as RowFilterDef })}>
                                <option value="">下限</option>
                                {(availableYears.length > 0 ? availableYears : [currentFY]).map((y) => (
                                  <option key={y} value={String(y)}>{y}年度</option>
                                ))}
                              </select>
                              <span className="text-slate-400">〜</span>
                              <select className="flex-1 min-w-[90px] rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
                                value={rf.value2 || ''}
                                onChange={(e) => updateColumn(col.id, { rowFilter: { ...rf, value2: e.target.value } as RowFilterDef })}>
                                <option value="">上限</option>
                                {(availableYears.length > 0 ? availableYears : [currentFY]).map((y) => (
                                  <option key={y} value={String(y)}>{y}年度</option>
                                ))}
                              </select>
                            </>
                          ) : (
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
                          )
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
                          )}
                        </SortableColumnShell>
                      );
                    })}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </section>

          {/* レイアウト */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <h3 className="text-base font-semibold text-slate-700">レイアウト</h3>
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

          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 p-4">
            <p className="text-sm text-primary-800 flex-1">設計が完了したら「② プレビュー & 出力」タブで内容を確認して出力できます。</p>
            <button className={`${btnCls} bg-primary-600 text-white hover:bg-primary-700`}
              onClick={() => setActiveTab('export')}>② プレビュー & 出力 →</button>
          </div>
        </div>
      )}

      {/* ========== タブ ②: プレビュー & 出力 ========== */}
      {activeTab === 'export' && (
        <div className="space-y-5">
          {/* フィルタ */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-slate-700">出力対象フィルタ</h3>
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

          {/* 適用中フィルタ chip */}
          {activeFilters.length > 0 && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-amber-700 shrink-0">適用中の列フィルタ:</span>
                {activeFilters.map((af) => (
                  <span key={af.colId} className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-white px-2 py-0.5 text-xs text-amber-800">
                    <span className="font-medium">{af.label}</span>
                    {af.negate && <span className="text-rose-600 font-semibold">NOT</span>}
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
            </section>
          )}

          {/* プレビュー */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <h3 className="text-base font-semibold text-slate-700">プレビュー（先頭 5 件）</h3>
            {working.layout?.showRecordCount && recordCountText && (
              <p className="text-sm text-slate-600 font-medium">{recordCountText}</p>
            )}
            <div className="overflow-x-auto rounded border border-slate-200">
              {working.columns.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">設計タブで列を追加してください</p>
              ) : previewRows.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">該当データがありません</p>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      {working.columns.map((c) => (
                        <th key={c.id} className="border-b border-slate-200 px-3 py-2 text-left font-semibold"
                          style={{ textAlign: c.align || 'left', ...columnWidthStyle(c) }}>{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((r, i) => (
                      <tr key={rowKey(r) + ':' + i} className="even:bg-slate-50">
                        {working.columns.map((c) => (
                          <td key={c.id} className="border-b border-slate-100 px-3 py-1.5 text-slate-800"
                            style={{ textAlign: c.align || 'left', ...columnWidthStyle(c) }}>{valueFor(r, c)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <p className="text-xs text-slate-500">※ 先頭 5 件のみ表示。選択中 {effectiveRows.length} 件 / フィルタ後 {filteredRows.length} 件 / 全 {rows.length} 件</p>
          </section>

          {/* 対象一覧 */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-slate-700">出力対象（{effectiveRows.length} / {filteredRows.length} 件選択中）</h3>
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
                      <th className="px-3 py-2 text-left">区分</th>
                      <th className="px-3 py-2 text-left">勤務先</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r) => {
                      const id = rowKey(r);
                      const cat = String(r.outputCategory || '');
                      const catLabel = cat === 'STAFF' ? '事業所職員' : MEMBER_TYPE_LABELS[String(r.memberType)] || String(r.memberType);
                      const nameDisplay = cat === 'STAFF' ? (r.staffFullName || r.staffId) : r.displayName;
                      return (
                        <tr key={id} className="even:bg-slate-50">
                          <td className="px-3 py-1.5">
                            <input type="checkbox" checked={isSelected(id)} onChange={() => toggleOne(id)}
                              aria-label={`${nameDisplay}を選択`} />
                          </td>
                          <td className="px-3 py-1.5">{String(nameDisplay || '')}</td>
                          <td className="px-3 py-1.5">{catLabel}</td>
                          <td className="px-3 py-1.5 text-slate-600">{String(r.officeName || '')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* 出力ボタン */}
          <section className="rounded-xl border border-primary-200 bg-primary-50 p-5 flex flex-wrap items-center gap-3">
            <button className={`${btnCls} bg-emerald-600 text-white hover:bg-emerald-700`}
              onClick={exportCsv} disabled={working.columns.length === 0 || effectiveRows.length === 0}>
              CSV ダウンロード
            </button>
            <button className={`${btnCls} bg-slate-300 text-slate-500 cursor-not-allowed`} disabled title="S4 で実装予定">
              PDF 出力（S4）
            </button>
            <button className={`${btnCls} bg-slate-300 text-slate-500 cursor-not-allowed`} disabled title="S5 で実装予定">
              Excel ダウンロード（S5）
            </button>
            <span className="ml-auto text-xs text-slate-500">
              S2: drag-drop / S3: 計算式 / S4: PDF / S5: Excel
            </span>
          </section>
        </div>
      )}
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
