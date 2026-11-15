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
