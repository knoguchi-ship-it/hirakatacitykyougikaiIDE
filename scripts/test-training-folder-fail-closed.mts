/**
 * 研修ファイルの保存先フォルダを黙って作らない（2026-11-12・docs/324 ②・operator 指示「作らない様にして」）。
 *
 * 背景: getOrCreateTrainingFolder_ は設定の ID で開けないとマイドライブ直下に「研修案内状」を作り、ID を
 * スクリプトプロパティにだけ控えていた。設定へ書き戻さないので、10 分ごとの processPendingThumbnails が
 * 研修 0 件でも毎回フォルダを作り、空フォルダが 1 日 144 個のペースで増えた。
 *
 * 実ソースから関数を取り出し、Drive・設定を差し替えて動かす（ミラー禁止・AGENTS L3.1）。
 * 直す前のコードでは落ちることを確かめるため、GAS_SRC で読むファイルを替えられる。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const gas = fs.readFileSync(process.env.GAS_SRC || path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');

function extractFunction(name: string): string {
  const start = gas.indexOf(`function ${name}(`);
  if (start === -1) return '';
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

type World = {
  setting: string;
  openable: Set<string>;
  created: string[];
  props: Map<string, string>;
  settingsWritten: string[];
  trainings: Record<string, string>[];
  heartbeats: number;
  notified: string[];
};

function load(world: World) {
  const names = ['getTrainingFolder_', 'resolveTrainingFolder_', 'getOrCreateTrainingFolder_', 'setupTrainingFileFolder_', 'processPendingThumbnails'];
  const body = names.map(extractFunction).join('\n');
  return new Function('w', `
    var Logger = { log: function() {} };
    var DriveApp = {
      Access: { PRIVATE: 'PRIVATE' }, Permission: { NONE: 'NONE' },
      getFolderById: function(id) {
        if (!w.openable.has(id)) throw new Error('指定の ID の項目が見つかりません');
        return { getId: function() { return id; } };
      },
      getRootFolder: function() { return { createFolder: function(name) {
        var id = 'new-' + (w.created.length + 1);
        w.created.push(id); w.openable.add(id);
        return { getId: function() { return id; }, setSharing: function() {} };
      } }; },
    };
    var PropertiesService = { getScriptProperties: function() { return {
      setProperty: function(k, v) { w.props.set(k, v); }, getProperty: function(k) { return w.props.get(k) || null; },
    }; } };
    function getSystemSettingValue_(ss, key) { return key === 'TRAINING_FILE_FOLDER_ID' ? w.setting : ''; }
    function batchUpsertSystemSettings_(ss, updates) { updates.forEach(function(u) { w.settingsWritten.push(u.value); w.setting = u.value; }); }
    function getOrCreateDatabase_() { return {}; }
    function assertTriggerOrMasterOperator_() {}
    function getRowsAsObjects_() { return w.trainings; }
    function toBoolean_(v) { return v === true || v === 'TRUE'; }
    function recordJobHeartbeat_() { w.heartbeats += 1; }
    function notifyScheduledJobFailureToChat_(name, e) { w.notified.push(String(e && e.message)); }
    function generateAndSaveThumbnailForPdf_() { return ''; }
    function updateTrainingThumbnailUrlByRowId_() {}
    function clearAllDataCache_() {} function clearAdminDashboardCache_() {} function clearTrainingManagementCache_() {}
    ${body}
    return {
      get: typeof getTrainingFolder_ === 'function' ? getTrainingFolder_ : getOrCreateTrainingFolder_,
      setup: setupTrainingFileFolder_,
      job: processPendingThumbnails,
    };
  `)(world);
}

const fresh = (over: Partial<World> = {}): World => ({
  setting: '', openable: new Set(), created: [], props: new Map(), settingsWritten: [],
  trainings: [], heartbeats: 0, notified: [], ...over,
});

test('設定の ID で開けないときは作らずに止める（保存先を黙って替えない）', () => {
  const w = fresh({ setting: 'gone' });
  assert.throws(() => load(w).get({}), /保存先フォルダを開けません/);
  assert.deepEqual(w.created, [], 'フォルダを作ってはいけない');
  assert.equal(w.props.size, 0, 'スクリプトプロパティにも書かない');
});

test('未設定のときも作らずに止める（作るのは設定画面のボタンだけ）', () => {
  const w = fresh();
  assert.throws(() => load(w).get({}), /設定されていません/);
  assert.deepEqual(w.created, []);
});

test('開ける ID ならそのフォルダを返し、何も作らない', () => {
  const w = fresh({ setting: 'ok', openable: new Set(['ok']) });
  assert.equal(load(w).get({}).getId(), 'ok');
  assert.deepEqual(w.created, []);
});

test('設定画面のボタンは、開けないとき 1 つ作って T_システム設定へ保存する（次から作られない）', () => {
  const w = fresh({ setting: 'gone' });
  const api = load(w);
  assert.equal(api.setup({}).folderId, 'new-1');
  assert.deepEqual(w.settingsWritten, ['new-1']);
  assert.equal(api.get({}).getId(), 'new-1');
  assert.deepEqual(w.created, ['new-1'], '2 回目以降は作らない');
});

test('定期ジョブ: 研修が 0 件・対象 0 件ならフォルダに触れず、作らず、心拍だけ残す', () => {
  const w = fresh({ setting: 'gone' });
  const api = load(w);
  for (let i = 0; i < 3; i += 1) api.job({});
  assert.deepEqual(w.created, [], '10 分ごとに作っていた不具合の再発');
  assert.equal(w.heartbeats, 3);
  assert.deepEqual(w.notified, []);
});

test('定期ジョブ: 対象があって保存先を開けないときも作らない（失敗として通知する）', () => {
  const w = fresh({ setting: 'gone', trainings: [{ '研修ID': 'T1', '案内状URL': 'https://drive.google.com/file/d/abc/view', '案内状サムネイルURL': '' }] });
  load(w).job({});
  assert.deepEqual(w.created, []);
  assert.equal(w.notified.length, 1);
  assert.match(w.notified[0], /保存先フォルダを開けません/);
});
