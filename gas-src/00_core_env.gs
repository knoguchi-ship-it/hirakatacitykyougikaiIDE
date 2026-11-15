// gas-src/00_core_env.gs — 環境（本番かどうか）・DB の ID・設定のキー。
// build はこのフォルダの .gs を名前順につなげてから 3 つの split を作る（scripts/lib/gas-source.mjs）。

// 2026-11-12 docs/325 手順 0b（一度きり・段 1 のリリースで撤去）: スクリプト全体の評価にかかる時間を計るため、ファイルの最初の文に置く。
var API_PROFILE_EVAL_STARTED_AT_MS_ = Date.now();
var DB_SPREADSHEET_ID_KEY = 'DB_SPREADSHEET_ID';
var DB_SPREADSHEET_NAME = '枚方市ケアマネ協議会_DB';
// AGENTS §3 ハードコーディング原則: 環境識別子は Script Properties の
// DB_SPREADSHEET_ID_OVERRIDE で上書き可能とし、未設定時のみ現行本番の既定値を使う
// （環境切替・DB 移行時にコード改変不要）。IIFE 直書きなのは build pruner の
// 到達性解析に依存しないための意図（feedback_build_pruning_bug）。
// 2026-11-15 環境の分離（TRD §1.8・docs/334 §10.2）: 本番かどうかはスクリプト ID で決める（設定のフラグは
// 設定し忘れると本番扱いになるため使わない）。本番でないプロジェクトは本番 DB を既定値にせず、上書きが
// 本番 DB を指しても空にする（openById が失敗して止まる）。一覧は doGet の振り分けの既定値と同じ 3 つ。
var PRODUCTION_SCRIPT_IDS_ = [
  '11YRlyWVgWRFw5_zByfLnA_vUlZzLeBSgiaanQCvZZoHMAfay8yK7RdkL',
  '1ZKFJKNr4IzbguZvO4KbtSOE1BzkrzOG8OV2tF0RFdk28EnZTCL4Sx3dJ',
  '1tlBJ-OJjqNQQxzb5tY3iRUlS4DmQD9sYqw5j842tXD1SPVHutBUeKTRi'
];
var PRODUCTION_DB_SPREADSHEET_ID_ = '1GVlIzOG1Tsqw8fBXgZ__c8u4oMu-4_WCf0H3aVLESKs';
var DB_SPREADSHEET_ID_FIXED = (function() {
  var production = false;
  try { production = PRODUCTION_SCRIPT_IDS_.indexOf(ScriptApp.getScriptId()) >= 0; } catch (idErr) {}
  var v = '';
  try {
    v = PropertiesService.getScriptProperties().getProperty('DB_SPREADSHEET_ID_OVERRIDE') || '';
  } catch (e) {}
  if (production) return v || PRODUCTION_DB_SPREADSHEET_ID_;
  v = String(v).trim();
  return v && v !== PRODUCTION_DB_SPREADSHEET_ID_ ? v : '';
})();

/** 本番の 3 つのスクリプトのどれかで動いているか。取れなければ本番でないとみなす（fail closed・TRD §1.8） */
function isProductionScript_() {
  try {
    return PRODUCTION_SCRIPT_IDS_.indexOf(ScriptApp.getScriptId()) >= 0;
  } catch (e) {
    return false;
  }
}
var DB_BACKUP_SPREADSHEET_NAME_PREFIX = '枚方市ケアマネ協議会_DB_Backup';
var DB_BACKUP_MANIFEST_SHEET = '_BACKUP_MANIFEST';
var LAST_EXTERNAL_BACKUP_SPREADSHEET_ID_KEY = 'LAST_EXTERNAL_BACKUP_SPREADSHEET_ID';
var LAST_EXTERNAL_BACKUP_SPREADSHEET_URL_KEY = 'LAST_EXTERNAL_BACKUP_SPREADSHEET_URL';
var LAST_EXTERNAL_BACKUP_SUFFIX_KEY = 'LAST_EXTERNAL_BACKUP_SUFFIX';
var SCHEMA_INITIALIZED_KEY = 'DB_SCHEMA_INITIALIZED';
var SCHEMA_INITIALIZED_VERSION_KEY = 'DB_SCHEMA_INITIALIZED_VERSION';
var WITHDRAWAL_POLICY_LAST_APPLIED_DATE_KEY = 'WITHDRAWAL_POLICY_LAST_APPLIED_DATE';
var DEFAULT_BUSINESS_STAFF_LIMIT_KEY = 'DEFAULT_BUSINESS_STAFF_LIMIT';
var TRAINING_HISTORY_LOOKBACK_MONTHS_KEY = 'TRAINING_HISTORY_LOOKBACK_MONTHS';
var LOCK_WAIT_TIMEOUT_MS = 10000; // AGENTS §3: LockService 待機の共通タイムアウト
var ALL_DATA_CACHE_TTL_SECONDS = 600;
var ANNUAL_FEE_CACHE_TTL_SECONDS = 600;
// 版を上げるリリースの前に rehearseSchemaMigrationOnCopy_APPLY を本番 DB のコピーで流し、OK を確かめてから上げる。
// push するとトリガーが最新のコードで動くため、先に上げて push すると確かめる前に本番で整備が走る。
// 2026-10-19: BR-21 の 4 列。リハーサル OK（既存データの変化 0・2 回目の変化 0・書いて読む 22 列）
// 2026-10-25: T_支払い.職員ID（末尾）。リハーサル OK（既存データの変化 0・2 回目の変化 0・書いて読む 34 列・docs/311）
// 2026-10-25: 数字の文字列の列を書式なしテキストに（TEXT_FORMAT_COLUMNS_）。リハーサル OK（変化 0・書いて読む 83 列・同じ数字の文字列へ 797 セル・docs/311 §5.5）
// 2026-10-25: T_画面文テンプレート（案内文の定型文・docs/313）。リハーサル OK（既存データの変化 0・2 回目の変化 0・シート 1 追加・設定 4 行追加）
var DB_SCHEMA_VERSION = '2026-10-25-screen-text-templates-v376.135';

// v251: 会員専用 split プロジェクト URL を正本とする（scriptId ベースルーティング移行）
// AGENTS §3: Script Properties の MEMBER_PORTAL_URL_OVERRIDE で上書き可能（deployment 変更時にコード改変不要）
var MEMBER_PORTAL_URL = (function() {
  try {
    var v = PropertiesService.getScriptProperties().getProperty('MEMBER_PORTAL_URL_OVERRIDE');
    if (v) return v;
  } catch (e) {}
  return 'https://script.google.com/macros/s/AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g/exec';
})();
