// リリースで扱う Apps Script プロジェクトと固定 deployment の唯一の定義（2026-10-11 新設）。
//
// 使う側:
//   - scripts/release-push.mjs      3 プロジェクトを順に push し、全部成功したときだけ記録を残す
//   - scripts/verify-deployments.mjs 固定 deployment 4 本の向き先を本番から読み、HANDOVER と突き合わせる
//   - .claude/hooks/guard-bash.mjs   記録と一致しない `clasp create-version` を止める
//
// 人が読む表は docs/09_DEPLOYMENT_POLICY.md §2。ID のずれは test:guards が落とす。
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * dir: clasp を実行するディレクトリ（リポジトリ直下からの相対）
 * filesDir: 実際に push されるファイルの置き場（.clasp.json の rootDir）
 */
export const CLASP_PROJECTS = [
  {
    key: 'public',
    dir: '.',
    filesDir: 'backend',
    deployments: [
      'AKfycbywpWoYxij6A-ZunIeBjG1Q8qX78PMMTsT3frx1cM5PJ2nAuZpz81KruXb5LIvWgbQx',
      'AKfycbxyuUXgK1oHUDMahQjluiL-gcrMK0qV0FWLFYaYBqGxlRSg9NhvmbyQRyf0dvaqg7Zp',
    ],
  },
  {
    key: 'member',
    dir: 'gas/member',
    filesDir: 'gas/member',
    deployments: ['AKfycbxd_6HlH5aWLhxYOtLUHehI3ODiHg4fpc5SCzNdEBIDbDpaBuU3KTuqDRbeBmhWZxSQ_g'],
  },
  {
    key: 'admin',
    dir: 'gas/admin',
    filesDir: 'gas/admin',
    deployments: ['AKfycbwSCTTyvWY_cFG764XawdbqA8r0qxYbav4aDZ-BK9rRmvXHoUXrKQnQ9egRGqWcx4Os'],
  },
];

export const PUSH_MARKER = path.join('.tmp', 'clasp-push-ok.json');
export const PRERELEASE_MARKER = path.join('.tmp', 'prerelease-ok.json');

const PUSHED_EXTENSIONS = ['.gs', '.js', '.html', '.json'];

/** push されるファイル（.clasp.json を除く直下の .gs/.js/.html/.json）の中身から作る指紋 */
export function projectFilesHash(root, project) {
  const dir = path.join(root, project.filesDir);
  const files = fs.readdirSync(dir)
    .filter((f) => PUSHED_EXTENSIONS.includes(path.extname(f)) && !f.startsWith('.clasp'))
    .sort();
  const h = crypto.createHash('sha256');
  for (const f of files) {
    h.update(f + '\0');
    h.update(fs.readFileSync(path.join(dir, f)));
    h.update('\0');
  }
  return h.digest('hex');
}

/** clasp を実行したディレクトリ（絶対パス）から、どのプロジェクトかを決める。分からなければ null */
export function projectForDir(root, absDir) {
  const rel = path.relative(root, absDir).split(path.sep).join('/') || '.';
  return CLASP_PROJECTS.find((p) => p.dir === rel || p.filesDir === rel) || null;
}

