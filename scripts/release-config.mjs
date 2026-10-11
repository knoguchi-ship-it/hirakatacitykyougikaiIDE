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
