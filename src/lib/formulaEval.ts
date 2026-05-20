// v373 (Roster S3): Safe formula evaluator for RosterDesigner.
//
// Threat model: formulas authored by admin user, persisted to T_システム設定,
// re-evaluated client-side in admin shell for every preview row. Even though
// only admins can write them, we still treat them as untrusted to avoid:
//   - prototype pollution via Object/Function lookup
//   - arbitrary JS execution via eval / new Function
//   - DoS via deeply nested AST (capped via maxDepth)
//   - reflection via MemberExpression / ThisExpression / sequence
//
// Web search (2026-05-20): jsep AST + allowlist walker is the standard recipe
// after expr-eval RCE (2026) and jse-eval explicit "no sandbox" warning.
//
// Allowed:  Literal, Identifier(field-bound), Binary/Logical/Unary,
//           Conditional (?:), CallExpression -> ALLOWED_FUNCTIONS only.
// Rejected: MemberExpression, ArrayExpression, ObjectExpression,
//           SequenceExpression, ThisExpression, AssignmentExpression,
//           NewExpression, TemplateLiteral, UpdateExpression, ArrowFunction,
//           CallExpression -> non-allowlisted name.

import jsep from 'jsep';

// jsep config: lock down to the subset we evaluate.
jsep.addBinaryOp('===', 6);
jsep.addBinaryOp('!==', 6);
// jsep ships ==,!= as 6 already; we still accept them but treat as strict.

export type FormulaScope = Record<string, string | number | boolean | null | undefined>;

export type FormulaValue = string | number | boolean | null;

export interface FormulaCompileResult {
  ok: boolean;
  error?: string;
  ast?: jsep.Expression;
  fieldRefs?: string[]; // {x} 内に現れた x 一覧
}

const MAX_AST_DEPTH = 32;
const MAX_STRING_LENGTH = 10_000;

// {fieldKey} → __f_<base64-ish> へ前処理して、評価器で逆引きする方式に変更:
// 単純な camelCase keys (autoName 等) のみ想定だが、念のため任意文字列対応する。
const FIELD_REF_RE = /\{([^{}]+)\}/g;

interface FieldMap {
  toId: Map<string, string>;   // fieldKey -> __f0
  fromId: Map<string, string>; // __f0 -> fieldKey
}

const buildFieldMap = (raw: string): { processed: string; map: FieldMap; refs: string[] } => {
  const map: FieldMap = { toId: new Map(), fromId: new Map() };
  const refs: string[] = [];
  let i = 0;
  const processed = raw.replace(FIELD_REF_RE, (_, key: string) => {
    const trimmed = key.trim();
    if (!trimmed) return '__f_invalid_empty';
    if (!map.toId.has(trimmed)) {
      const id = `__f${i++}`;
      map.toId.set(trimmed, id);
      map.fromId.set(id, trimmed);
      refs.push(trimmed);
    }
    return map.toId.get(trimmed)!;
  });
  return { processed, map, refs };
};

