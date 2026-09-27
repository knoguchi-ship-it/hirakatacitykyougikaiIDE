/**
 * ビルドのコード変形ヘルパー（pruner 含む）が 1 箇所にしか無いことを固定する。
 *
 * 背景（2026-09-27）: 同じ実装が `gas-boundary-utils.mjs` /`build-admin-gas.mjs` /
 * `build-member-gas.mjs` の 3 箇所にあり、コードには
 * 「this pruner is duplicated in ... Keep the three in step」と申し送りがあった。
 * **実際には揃っていなかった。** `gas-boundary-utils.mjs` の
 * `pruneUnreachableFunctionDeclarations` だけ v292/v296 の修正
 * （文字列リテラルを除いてからマッチ）が入っておらず、それを import している
 * 公開ビルドだけが古い pruner で生成されていた。
 *
 * 申し送りのコメントは守られない。ここで機械的に落とす。
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const SCRIPTS = path.join(process.cwd(), 'scripts');
const CANONICAL = 'gas-boundary-utils.mjs';

/** 正本にしか置かないヘルパー */
const SHARED_HELPERS = [
  'findBlockEnd',
  'collectFunctionDeclarations',
  'collectTopLevelStatements',
  'maskCommentsAndStrings',
  'collectReachableFunctions',
  'pruneUnreachableFunctionDeclarations',
  'removeTopLevelFunctionDeclarations',
  'assertAllowedTopLevelFunctions',
  'removeDisallowedActionHandlers',
  'removeIfBlock',
  'replaceObjectLiteral',
  'replaceScriptRoutesWithPublicOnly',
  'injectMarkerBlock',
  'injectMenuRegistryPlaceholders',
  'injectMemberFiscalStatusPlaceholders',
  'injectMemberTypesPlaceholders',
];

const buildScripts = fs.readdirSync(SCRIPTS).filter((f) => /^build-.*\.mjs$/.test(f));

function declaresFunction(source: string, name: string): boolean {
  return new RegExp(`^(?:export )?function ${name}\\s*\\(`, 'm').test(source);
}

test('ビルドスクリプトがヘルパーを自前で定義していない', () => {
  const offenders: string[] = [];
  for (const file of buildScripts) {
    const source = fs.readFileSync(path.join(SCRIPTS, file), 'utf8');
    for (const name of SHARED_HELPERS) {
      if (declaresFunction(source, name)) offenders.push(`${file}:${name}`);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `${CANONICAL} から import すること（複製すると必ず片方だけ直されて食い違う）: ${offenders.join(', ')}`,
  );
});

test('正本にすべてのヘルパーが export されている', () => {
  const source = fs.readFileSync(path.join(SCRIPTS, CANONICAL), 'utf8');
  for (const name of SHARED_HELPERS) {
    assert.ok(
      new RegExp(`^export function ${name}\\s*\\(`, 'm').test(source),
      `${CANONICAL} が ${name} を export していない`,
    );
  }
});

test('pruner に v292/v296 の修正が入っている（文字列リテラルを除いてからマッチ）', () => {
  const source = fs.readFileSync(path.join(SCRIPTS, CANONICAL), 'utf8');
  const start = source.indexOf('export function pruneUnreachableFunctionDeclarations(');
  assert.notEqual(start, -1);
  const body = source.slice(start, source.indexOf('\n}\n', start));
  // 'getDbInfo' のような文字列キーへの誤マッチで変数宣言ごと消える事故（v292）の再発防止
  assert.ok(body.includes('.replace('), '文字列リテラルの除去が無い');
  assert.ok(body.includes('stripped'), 'マッチ対象が素の statement.text のままになっている');
});

test('到達判定はコメント・文字列を無視する', () => {
  const source = fs.readFileSync(path.join(SCRIPTS, CANONICAL), 'utf8');
  const start = source.indexOf('export function collectReachableFunctions(');
  assert.notEqual(start, -1);
  const body = source.slice(start, source.indexOf('\n}\n', start));
  assert.ok(body.includes('maskCommentsAndStrings('), 'コメント内の関数名で dead code が生き残る');
  // 値として渡される関数（rows.map(fn_)）も参照とみなす（v376.42〜61 の本番事故）
  assert.ok(body.includes('referencePattern'), '値参照の走査が無い');
});