// ── ステージング（2026-11-15・docs/334 §10.3） ─────────────────────────────
// 本番の CLASP_PROJECTS とは別の一覧。push するのは本番と同じ生成物（sourceDir）を .tmp/staging/<key>/ に写したもの。
// scriptId・deployment はプロジェクトを作った後・operator が deployment を作った後に書く。
// 空の scriptId があれば release:staging は止まり、空の deployment はその split の向け替えを飛ばす。
// 本番の ID と重なったら止まる（stagingConfigProblems・test:guards）。
export const STAGING_PROJECTS = [
  { key: 'public', sourceDir: 'backend', scriptId: '1RpIhxQQAaHVOslu_M81tnpWjuccR3DZmV8nq5ZeoR0F-4aWIwBTLngKB', deployment: 'AKfycbw_jVsKqeVRlJPqDp_ycTQQ9BuJtRvFgRpmp3vaSRub5Onp2mbupeKkGyXhLSQWQuOu' },
  { key: 'member', sourceDir: 'gas/member', scriptId: '1bbQNI3svQ-yH4_1WywAQM7ViwkOoRuoVfXLrJOs2e_pckNGyH5p7SKAu', deployment: 'AKfycbz42W_Bvd1LZgTreD1E2809YLLWbAo2zK9tN2IOh3dvJ3nddUiUB7FEYh_LAAfCkD9JKQ' },
  { key: 'admin', sourceDir: 'gas/admin', scriptId: '1FUQsPygGwXRr-SYi7N-mxVuPp02--bhwIntZZMV5ZvTHZ2HW--nvcLKW', deployment: 'AKfycbw6yfF7VfIKptVKzKFhgrZMwBjmdSv85TNfpUT9YSOJLOBV3b1krymiha1KeUNL43Op' },
];
export const STAGING_WORK_ROOT = path.join('.tmp', 'staging');
export const STAGING_MARKER = path.join('.tmp', 'clasp-staging-ok.json');

/** 本番のスクリプト ID（本番の各 .clasp.json から読む） */
export function productionScriptIds(root) {
  return CLASP_PROJECTS.map((p) => JSON.parse(fs.readFileSync(path.join(root, p.dir, '.clasp.json'), 'utf8')).scriptId);
}

/**
 * ステージングの定義の問題を列挙する（空なら問題なし）。本番の ID を 1 つでも含んでいたら必ず問題にする。
 * prodScriptIds / prodDeployments は本番の値（引数で渡すのは検査のため）。
 */
export function stagingConfigProblems(staging, prodScriptIds, prodDeployments) {
  const problems = [];
  const keys = staging.map((p) => p.key).sort().join(',');
  if (keys !== 'admin,member,public') problems.push(`split の一覧が public・member・admin ではありません（${keys}）`);
  const seen = new Set();
  for (const p of staging) {
    if (!p.scriptId) problems.push(`${p.key}: スクリプト ID が未設定です`);
    if (p.scriptId && prodScriptIds.includes(p.scriptId)) problems.push(`${p.key}: スクリプト ID が本番のものです`);
    if (p.deployment && prodDeployments.includes(p.deployment)) problems.push(`${p.key}: deployment が本番のものです`);
    for (const id of [p.scriptId, p.deployment].filter(Boolean)) {
      if (seen.has(id)) problems.push(`${p.key}: ID が重複しています（${id}）`);
      seen.add(id);
    }
    const prodSource = CLASP_PROJECTS.find((c) => c.key === p.key);
    if (!prodSource || prodSource.filesDir !== p.sourceDir) problems.push(`${p.key}: 写す元が本番の生成物の場所と違います（${p.sourceDir}）`);
  }
  return problems;
}

/** push するファイル（projectFilesHash と同じ選び方）の一覧 */
export function pushedFiles(root, sourceDir) {
  return fs.readdirSync(path.join(root, sourceDir))
    .filter((f) => PUSHED_EXTENSIONS.includes(path.extname(f)) && !f.startsWith('.clasp'))
    .sort();
}

/** 写した先に置く .clasp.json（rootDir は写した先そのもの） */
export function stagingClaspJson(scriptId) {
  return JSON.stringify({
    scriptId, rootDir: '', scriptExtensions: ['.js', '.gs'], htmlExtensions: ['.html'], jsonExtensions: ['.json'],
    filePushOrder: [], skipSubdirectories: false,
  }, null, 2) + '\n';
}

// 本番の push はリポジトリ直下の .claspignore で古い Code.js（2026-04 の残り）を除いている。写した先には .claspignore が
// 無いので、同じものを写さない（写すと Code.gs と衝突して clasp が "Conflicting files found" で止まる・2026-11-15）。
export const STAGING_EXCLUDED_FILES = ['Code.js'];

/** ステージングへ写すファイル（push と同じ選び方から、本番の .claspignore が除いているものを除く） */
export function stagingPushFiles(root, sourceDir) {
  return pushedFiles(root, sourceDir).filter((f) => !STAGING_EXCLUDED_FILES.includes(f));
}