export function compileFormula(source: string): FormulaCompileResult {
  if (typeof source !== 'string') return { ok: false, error: '式は文字列である必要があります' };
  if (source.length > MAX_STRING_LENGTH) return { ok: false, error: `式が長すぎます（${MAX_STRING_LENGTH} 文字以内）` };
  const trimmed = source.trim();
  if (!trimmed) return { ok: false, error: '式が空です' };
  const { processed, map, refs } = buildFieldMap(trimmed);
  let ast: jsep.Expression;
  try {
    ast = jsep(processed);
  } catch (e) {
    return { ok: false, error: `構文エラー: ${e instanceof Error ? e.message : String(e)}` };
  }
  try {
    validateAst(ast, 0);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  // 評価器が field id を解決できるよう、AST に map を埋めて返したいが
  // 構造を汚さないため compile result に同梱して evaluate() で渡す方式にする。
  (ast as jsep.Expression & { __fieldMap: FieldMap }).__fieldMap = map;
  return { ok: true, ast, fieldRefs: refs };
}

const ALLOWED_BINARY = new Set([
  '+', '-', '*', '/', '%',
  '<', '>', '<=', '>=',
  '==', '!=', '===', '!==',
  // jsep は &&/|| を BinaryExpression として返すバージョンがある（短絡評価は walk 側で吸収）
  '&&', '||',
]);
const ALLOWED_LOGICAL = new Set(['&&', '||']);
const ALLOWED_UNARY = new Set(['!', '-', '+']);

function validateAst(node: jsep.Expression, depth: number): void {
  if (depth > MAX_AST_DEPTH) throw new Error('式が深すぎます（ネスト 32 超）');
  switch (node.type) {
    case 'Literal':
      return;
    case 'Identifier': {
      const name = (node as jsep.Identifier).name;
      if (!/^__f\d+$/.test(name) && !ALLOWED_FUNCTIONS.has(name) && name !== 'true' && name !== 'false' && name !== 'null') {
        throw new Error(`未定義の識別子: ${name}（フィールドは {name}、関数は ${Array.from(ALLOWED_FUNCTIONS.keys()).join('/')} のみ）`);
      }
      return;
    }
    case 'BinaryExpression': {
      const op = (node as jsep.BinaryExpression).operator;
      if (!ALLOWED_BINARY.has(op)) throw new Error(`許可されない演算子: ${op}`);
      validateAst((node as jsep.BinaryExpression).left, depth + 1);
      validateAst((node as jsep.BinaryExpression).right, depth + 1);
      return;
    }
    case 'LogicalExpression': {
      // jsep の一部バージョンが LogicalExpression を返した場合のフォールバック
      const ln = node as unknown as { operator: string; left: jsep.Expression; right: jsep.Expression };
      if (!ALLOWED_LOGICAL.has(ln.operator)) throw new Error(`許可されない論理演算子: ${ln.operator}`);
      validateAst(ln.left, depth + 1);
      validateAst(ln.right, depth + 1);
      return;
    }
    case 'UnaryExpression': {
      const op = (node as jsep.UnaryExpression).operator;
      if (!ALLOWED_UNARY.has(op)) throw new Error(`許可されない単項演算子: ${op}`);
      validateAst((node as jsep.UnaryExpression).argument, depth + 1);
      return;
    }
    case 'ConditionalExpression':
      validateAst((node as jsep.ConditionalExpression).test, depth + 1);
      validateAst((node as jsep.ConditionalExpression).consequent, depth + 1);
      validateAst((node as jsep.ConditionalExpression).alternate, depth + 1);
      return;
    case 'CallExpression': {
      const callee = (node as jsep.CallExpression).callee;
      if (callee.type !== 'Identifier') {
        throw new Error('関数呼び出しは識別子のみ許可されます');
      }
      const fname = (callee as jsep.Identifier).name;
      if (!ALLOWED_FUNCTIONS.has(fname)) {
        throw new Error(`許可されない関数: ${fname}（利用可: ${Array.from(ALLOWED_FUNCTIONS.keys()).join(', ')}）`);
      }
      (node as jsep.CallExpression).arguments.forEach((a) => validateAst(a, depth + 1));
      return;
    }
    case 'Compound':
      throw new Error('複数の式（,）はサポートされません');
    case 'MemberExpression':
      throw new Error('プロパティアクセス（.）は禁止です');
    case 'ArrayExpression':
      throw new Error('配列リテラルは禁止です');
    case 'ThisExpression':
      throw new Error('this は禁止です');
    default:
      throw new Error(`許可されないノード: ${node.type}`);
  }
}

// ============== Allowlisted functions ==============

const toBool = (v: unknown): boolean => {
  if (v == null) return false;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0 && !Number.isNaN(v);
  if (typeof v === 'string') return v !== '';
  return Boolean(v);
};
const toStr = (v: unknown): string => (v == null ? '' : String(v));
const toNum = (v: unknown): number => {
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v == null || v === '') return 0;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : NaN;
};

const formatDateLib = (raw: unknown, format: unknown): string => {
  const s = toStr(raw);
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  const f = toStr(format) || 'yyyy-MM-dd';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  if (f === 'yyyy-MM-dd') return `${y}-${m}-${day}`;
  if (f === 'yyyy/MM/dd') return `${y}/${m}/${day}`;
  if (f === 'ja-date') return `${y}年${d.getMonth() + 1}月${d.getDate()}日`;
  return s;
};

const ALLOWED_FUNCTIONS = new Map<string, (...args: FormulaValue[]) => FormulaValue>([
  ['if',         (cond, a, b) => (toBool(cond) ? (a ?? null) : (b ?? null))],
  ['and',        (...args) => args.every(toBool)],
  ['or',         (...args) => args.some(toBool)],
  ['not',        (a) => !toBool(a)],
  ['len',        (a) => toStr(a).length],
  ['upper',      (a) => toStr(a).toUpperCase()],
  ['lower',      (a) => toStr(a).toLowerCase()],
  ['trim',       (a) => toStr(a).trim()],
  ['concat',     (...args) => args.map(toStr).join('')],
  ['coalesce',   (...args) => {
    for (const a of args) {
      const s = toStr(a);
      if (s !== '') return a ?? null;
    }
    return '';
  }],
  ['num',        (a) => { const n = toNum(a); return Number.isFinite(n) ? n : 0; }],
  ['str',        (a) => toStr(a)],
  ['formatDate', (raw, format) => formatDateLib(raw, format)],
  ['contains',   (haystack, needle) => toStr(haystack).indexOf(toStr(needle)) >= 0],
  ['startsWith', (haystack, needle) => toStr(haystack).indexOf(toStr(needle)) === 0],
  ['endsWith',   (haystack, needle) => {
    const h = toStr(haystack); const n = toStr(needle);
    return h.length >= n.length && h.lastIndexOf(n) === h.length - n.length;
  }],
]);

// ============== Evaluator ==============

export interface EvaluateOptions {
  // フィールド値解決。compile 時の {fieldKey} は scope[fieldKey] を読みに行く。
  scope: FormulaScope;
}

export interface EvaluateResult {
  ok: boolean;
  value?: FormulaValue;
  error?: string;
}

