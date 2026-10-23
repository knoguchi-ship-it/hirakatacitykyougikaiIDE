/**
 * 2026-10-23 回帰テスト: 研修の日付表記は src/shared/trainingDate.mjs の 1 か所（operator 指示「研修の日付の書き方は統一」）。
 *
 * 以前は 4 通りあった: 公開=和暦・会員=toLocaleString・受付メール=2026-06-20 14:00・LINE 下書き=2026-06-20T14:00。
 * 表記は和暦（2026-10-18 operator 決定）: 令和8年6月20日(土) 14:00〜16:30。
 * GAS は build が注入した formatTrainingDateJa_ を、生成物から取り出して同じ結果になることを確かめる（ミラー実装にしない）。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatTrainingDateJa, serializeTrainingDateForGas } from '../src/shared/trainingDate.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const CASES: Array<[string, string | undefined, string]> = [
  ['2026-06-20 14:00', '16:30', '令和8年6月20日(土) 14:00〜16:30'],
  ['2026-06-20T14:00', '16:30', '令和8年6月20日(土) 14:00〜16:30'],
  ['2026-06-20T14:00:00', '', '令和8年6月20日(土) 14:00〜'],
  ['2026-06-20 09:05', '9:30', '令和8年6月20日(土) 9:05〜9:30'],
  ['2026-06-20', undefined, '令和8年6月20日(土)'],
  ['2026/06/20', undefined, '令和8年6月20日(土)'],
  ['2019-05-01 10:00', '', '令和元年5月1日(水) 10:00〜'],
  ['2019-04-30', undefined, '平成31年4月30日(火)'],
  ['', '16:30', ''],
  ['未定', undefined, '未定'],
];

test('和暦・曜日・時刻の形にそろえる（時刻が無ければ日付だけ・終了時刻が無ければ「〜」）', () => {
  for (const [date, end, want] of CASES) assert.equal(formatTrainingDateJa(date, end), want, `${date} / ${end}`);
});

test('曜日は端末のタイムゾーンに左右されない（UTC の夜でも日付がずれない）', () => {
  const tz = process.env.TZ;
  try {
    process.env.TZ = 'America/Los_Angeles';
    assert.equal(formatTrainingDateJa('2026-06-20', undefined), '令和8年6月20日(土)');
  } finally { process.env.TZ = tz; }
});

test('★GAS の 3 split に同じ関数が注入されている（stub のままにしない）', () => {
  const body = serializeTrainingDateForGas();
  for (const rel of ['backend/Code.gs', 'gas/member/Code.gs', 'gas/admin/Code.gs']) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    if (!code.includes('function formatTrainingDate_(')) continue; // その split に経路が無い
    assert.ok(code.includes(body), `${rel} に formatTrainingDateJa_ が注入されていない`);
    assert.ok(!code.includes('formatTrainingDateJa_ is not injected'), `${rel} が stub のまま`);
  }
  const admin = fs.readFileSync(path.join(ROOT, 'gas', 'admin', 'Code.gs'), 'utf8');
  assert.ok(admin.includes('function formatTrainingDate_('), '管理 split にリマインダー等の経路が無い');
  const injected = new Function(`${body}\nreturn formatTrainingDateJa_;`)();
  for (const [date, end, want] of CASES) assert.equal(injected(date, end), want);
});

test('★GAS のメール・LINE・AI 下書きの開催日は formatTrainingDate_ を通す', () => {
  const gas = fs.readFileSync(path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');
  const hits = gas.split('\n').filter((l) => l.includes("'開催日'") && l.includes(':') && !l.includes('formatTrainingDate_(')
    && (l.includes('formatDateForApi_(') || l.includes('String(training')));
  assert.deepEqual(hits.filter((l) => !l.includes('date: ')), [], '開催日を生の形式で差し込んでいる');
  assert.match(gas, /'開催日': formatTrainingDate_\(training\['開催日'\], training\['開催終了時刻'\]\)/, '受付メール');
  assert.match(gas, /'開催日': formatTrainingDate_\(training\.date, training\.endTime\)/, 'リマインダー');
  assert.match(gas, /'開催日: ' \+ formatTrainingDate_\(training\.date, training\.endTime\)/, 'AI 下書き');
});

function listSources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return listSources(full);
    return /\.tsx?$/.test(e.name) ? [full] : [];
  });
}

test('★画面に研修の日付を生のまま・独自の整形で出さない', () => {
  // {t.date} のような生の表示、toWareki などの独自関数、研修日付への toLocaleString
  const RAW = /\{(t|training|selectedHistoryTraining|confirmTraining)\.date\}|function toWareki|const formatTrainingDate = /;
  const hits: string[] = [];
  for (const file of listSources(path.join(ROOT, 'src'))) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (RAW.test(line)) hits.push(`${rel}:${i + 1}: ${line.trim().slice(0, 100)}`);
    });
  }
  assert.deepEqual(hits, []);
});
