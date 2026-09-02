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
