/**
 * 2026-10-13: 項目名のラベルが入力欄に結び付いているか（docs/306 V-01・V-02）。
 *
 * operator の原則:「紐づいていないことは意味のないこと。そして、画面上に表示されていると、紐づいていると勘違いをする」。
 * 2026-10-13 時点で、ラベル 458 のうち 281 が入力欄に結び付いておらず、入力欄 537 のうち 332 に名前が無かった
 * （スクリーンリーダーで項目名が読まれない）。全画面を直したので、ここで 0 を固定する。
 *
 * 構文解析（typescript）で .tsx を読み、次を数える:
 * - htmlFor も無く、中に入力欄も無い <label>（結び付いていないラベル）
 * - 名前の無い入力欄: aria-label / aria-labelledby が無く、同じファイルの htmlFor が id を指しておらず、<label> の中にも無い
 * - htmlFor が同じファイルのどの id も指していない（指し先のずれ）
 *
 * 静的には追えない結び付け方（部品の中で htmlFor={id} を付ける等）は、下の KNOWN_INDIRECT に件数と理由を書く。
 * 件数は増やさない（ラチェット）。新しい画面は 0 で作る。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// 静的解析では追えないが、実際には結び付いている入力欄（ファイル → 件数）
const KNOWN_INDIRECT: Record<string, { count: number; reason: string }> = {
  'src/components/OfficerManagement.tsx': { count: 8, reason: '部品 Field が <label htmlFor={id}> を描き、入力欄に同じ id を渡している' },
  'src/components/OfficerStatusCard.tsx': { count: 8, reason: '同上（Field 部品）' },
  'src/components/TrainingManagement.tsx': { count: 5, reason: 'renderFieldHeader が htmlFor={fieldId(key)}、入力欄が id={fieldId(\'…\')}' },
  'src/public-portal/components/ExternalApplyForm.tsx': { count: 1, reason: 'ボット対策の囮欄。display:none・aria-hidden で支援技術に出さない（名前を付けると読まれてしまう）' },
};

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...tsxFiles(p));
    else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

const CONTROLS = new Set(['input', 'select', 'textarea']);
type Jsx = ts.JsxElement | ts.JsxSelfClosingElement;
const isJsx = (n: ts.Node): n is Jsx => ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n);
const tagName = (n: Jsx) => (ts.isJsxElement(n) ? n.openingElement.tagName : n.tagName).getText();
const attrs = (n: Jsx) => (ts.isJsxElement(n) ? n.openingElement.attributes : n.attributes).properties;
const attrText = (n: Jsx, name: string): string | null => {
  const a = attrs(n).find((p) => ts.isJsxAttribute(p) && p.name.getText() === name) as ts.JsxAttribute | undefined;
  return a && a.initializer ? a.initializer.getText() : (a ? '' : null);
};

function scan(file: string) {
  const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const all: Jsx[] = [];
  (function visit(n: ts.Node) { if (isJsx(n)) all.push(n); ts.forEachChild(n, visit); })(sf);
  const ids = new Set(all.map((n) => attrText(n, 'id')).filter((v): v is string => !!v));
  const htmlFors = all.map((n) => attrText(n, 'htmlFor')).filter((v): v is string => !!v);
  const htmlForSet = new Set(htmlFors);
  const line = (n: ts.Node) => sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;
  const orphanLabels: number[] = [];
  const unnamedControls: number[] = [];
  // 部品が受け取った id をそのまま渡す htmlFor={id} と、関数で組み立てる htmlFor={fieldId(key)} は
  // 静的に指し先を決められないので対象外（入力欄側の件数は KNOWN_INDIRECT で押さえる）
  const dangling = htmlFors.filter((h) => !ids.has(h) && !/^\{\s*id\s*\}$/.test(h) && !/^\{\s*\w+\(/.test(h));
  for (const n of all) {
    const t = tagName(n);
    if (t === 'label' && attrText(n, 'htmlFor') === null) {
      let wraps = false;
      (function v(x: ts.Node) { if (x !== n && isJsx(x) && (CONTROLS.has(tagName(x)) || /^[A-Z]/.test(tagName(x)))) wraps = true; if (!wraps) ts.forEachChild(x, v); })(n);
      if (!wraps) orphanLabels.push(line(n));
    }
    if (CONTROLS.has(t)) {
      if (/hidden/.test(attrText(n, 'type') || '')) continue;
      if (attrText(n, 'aria-label') !== null || attrText(n, 'aria-labelledby') !== null) continue;
      const id = attrText(n, 'id');
      if (id && htmlForSet.has(id)) continue;
      let p: ts.Node | undefined = n.parent;
      let inLabel = false;
      while (p) { if (ts.isJsxElement(p) && tagName(p) === 'label') { inLabel = true; break; } p = p.parent; }
      if (!inLabel) unnamedControls.push(line(n));
    }
  }
  return { orphanLabels, unnamedControls, dangling };
}

const results = tsxFiles(path.join(ROOT, 'src')).map((f) => ({ rel: path.relative(ROOT, f).split(path.sep).join('/'), ...scan(f) }));

test('★結び付いていない項目名ラベルが 0', () => {
  const bad = results.filter((r) => r.orphanLabels.length > 0).map((r) => `${r.rel}: 行 ${r.orphanLabels.join(', ')}`);
  assert.deepEqual(bad, [], 'htmlFor も中の入力欄も無い <label> がある（画面に出ているのに入力欄と結び付いていない）');
});

test('★htmlFor が実在する id を指している', () => {
  const bad = results.filter((r) => r.dangling.length > 0).map((r) => `${r.rel}: ${r.dangling.join(', ')}`);
  assert.deepEqual(bad, [], 'ラベルの htmlFor が同じファイルのどの id も指していない');
});

test('★名前の無い入力欄が増えていない（既知の間接的な結び付けだけ）', () => {
  const bad: string[] = [];
  for (const r of results) {
    const allowed = KNOWN_INDIRECT[r.rel]?.count ?? 0;
    if (r.unnamedControls.length > allowed) {
      bad.push(`${r.rel}: ${r.unnamedControls.length} 件（許容 ${allowed}）行 ${r.unnamedControls.join(', ')}`);
    }
  }
  assert.deepEqual(bad, [], '項目名が読まれない入力欄が増えた。<label htmlFor> か aria-label で名前を付けること');
});

test('既知の間接的な結び付けの件数が実態と合っている（直したら許容を減らす）', () => {
  for (const [rel, { count }] of Object.entries(KNOWN_INDIRECT)) {
    const r = results.find((x) => x.rel === rel);
    assert.ok(r, `${rel} が見つからない`);
    assert.equal(r.unnamedControls.length, count, `${rel} の件数が変わった（減ったなら KNOWN_INDIRECT を下げる）`);
  }
});
