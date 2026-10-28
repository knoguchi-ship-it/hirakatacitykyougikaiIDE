/**
 * ローカル検査が通るのに `clasp run` だけが失敗したときの本番切り分け用。
 * fixture は機能群名だけを渡し、設定値・メール本文・送信元は標準出力に出さない。
 * 書込みを行う action は受理しない。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureDir = path.join(root, 'test-fixtures', 'clasp-system-settings');
const requested = process.argv.slice(2);
const names = requested.length ? requested : fs.readdirSync(fixtureDir).filter((name) => name.endsWith('.json')).sort();

function classifyRunFailure(result) {
  const detail = `${result.stderr || ''}\n${result.stdout || ''}`;
  if (/Unexpected token|valid JSON/i.test(detail)) return 'PARAMS_JSON_INVALID';
  if (/oauth2\.googleapis\.com\/token|token failed/i.test(detail)) return 'AUTH_TOKEN_REQUEST_FAILED';
  if (/EACCES|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(detail)) return 'NETWORK_OR_EXECUTION_UNAVAILABLE';
  return 'CLASP_RUN_FAILED';
}

function buildClaspParams(action, params) {
  // Node から clasp の JavaScript entrypoint を直接起動する。cmd.exe / npx.cmd を
  // 通さないため、WindowsでもJSONの二重引用符はそのまま渡せる。
  return JSON.stringify([action, params]);
}

let failed = false;
for (const name of names) {
  const file = name.endsWith('.json') ? name : `${name}.json`;
  const fixturePath = path.join(fixtureDir, file);
  if (!fs.existsSync(fixturePath)) {
    console.error(`FIXTURE_NOT_FOUND ${file}`);
    failed = true;
    continue;
  }
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  if (fixture.action !== 'checkSystemSettingsPatch') {
    console.error(`FIXTURE_ACTION_REJECTED ${file}`);
    failed = true;
    continue;
  }
  const params = buildClaspParams(fixture.action, fixture.params || {});
  const claspEntry = path.join(root, 'node_modules', '@google', 'clasp', 'build', 'src', 'index.js');
  const result = spawnSync(process.execPath, [claspEntry, 'run', 'processApiRequest', '--params', params], {
    cwd: path.join(root, 'gas', 'admin'), encoding: 'utf8', shell: false,
  });
  if (result.status !== 0) {
    const exitCode = result.status == null ? 'none' : String(result.status);
    const processError = result.error && result.error.code ? String(result.error.code) : 'none';
    console.error(`FIXTURE_RUN_FAILED ${fixture.name || file} reason=${classifyRunFailure(result)} exit=${exitCode} processError=${processError}`);
    failed = true;
    continue;
  }
  let response;
  try {
    response = JSON.parse(result.stdout);
  } catch {
    console.error(`FIXTURE_RESPONSE_INVALID ${fixture.name || file}`);
    failed = true;
    continue;
  }
  const data = response && response.data;
  if (!response.success || !data || data.valid !== fixture.expect.valid || data.writes !== fixture.expect.writes) {
    const reason = response && response.error === 'unsupported_action' ? 'UNSUPPORTED_ACTION' : 'REMOTE_RESPONSE_REJECTED';
    console.error(`FIXTURE_ASSERTION_FAILED ${fixture.name || file} reason=${reason}`);
    failed = true;
    continue;
  }
  console.log(`FIXTURE_OK ${fixture.name || file} checked=${data.checkedFieldCount} planned=${data.plannedSettingCount}`);
}
process.exit(failed ? 1 : 0);
