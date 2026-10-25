/**
 * 2026-10-25 回帰テスト: 数字だけの文字列の列で先頭の 0 が消えない（docs/311 §5.4 の見つけたこと 2）。
 *
 * 本番確認で、振込口座の金融機関コード '0000' が数値の 0 になって返った。書式の無いセルへ数字だけの
 * 文字列を書くと、シートが数値に変える。列の書式を「書式なしテキスト」（'@'）にして守る。
 * 生成物（管理 split）から実際の関数を取り出し、シートの変換を真似た偽の表で動かす（ミラー実装にしない）。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractTableDefs } from './lib/er-model.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const admin = fs.readFileSync(path.join(ROOT, 'gas/admin/Code.gs'), 'utf8');

function block(src: string, head: string): string {
  const start = src.indexOf(head);
  assert.notEqual(start, -1, `${head} が見つからない`);
  const open = src.slice(start + head.length).search(/[{[]/) + start + head.length;
  const close = src[open] === '{' ? '}' : ']';
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === src[open]) depth += 1;
    else if (src[i] === close && --depth === 0) return src.slice(start, i + 1);
  }
  throw new Error(`${head} の終端が見つからない`);
}

// シートの変換を真似る: 書式が '@' でないセルへ数字だけの文字列を書くと数値になる
class FakeSheet {
  rows: unknown[][];
  formats: string[][];
  constructor(headers: string[], maxRows = 5) {
    this.rows = [headers.slice()];
    this.formats = Array.from({ length: maxRows }, () => headers.map(() => ''));
  }
  getLastRow() { return this.rows.length; }
  getLastColumn() { return this.rows[0].length; }
  getMaxRows() { return this.formats.length; }
  insertRowsAfter(_after: number, n: number) { for (let i = 0; i < n; i += 1) this.formats.push(this.rows[0].map(() => '')); }
  getRange(r: number, c: number, nr: number, nc: number) {
    const self = this;
    return {
      getValues: () => self.rows.slice(r - 1, r - 1 + nr).map((row) => row.slice(c - 1, c - 1 + nc)),
      clearDataValidations: () => {},
      setNumberFormat: (f: string) => { for (let i = 0; i < nr; i += 1) for (let j = 0; j < nc; j += 1) self.formats[r - 1 + i][c - 1 + j] = f; },
      setValues: (vals: unknown[][]) => vals.forEach((v, i) => {
        self.rows[r - 1 + i] = v.map((cell, j) => (self.formats[r - 1 + i][c - 1 + j] !== '@' && typeof cell === 'string' && /^\d+$/.test(cell) ? Number(cell) : cell));
      }),
    };
  }
}

function load(src: string) {
  const names = ['appendRowsByHeaders_', 'applyTextColumnFormats_'].filter((n) => src.includes(`function ${n}(`));
  const textVar = src.includes('var TEXT_FORMAT_COLUMNS_ = ') ? block(src, 'var TEXT_FORMAT_COLUMNS_ = ') + ';' : 'var TEXT_FORMAT_COLUMNS_ = {};';
  return new Function(`${textVar}\n${names.map((n) => block(src, `function ${n}(`)).join('\n')}\nreturn { TEXT_FORMAT_COLUMNS_, ${names.join(', ')} };`)();
}
const srv = load(admin);
const book = (sheets: Record<string, FakeSheet>) => ({ getSheetByName: (n: string) => sheets[n] || null });
const BANK = ['口座ID', '金融機関コード', '支店コード', '口座番号', '口座名義カナ'];

test('振込口座とそのアーカイブに書いた 0 始まりのコード・口座番号が、そのまま読み戻せる', () => {
  for (const name of ['T_振込口座', 'T_振込口座_archive']) {
    const sheet = new FakeSheet(BANK, 2); // 2 行しかない表（足した行は書式を持たない）
    srv.appendRowsByHeaders_(book({ [name]: sheet }), name, [{ 口座ID: 'acc-1', 金融機関コード: '0005', 支店コード: '012', 口座番号: '0123456', 口座名義カナ: 'テスト' }]);
    assert.deepEqual(sheet.rows[1], ['acc-1', '0005', '012', '0123456', 'テスト'], name);
  }
});

test('対象でない表・列には書式を付けない（数値の列は数値のまま）', () => {
  const sheet = new FakeSheet(['支払いID', '合計金額'], 3);
  srv.appendRowsByHeaders_(book({ T_支払い: sheet }), 'T_支払い', [{ 支払いID: 'P', 合計金額: '1000' }]);
  assert.deepEqual(sheet.formats.flat().filter(Boolean), []);
});

test('スキーマ整備で、対象の列を表とアーカイブの全行（見出しから最終行まで）書式なしテキストにする', () => {
  const live = new FakeSheet(BANK, 4);
  const archive = new FakeSheet(BANK, 3);
  const member = new FakeSheet(['会員ID', '携帯電話番号', '姓'], 3);
  srv.applyTextColumnFormats_(book({ T_振込口座: live, T_振込口座_archive: archive, T_会員: member }));
  for (const sheet of [live, archive]) {
    for (const col of ['金融機関コード', '支店コード', '口座番号']) {
      const j = BANK.indexOf(col);
      assert.ok(sheet.formats.every((row) => row[j] === '@'), col);
    }
    assert.ok(sheet.formats.every((row) => row[0] === '' && row[4] === ''), '口座ID・名義は触らない');
  }
  assert.ok(member.formats.every((row) => row[1] === '@' && row[0] === '' && row[2] === ''));
});

test('TEXT_FORMAT_COLUMNS_ の列はすべてテーブル定義にある（名前の打ち間違いで守れていない列を作らない）', () => {
  const defs = extractTableDefs('gas-src/Code.full.gs');
  for (const [table, cols] of Object.entries(srv.TEXT_FORMAT_COLUMNS_ as Record<string, string[]>)) {
    assert.ok(defs[table], table);
    for (const c of cols) assert.ok(defs[table].includes(c), `${table}.${c}`);
  }
});

test('スキーマ整備の後処理と、リハーサルの書いて読む確認に組み込まれている', () => {
  const init = block(admin, 'function initializeSchema_(');
  assert.match(init, /post\('applyTextColumnFormats_'/);
  const rehearse = block(admin, 'function rehearseTableWriteRead_(');
  assert.ok(rehearse.includes("'T_振込口座'") && rehearse.includes('TEXT_FORMAT_COLUMNS_'));
});
