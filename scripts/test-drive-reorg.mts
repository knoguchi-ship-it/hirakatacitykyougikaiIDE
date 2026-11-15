/**
 * 2026-11-15 Drive の整理（docs/334）。D1 棚卸しのツールは読むだけで、移動先の共有ドライブの制限から公開リンクの可否を判定する。
 * 実ソースから関数を切り出して実行する（ミラー禁止・AGENTS L3.1）。
 * TEST_GAS_SRC で別の版の gas-src を指せる（直す前のコードで落ちることを確かめるため）。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const gas = fs.readFileSync(process.env.TEST_GAS_SRC || path.join(ROOT, 'gas-src', 'Code.full.gs'), 'utf8');

function extractFunction(name: string): string {
  const start = gas.indexOf(`\nfunction ${name}(`) + 1;
  assert.ok(start > 0, `${name} が見つからない`);
  const end = gas.indexOf('\n}\n', start);
  return gas.slice(start, end + 2);
}

const load = () => new Function(`
  var LAST_EXTERNAL_BACKUP_SPREADSHEET_ID_KEY = 'LAST_EXTERNAL_BACKUP_SPREADSHEET_ID';
  ${extractFunction('driveLinkSharingAllowed_')}
  ${extractFunction('collectDriveAssetRefs_')}
  return { allowed: driveLinkSharingAllowed_, refs: collectDriveAssetRefs_ };
`)();

test('棚卸し: 共有ドライブが組織外・メンバー外の共有を禁じていれば、公開リンクは使えない', () => {
  const { allowed } = load();
  assert.equal(allowed({ domainUsersOnly: false, driveMembersOnly: false }), true);
  assert.equal(allowed({}), true);
  assert.equal(allowed(null), true);
  assert.equal(allowed({ domainUsersOnly: true }), false, '組織外に共有できない → 公開ポータルが PDF を出せない');
  assert.equal(allowed({ driveMembersOnly: true }), false);
});

test('棚卸し: 対象は DB・ログ・バックアップ・設定の 4 フォルダ・ファビコン・管理プロジェクト。未設定も並べる', () => {
  const { refs } = load();
  const settings: Record<string, string> = { TRAINING_FILE_FOLDER_ID: 'F_TRAIN', CLAIM_ATTACHMENT_FOLDER_ID: ' F_CLAIM ' };
  const list = refs({ LOG_SPREADSHEET_ID: 'LOG', FAVICON_MEMBER_FILE_ID: 'FAV' }, (k: string) => settings[k] || '', 'DB', 'SCRIPT');
  const byLabel = Object.fromEntries(list.map((r: { label: string }) => [r.label, r]));
  assert.equal(byLabel['DB'].id, 'DB');
  assert.equal(byLabel['ログ用スプレッドシート'].id, 'LOG');
  assert.equal(byLabel['研修案内状フォルダ'].kind, 'folder');
  assert.equal(byLabel['請求添付フォルダ'].id, 'F_CLAIM', '前後の空白を除く');
  assert.equal(byLabel['LINE 投稿資材フォルダ'].missing, true, '未設定も出す');
  assert.equal(byLabel['最新の外部バックアップ'].missing, true);
  assert.ok(byLabel['管理プロジェクト（Apps Script・今回は移さない）']);
  assert.equal(list.length, 10);
});

test('棚卸し: ツールは読むだけ（移動・共有の変更・ゴミ箱をしない）で、フォルダの中のファイル名を取らない', () => {
  const body = extractFunction('inventoryDriveAssets_LOG');
  assert.match(body, /^function inventoryDriveAssets_LOG\(\) \{\n  assertMasterOperator_\('inventoryDriveAssets_LOG'\);/);
  for (const w of ['setSharing', 'moveTo', 'addFile', 'removeFile', 'setTrashed', 'addParents', 'removeParents', 'method: \'patch\'', 'method: \'post\'']) {
    assert.ok(!body.includes(w), `書き込み ${w} がある`);
  }
  assert.ok(!extractFunction('driveCountQuery_').includes('files(id,name'), '中のファイル名を取らない');
  assert.match(gas, /var DRIVE_REORG_TARGET_FOLDER_ID_ = '1BKBwQF9dFIwdnEqnpGaeM1iCypSFuPgr';/);
});

// ── D2 構成と D3 移動の仕組み（docs/334 §9） ─────────────────────
const loadReorg = () => new Function(`
  ${extractFunction('driveReorgLayout_')}
  ${extractFunction('driveReorgPlanItems_')}
  ${extractFunction('driveReorgFingerprintInput_')}
  ${extractFunction('driveReorgPreviewValid_')}
  ${extractFunction('driveReorgRestoreOps_')}
  return { layout: driveReorgLayout_, plan: driveReorgPlanItems_, fp: driveReorgFingerprintInput_, valid: driveReorgPreviewValid_, restore: driveReorgRestoreOps_ };
`)();

test('構成: 機密と公開を「システム → 本番/ステージング → 用途」でそろえ、親を子より先に作る。移すフォルダの同名は先に作らない', () => {
  const { layout } = loadReorg();
  const list = layout('CONF', 'PUB');
  const keys = list.map((f: { key: string }) => f.key);
  for (const k of ['conf/本番', 'conf/本番/ログ', 'conf/本番/宛名リスト', 'conf/本番/バックアップ', 'conf/本番/請求添付', 'conf/本番/一括メール添付',
    'conf/ステージング', 'conf/ステージング/Apps Script', 'conf/ステージング/DB', 'conf/ステージング/ログ',
    'pub/協議会基幹システム', 'pub/協議会基幹システム/本番', 'pub/協議会基幹システム/本番/研修案内状',
    'pub/協議会基幹システム/ステージング', 'pub/協議会基幹システム/ステージング/研修案内状', 'pub/協議会基幹システム/ステージング/LINE投稿資材']) {
    assert.ok(keys.includes(k), `${k} が無い`);
  }
  assert.ok(!keys.includes('pub/協議会基幹システム/本番/LINE投稿資材'), '既存のフォルダを移す先に同名を作らない（入れ子にしない）');
  list.forEach((f: { key: string; parentKey: string | null; rootId: string }, i: number) => {
    if (f.parentKey) assert.ok(keys.indexOf(f.parentKey) > -1 && keys.indexOf(f.parentKey) < i, `${f.key} の親が先に無い`);
    assert.equal(f.rootId, f.key.startsWith('conf/') ? 'CONF' : 'PUB');
  });
});

test('計画: マイドライブ直下の「宛名リスト_」で始まる表・ログ・LINE 投稿資材だけ。移し先に既にあるものは飛ばす', () => {
  const { plan } = loadReorg();
  const SHEET = 'application/vnd.google-apps.spreadsheet';
  const rootFiles = [
    { id: 'A1', name: '宛名リスト_全会員_20261001', mimeType: SHEET },
    { id: 'A2', name: '宛名リスト_研修_20261101', mimeType: SHEET },
    { id: 'X1', name: 'メモ宛名リスト_', mimeType: SHEET },
    { id: 'X2', name: '宛名リスト_フォルダ', mimeType: 'application/vnd.google-apps.folder' },
  ];
  const items = plan(rootFiles, { id: 'LOG', parents: ['ROOT'] }, { id: 'LINE', parents: ['ROOT'] },
    { 'conf/本番/宛名リスト': 'F_ATENA', 'conf/本番/ログ': 'F_LOG', 'pub/協議会基幹システム/本番': 'F_PUBPROD' });
  assert.deepEqual(items.map((i: { id: string }) => i.id), ['A1', 'A2', 'LOG', 'LINE']);
  assert.equal(items.find((i: { id: string }) => i.id === 'LINE').targetKey, 'pub/協議会基幹システム/本番');
  assert.equal(items.find((i: { id: string }) => i.id === 'LOG').targetKey, 'conf/本番/ログ');
  const again = plan([], { id: 'LOG', parents: ['F_LOG'] }, null, { 'conf/本番/ログ': 'F_LOG' });
  assert.deepEqual(again, [], '移し先に既にあるもの・未設定は計画に入れない');
});

test('確認と実行の照合: 同じ実行者・30 分以内・計画の指紋が同じときだけ実行できる', () => {
  const { fp, valid } = loadReorg();
  const a = fp(['conf/本番'], [{ id: 'A1', targetKey: 'conf/本番/宛名リスト' }]);
  assert.equal(a, fp(['conf/本番'], [{ id: 'A1', targetKey: 'conf/本番/宛名リスト' }]), '同じ計画は同じ指紋');
  assert.notEqual(a, fp(['conf/本番'], [{ id: 'A2', targetKey: 'conf/本番/宛名リスト' }]), '中身が変われば変わる');
  const now = 1_800_000_000_000;
  const stored = { fingerprint: 'H', operator: 'm@example.invalid', atMs: now - 10 * 60 * 1000 };
  assert.equal(valid(stored, 'H', 'm@example.invalid', now), true);
  assert.equal(valid(stored, 'H2', 'm@example.invalid', now), false, '計画が変わった');
  assert.equal(valid(stored, 'H', 'other@example.invalid', now), false, '別の実行者');
  assert.equal(valid({ ...stored, atMs: now - 31 * 60 * 1000 }, 'H', 'm@example.invalid', now), false, '30 分を過ぎた');
  assert.equal(valid(null, 'H', 'm@example.invalid', now), false, '確認していない');
});

test('戻し: 移したものだけを、記録した元の親へ戻し、共有設定も記録どおりにする', () => {
  const { restore } = loadReorg();
  const ops = restore({ items: [
    { id: 'A1', fromParents: ['ROOT'], toParentId: 'F_ATENA', sharing: { access: 'PRIVATE', permission: 'NONE' }, status: 'moved' },
    { id: 'A2', fromParents: ['ROOT'], toParentId: 'F_ATENA', sharing: { access: 'PRIVATE', permission: 'NONE' }, status: 'recorded' },
    { id: 'L', fromParents: ['P1', 'P2'], toParentId: 'F_PUB', sharing: { access: 'ANYONE_WITH_LINK', permission: 'VIEW' }, status: 'moved' },
  ] });
  assert.deepEqual(ops.map((o: { id: string }) => o.id), ['A1', 'L'], '移す前に止まったものは戻さない');
  assert.equal(ops[1].addParents, 'P1,P2');
  assert.equal(ops[1].removeParents, 'F_PUB');
  assert.deepEqual(ops[1].sharing, { access: 'ANYONE_WITH_LINK', permission: 'VIEW' });
  assert.deepEqual(restore(null), []);
});

test('配線: 5 つのツールは先頭で MASTER を確かめ、実行は移す前に記録を書き、試しは本番と同じ移動・戻しの関数を使う', () => {
  for (const name of ['inventoryDriveAssets_LOG', 'previewDriveReorg_LOG', 'executeDriveReorg_APPLY', 'restoreDriveReorg_APPLY', 'rehearseDriveReorgRoundTrip_APPLY']) {
    const body = extractFunction(name);
    const heads = [`function ${name}() {\n  assertMasterOperator_('${name}');`, `function ${name}() {\n  var session = assertMasterOperator_('${name}');`];
    assert.ok(heads.some((h) => body.startsWith(h)), `${name} の先頭が assertMasterOperator_ でない`);
  }
  const exec = extractFunction('executeDriveReorg_APPLY');
  const recordAt = exec.indexOf("setProperty('DRIVE_REORG_LAST_BATCH'");
  const moveAt = exec.indexOf('driveReorgMoveItem_(');
  assert.ok(recordAt > 0 && moveAt > recordAt, '移す前に記録を書く');
  assert.match(exec, /driveReorgPreviewValid_\(/, '確認と照合する');
  const rehearse = extractFunction('rehearseDriveReorgRoundTrip_APPLY');
  assert.match(rehearse, /driveReorgMoveItem_\(/);
  assert.match(rehearse, /driveReorgRestoreItem_\(/);
  assert.match(rehearse, /setTrashed\(true\)/, '試し用のファイルは最後にゴミ箱へ');
  assert.match(extractFunction('restoreDriveReorg_APPLY'), /driveReorgRestoreItem_\(/);
  assert.match(gas, /var DRIVE_REORG_PUBLIC_DRIVE_ID_ = '0AAdJXEXqX8ImUk9PVA';/);
});