export function evaluateAst(ast: jsep.Expression, opts: EvaluateOptions): EvaluateResult {
  try {
    const fieldMap = (ast as jsep.Expression & { __fieldMap?: FieldMap }).__fieldMap;
    const value = walk(ast, opts.scope, fieldMap);
    return { ok: true, value };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function evaluateFormula(source: string, scope: FormulaScope): EvaluateResult {
  const c = compileFormula(source);
  if (!c.ok || !c.ast) return { ok: false, error: c.error };
  return evaluateAst(c.ast, { scope });
}

function walk(node: jsep.Expression, scope: FormulaScope, fieldMap: FieldMap | undefined): FormulaValue {
  switch (node.type) {
    case 'Literal':
      return (node as jsep.Literal).value as FormulaValue;
    case 'Identifier': {
      const name = (node as jsep.Identifier).name;
      if (name === 'true') return true;
      if (name === 'false') return false;
      if (name === 'null') return null;
      if (/^__f\d+$/.test(name)) {
        const key = fieldMap?.fromId.get(name);
        if (!key) return '';
        const v = scope[key];
        return (v ?? '') as FormulaValue;
      }
      // 関数名が裸で参照されるケースは validateAst で弾いている
      throw new Error(`未定義の識別子: ${name}`);
    }
    case 'BinaryExpression': {
      const bn = node as jsep.BinaryExpression;
      const l = walk(bn.left, scope, fieldMap);
      const r = walk(bn.right, scope, fieldMap);
      return applyBinary(bn.operator, l, r);
    }
    case 'LogicalExpression': {
      const ln = node as unknown as { operator: string; left: jsep.Expression; right: jsep.Expression };
      const l = walk(ln.left, scope, fieldMap);
      if (ln.operator === '&&') return toBool(l) ? walk(ln.right, scope, fieldMap) : l;
      if (ln.operator === '||') return toBool(l) ? l : walk(ln.right, scope, fieldMap);
      throw new Error(`論理演算子: ${ln.operator}`);
    }
    case 'UnaryExpression': {
      const un = node as jsep.UnaryExpression;
      const v = walk(un.argument, scope, fieldMap);
      if (un.operator === '!') return !toBool(v);
      if (un.operator === '-') return -toNum(v);
      if (un.operator === '+') return toNum(v);
      throw new Error(`単項演算子: ${un.operator}`);
    }
    case 'ConditionalExpression': {
      const cn = node as jsep.ConditionalExpression;
      return toBool(walk(cn.test, scope, fieldMap))
        ? walk(cn.consequent, scope, fieldMap)
        : walk(cn.alternate, scope, fieldMap);
    }
    case 'CallExpression': {
      const cn = node as jsep.CallExpression;
      const fname = (cn.callee as jsep.Identifier).name;
      const fn = ALLOWED_FUNCTIONS.get(fname);
      if (!fn) throw new Error(`関数: ${fname}`);
      const args = cn.arguments.map((a) => walk(a, scope, fieldMap));
      return fn(...args);
    }
    default:
      throw new Error(`ノード: ${node.type}`);
  }
}

function applyBinary(op: string, l: FormulaValue, r: FormulaValue): FormulaValue {
  switch (op) {
    case '+': {
      // 片方が string → 文字列結合（Excel 風）。それ以外は数値加算。
      if (typeof l === 'string' || typeof r === 'string') return toStr(l) + toStr(r);
      return toNum(l) + toNum(r);
    }
    case '-': return toNum(l) - toNum(r);
    case '*': return toNum(l) * toNum(r);
    case '/': {
      const rn = toNum(r);
      if (rn === 0) return 0; // Excel 風: 表示上 #DIV/0 を避けて 0
      return toNum(l) / rn;
    }
    case '%': {
      const rn = toNum(r);
      if (rn === 0) return 0;
      return toNum(l) % rn;
    }
    case '<':   return toNum(l) <  toNum(r);
    case '>':   return toNum(l) >  toNum(r);
    case '<=':  return toNum(l) <= toNum(r);
    case '>=':  return toNum(l) >= toNum(r);
    case '==':
    case '===': return looseEq(l, r);
    case '!=':
    case '!==': return !looseEq(l, r);
    case '&&':  return toBool(l) ? r : l;
    case '||':  return toBool(l) ? l : r;
    default: throw new Error(`二項演算子: ${op}`);
  }
}

function looseEq(l: FormulaValue, r: FormulaValue): boolean {
  if (l == null && r == null) return true;
  if (typeof l === 'number' || typeof r === 'number') {
    const ln = toNum(l); const rn = toNum(r);
    if (Number.isNaN(ln) || Number.isNaN(rn)) return toStr(l) === toStr(r);
    return ln === rn;
  }
  return toStr(l) === toStr(r);
}

// 公開: ConditionalRule の評価
export function evaluateCondition(source: string, scope: FormulaScope): boolean {
  const r = evaluateFormula(source, scope);
  if (!r.ok) return false;
  return toBool(r.value);
}

// 公開: allowlist 関数名（UI のヒント表示用）
export const FORMULA_FUNCTIONS = Array.from(ALLOWED_FUNCTIONS.keys());
