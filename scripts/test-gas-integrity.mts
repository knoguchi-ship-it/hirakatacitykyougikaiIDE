/**
 * 2026-10-13: 「書いてあるのに結び付いていない」を GAS で機械的に見つける（docs/306 §3.6）。
 *
 * 1. 定義されていない名前の参照 — 例: applyTraining_ の currentApplicants（2026-09-27 の退行で、
 *    会員マイページの研修申込が必ず例外になっていた）、存在しない invalidateAllDataCache_ の呼び出し。
 *    正本（gas-src）と、build 後の生成物（未使用除去で消えた関数・変数を参照していないか）の両方を見る。
 * 2. テーブル定義に無い列名の読み書き — 例: 権限コード（正しくは 職員権限コード・2026-10-08）、
 *    通知方法コード（正しくは 発送方法コード）。setCol は列が無いと黙って何もしないので、実行しても気づけない。
 * 3. 管理者セッションに無い項目の読み取り — 例: session.googleEmail（削除ログの操作者が常に空）。
 *    test-single-source の検査は .email だけを見ていた。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const GAS_SRC = read('gas-src/Code.full.gs');

// GAS の組み込みサービス（TypeScript の標準ライブラリには無い）
const GAS_GLOBALS = new Set([
  'SpreadsheetApp', 'DriveApp', 'Utilities', 'Logger', 'PropertiesService', 'CacheService', 'LockService',
  'Session', 'MailApp', 'GmailApp', 'UrlFetchApp', 'ScriptApp', 'HtmlService', 'ContentService', 'Charts',
  'DocumentApp', 'XmlService', 'Gmail', 'console',
]);

/** 1 つの GAS プロジェクト（同じスコープを共有する .gs 群）で、定義されていない名前を返す */
function undefinedNames(sources: string[]): string[] {
  const text = sources.join('\n;\n');
  const fileName = path.join(ROOT, '__gas_integrity_check__.js');
  const options: ts.CompilerOptions = { allowJs: true, checkJs: true, noEmit: true, target: ts.ScriptTarget.ES2019, lib: ['lib.es2019.d.ts'] };
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (f, lang) => (path.resolve(f) === path.resolve(fileName)
    ? ts.createSourceFile(f, text, lang, true, ts.ScriptKind.JS)
    : getSourceFile(f, lang));
  const fileExists = host.fileExists.bind(host);
  host.fileExists = (f) => path.resolve(f) === path.resolve(fileName) || fileExists(f);
  const program = ts.createProgram([fileName], options, host);
  const out: string[] = [];
  for (const d of ts.getPreEmitDiagnostics(program)) {
    if (!d.file || path.resolve(d.file.fileName) !== path.resolve(fileName)) continue;
    if (d.code !== 2304 && d.code !== 2552) continue; // Cannot find name
    const m = ts.flattenDiagnosticMessageText(d.messageText, ' ').match(/'([^']+)'/);
    const name = m ? m[1] : '?';
    if (GAS_GLOBALS.has(name)) continue;
    const line = d.file.getLineAndCharacterOfPosition(d.start ?? 0).line + 1;
    out.push(`${name} (行 ${line})`);
  }
  return out;
}

test('★GAS の正本に、定義されていない名前の参照が無い', () => {
  assert.deepEqual(undefinedNames([GAS_SRC]), [], '定義されていない変数・関数を参照している（実行時に ReferenceError）');
});

test('★GAS の生成物（公開・会員・管理）に、定義されていない名前の参照が無い', () => {
  // build の未使用除去が、まだ使われている関数・最上位の var を消していないかを見る
  const projects: Record<string, string[]> = {
    'backend（統合・公開）': ['backend/Code.gs'],
    'gas/member': ['gas/member/Code.gs'],
    'gas/admin': fs.readdirSync(path.join(ROOT, 'gas/admin')).filter((f) => f.endsWith('.gs')).map((f) => 'gas/admin/' + f),
  };
  for (const [name, files] of Object.entries(projects)) {
    // 構文として読めること（build の置換が宣言を壊したことがある: function schema maintenance {）
    for (const f of files) {
      assert.doesNotThrow(() => new Function(read(f)), `${f} が構文エラー（GAS はプロジェクト全体を読み込めなくなる）`);
    }
    assert.deepEqual(undefinedNames(files.map(read)), [], `${name} の生成物が定義されていない名前を参照している（build を確認）`);
  }
});

