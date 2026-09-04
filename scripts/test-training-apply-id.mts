/**
 * v376.72 回帰テスト: T_研修申込.申込ID の採番統一（AGENTS.md §3 の DRY 原則）。
 *
 * 背景: 同じ列に 3 通りの形式が入っていた。
 *   会員セルフ申込 = `AP-` + 10 桁 ／ 公開ポータルの外部申込 = 素の UUID ／
 *   管理の名簿への手動追加・ゲスト追加 = `AP-` + 8 桁。
 * 一意性は保たれるため実害は出ていなかったが、正本が 4 箇所に散っている状態を解消する。
 *
 * 固定するのは次の 3 点。実ソースから切り出して評価する（ミラー実装を書かない）。
 *   1. 採番の実装が `generateTrainingApplyId_` の 1 つだけであること
 *   2. 申込を作る 4 経路がすべてその関数を呼んでいること（インラインで採番し直していない）
 *   3. 生成される ID の形が `AP-` + 英数 10 桁であること
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const gas = fs.readFileSync(path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');

/** 実ソースから関数定義を切り出す（AGENTS.md §3） */
function extractFunction(name: string): string {
  const start = gas.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が見つからない`);
  let depth = 0;
  for (let i = gas.indexOf('{', start); i < gas.length; i += 1) {
    if (gas[i] === '{') depth += 1;
    else if (gas[i] === '}') {
      depth -= 1;
      if (depth === 0) return gas.slice(start, i + 1);
    }
  }
  throw new Error(`${name} の終端が見つからない`);
}

/** 申込を作る 4 経路。ここを増やしたらこの配列にも足すこと。 */
const APPLY_ENTRY_POINTS = [
  'applyTraining_',          // 会員マイページからの申込
  'applyTrainingExternal_',  // 公開ポータルからの外部申込
  'addRosterEntry_',         // 管理: 名簿へ会員/職員を手動追加
  'addGuestRosterEntry_',    // 管理: 名簿へゲストを手動追加
];

test('申込IDの採番実装は generateTrainingApplyId_ の 1 つだけ', () => {
  const definitions = gas.match(/function generateTrainingApplyId_\(/g) || [];
  assert.equal(definitions.length, 1, '採番関数の定義が 1 つでない');

  // 採番関数の外で 申込ID 用の ID を組み立てていないこと（'AP-' の直接連結を禁止）
  const generator = extractFunction('generateTrainingApplyId_');
  const outside = gas.replace(generator, '');
  for (const fn of APPLY_ENTRY_POINTS) {
    const body = extractFunction(fn);
    assert.ok(
      !/'AP-'\s*\+/.test(body),
      `${fn} が 'AP-' を直接連結している。generateTrainingApplyId_() を使うこと`
    );
    assert.ok(
      !/申込ID'\]?\s*[=:]\s*Utilities\.getUuid\(\)/.test(body),
      `${fn} が申込IDに素の UUID を使っている`
    );
  }
  assert.ok(outside.length > 0);
});

test('申込を作る 4 経路がすべて共通の採番関数を呼ぶ', () => {
  for (const fn of APPLY_ENTRY_POINTS) {
    const body = extractFunction(fn);
    assert.ok(
      body.includes('generateTrainingApplyId_()'),
      `${fn} が generateTrainingApplyId_() を呼んでいない`
    );
  }
});

test('生成される申込IDは AP- + 英数 10 桁', () => {
  const sandbox = `
    var Utilities = {
      getUuid: function() { return '3f9a2c10-bd47-4e21-9a3c-0f1e2d3c4b5a'; }
    };
    ${extractFunction('generateTrainingApplyId_')}
    return generateTrainingApplyId_;
  `;
  const generate = new Function(sandbox)() as () => string;
  const id = generate();
  assert.match(id, /^AP-[0-9A-Z]{10}$/, `想定外の形式: ${id}`);
  assert.equal(id, 'AP-3F9A2C10BD');
});

test('取消は申込IDの完全一致で引く（形式を変えても既存IDが引ける）', () => {
  const body = extractFunction('cancelTrainingExternal_');
  assert.ok(
    /String\(r\['申込ID'\] \|\| ''\) === applyId/.test(body),
    '取消の照合が完全一致でない。形式変更で既存の申込が引けなくなる恐れがある'
  );
});
