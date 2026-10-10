/**
 * v376.61 回帰テスト: 研修の開催終了時刻（endTime）の正規化。
 *
 * 背景（GCP 作業場 docs/PHASE4B_AUTH_DEFENSE_DESIGN.md「本番リポジトリ側で実施する課題A」）:
 * mapTrainingRowsForApi_ が endTime を String() で素通ししていたため、シート値が Date の
 * 場合に JS Date の文字列表現（`Fri Dec 29 1899 22:00:00 GMT-0500 …`）がそのまま API に出ていた。
 * 管理画面は endTime を <input type="time"> に束ねており type="time" は HH:mm しか受け付けないため、
 * 入力欄が空表示 → そのまま保存すると開催終了時刻が消える（実害バグ）。
 *
 * 本テストは gas-src/Code.full.gs の formatTimeOnly_ を【実ソースから抽出して評価】し、
 * さらに mapper 側が String() へ戻っていないことをソース契約として固定する。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GAS_SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'gas-src', 'Code.full.gs');
const source = fs.readFileSync(GAS_SRC, 'utf8');

// ── 実ソースから formatTimeOnly_ を抽出して評価する（ミラー実装にしない＝ドリフト防止）──
function extractFunction(name: string): string {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} が gas-src に見つからない`);
  let depth = 0;
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`${name} の終端が見つからない`);
}

// GAS の Utilities.formatDate(val, 'Asia/Tokyo', 'HH:mm') 相当の最小スタブ
const Utilities = {
  formatDate(val: Date, tz: string, fmt: string): string {
    assert.equal(tz, 'Asia/Tokyo');
    assert.equal(fmt, 'HH:mm');
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(val);
  },
};

const formatTimeOnly_ = new Function('Utilities', `${extractFunction('formatTimeOnly_')}; return formatTimeOnly_;`)(Utilities) as (v: unknown) => string;

test('Date 値は Asia/Tokyo の HH:mm になる', () => {
  // 2026-05-20 16:30 JST = 07:30Z
  assert.equal(formatTimeOnly_(new Date('2026-05-20T07:30:00Z')), '16:30');
});

test('HH:mm 文字列はそのまま / H:mm は 0 埋めされる', () => {
  assert.equal(formatTimeOnly_('16:30'), '16:30');
  assert.equal(formatTimeOnly_('9:05'), '09:05');
});

test('★回帰固定: JS Date の文字列表現は空文字に落ちる（type="time" へ渡さない）', () => {
  assert.equal(formatTimeOnly_('Fri Dec 29 1899 22:00:00 GMT-0500 (米国東部標準時)'), '');
  assert.equal(formatTimeOnly_('Sat Dec 30 1899 02:30:00 GMT-0500 (米国東部標準時)'), '');
});

test('空値は空文字', () => {
  for (const v of ['', null, undefined, 0]) assert.equal(formatTimeOnly_(v), '');
});

// ── ソース契約: endTime を素通しさせない ──
test('★回帰固定: シート列から作る endTime は必ず formatTimeOnly_ を通す', () => {
  // dryRun のテスト用リテラル（endTime: '16:30'）を拾わないよう、シート列を読む行だけを対象にする。
  const mapperLines = source.split(/\r?\n/).filter((l) => /endTime\s*:.*開催終了時刻/.test(l));
  assert.ok(mapperLines.length >= 2, 'endTime を返す mapper が見つからない');
  for (const line of mapperLines) {
    assert.match(line, /formatTimeOnly_\(/, `endTime が正規化されていない: ${line.trim()}`);
  }
  assert.doesNotMatch(source, /endTime\s*:\s*String\(/, 'endTime を String() で素通ししている箇所がある');
});

// ── 2026-10-10: 申込開始日・締切日（<input type="date">）の正規化（docs/302 §2）─────────
// API は日付だけの列も "yyyy-MM-dd HH:mm" で返す。type="date" は yyyy-MM-dd 以外を受け付けず、
// 編集モーダルで空欄に見えていた（endTime と同じ形の不具合）。画面側で日付の部分へ整える。
import { stripTypeScriptTypes } from 'node:module';

const TM_SRC = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'components', 'TrainingManagement.tsx'),
  'utf8',
);

function loadNormalizeDateOnly(): (v: string | undefined) => string {
  const start = TM_SRC.indexOf('const normalizeDateOnly = ');
  assert.notEqual(start, -1, 'normalizeDateOnly が TrainingManagement.tsx に見つからない');
  const end = TM_SRC.indexOf('\n  };', start) + '\n  };'.length;
  const js = stripTypeScriptTypes(TM_SRC.slice(start, end));
  return new Function(`${js}; return normalizeDateOnly;`)() as (v: string | undefined) => string;
}

test('申込日: API の "yyyy-MM-dd HH:mm" を type="date" が表示できる yyyy-MM-dd に整える', () => {
  const normalizeDateOnly = loadNormalizeDateOnly();
  assert.equal(normalizeDateOnly('2026-03-15 00:00'), '2026-03-15');
  assert.equal(normalizeDateOnly('2026-04-25'), '2026-04-25');
  assert.equal(normalizeDateOnly(''), '');
  assert.equal(normalizeDateOnly(undefined), '');
});

test('申込日: 編集モーダルへの読み込みと保存後の反映の両方で正規化している', () => {
  const uses = TM_SRC.match(/applicationOpenDate: normalizeDateOnly\(/g) || [];
  const usesClose = TM_SRC.match(/applicationCloseDate: normalizeDateOnly\(/g) || [];
  assert.equal(uses.length, 2, 'loadTraining と保存後の setForm の 2 箇所');
  assert.equal(usesClose.length, 2, 'loadTraining と保存後の setForm の 2 箇所');
});