/** テーブル定義・マスタ定義に出てくる列名の集合 */
function definedColumns(): Set<string> {
  const defined = new Set<string>();
  const extractObject = (name: string) => {
    const start = GAS_SRC.indexOf('var ' + name + ' = {');
    assert.notEqual(start, -1, name + ' が見つからない');
    let depth = 0;
    let i = GAS_SRC.indexOf('{', start);
    for (; i < GAS_SRC.length; i++) {
      if (GAS_SRC[i] === '{') depth++;
      else if (GAS_SRC[i] === '}' && --depth === 0) break;
    }
    return GAS_SRC.slice(GAS_SRC.indexOf('{', start), i + 1);
  };
  for (const name of ['テーブル定義', 'マスタ定義']) {
    for (const m of extractObject(name).matchAll(/'([^']+)'/g)) defined.add(m[1]);
  }
  for (const m of GAS_SRC.matchAll(/^(?:テーブル定義|マスタ定義)\['[^']+'\]\s*=\s*\[([\s\S]*?)\];/gm)) {
    for (const c of m[1].matchAll(/'([^']+)'/g)) defined.add(c[1]);
  }
  for (const m of GAS_SRC.matchAll(/var ARCHIVE_SURROGATE_COLUMNS\s*=\s*\[([^\]]*)\]/g)) {
    for (const c of m[1].matchAll(/'([^']+)'/g)) defined.add(c[1]);
  }
  return defined;
}

// 列ではなく、同じ関数の中で組み立てた帳票用オブジェクトのキー（buildCredentialsTempRows_）
const NON_COLUMN_KEYS = new Set(['会員種別', '初期パスワード']);

test('★GAS が読み書きする列名は、すべてテーブル定義・マスタ定義にある', () => {
  const defined = definedColumns();
  assert.ok(defined.size > 200, '列定義の読み取りに失敗している');
  const JP = /[ぁ-んァ-ヶ一-龠]/;
  const patterns = [
    /\[\s*cols\s*\[\s*'([^']+)'\s*\]\s*\]/g,
    /columns\s*\[\s*'([^']+)'\s*\]/g,
    /\b(?:r|row|m|s|st|member|staff|rec|record|target|found|o|obj|item|t|a|app|x)\s*\[\s*'([^']+)'\s*\]/g,
    /\b(?:getCol|setCol|colIndex|col)\(\s*'([^']+)'/g,
    /findRowByColumnValue_\([^,]+,\s*'([^']+)'/g,
  ];
  const bad: string[] = [];
  GAS_SRC.split('\n').forEach((line, idx) => {
    if (/^\s*\/\//.test(line)) return;
    for (const re of patterns) {
      for (const m of line.matchAll(re)) {
        const col = m[1];
        if (JP.test(col) && !defined.has(col) && !NON_COLUMN_KEYS.has(col)) bad.push(`${col}（行 ${idx + 1}）`);
      }
    }
  });
  assert.deepEqual(bad, [], 'テーブル定義に無い列名を読み書きしている（setCol は黙って何もしない）');
});

test('★管理者セッションから、存在しない項目を読まない', () => {
  // checkAdminBySession_ が返すオブジェクトのキー
  const fnStart = GAS_SRC.indexOf('function checkAdminBySession_(');
  const fnBody = GAS_SRC.slice(fnStart, GAS_SRC.indexOf('\n}\n', fnStart));
  const ret = fnBody.slice(fnBody.lastIndexOf('return {'));
  const keys = new Set([...ret.matchAll(/^\s*(\w+):/gm)].map((m) => m[1]));
  assert.ok(keys.has('loginId') && keys.has('roleCode'), 'セッションのキーを読み取れていない');
  // 会員マイページの自己更新は { staffId, roleCode } だけのセッションを渡す（updateMemberSelf_）
  keys.add('staffId');
  const bad: string[] = [];
  const lines = GAS_SRC.split('\n');
  // checkAdminBySession_() を受けた変数名を集める（関数ごとに名前は違う）
  const sessionVars = new Set(['adminSession', 'effectiveAdminSession', '__adminSession']);
  for (const m of GAS_SRC.matchAll(/var (\w+) = checkAdminBySession_\(/g)) sessionVars.add(m[1]);
  lines.forEach((line, idx) => {
    if (/^\s*\/\//.test(line)) return;
    for (const m of line.matchAll(/\b(\w+)\.(\w+)\b/g)) {
      if (!sessionVars.has(m[1])) continue;
      if (m[1] === 'session' && !/checkAdminBySession_|adminSession/.test(lines.slice(Math.max(0, idx - 15), idx + 1).join('\n'))) continue;
      if (!keys.has(m[2])) bad.push(`${m[1]}.${m[2]}（行 ${idx + 1}）`);
    }
  });
  assert.deepEqual(bad, [], '管理者セッションに無い項目を読んでいる（常に undefined になる）');
});
