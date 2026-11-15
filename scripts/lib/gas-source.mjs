// Apps Script の元のコード（gas-src/*.gs）を 1 つにつなげて返す（2026-11-15）。
// 以前は gas-src/Code.full.gs の 1 ファイルだった。領域ごとのファイルに分けたが、Apps Script は
// プロジェクトの .gs を全部つなげて 1 つの空間で動かすので、build も検査もつなげたものを相手にする。
// つなげる順はファイル名の順（先頭の番号）。読み込み時に他の定数を使う文があるので、00_core_env が先頭。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const GAS_SOURCE_DIR = 'gas-src';

export function gasSourceFiles(root = DEFAULT_ROOT) {
  const dir = path.join(root, GAS_SOURCE_DIR);
  return fs.readdirSync(dir).filter((f) => f.endsWith('.gs')).sort().map((f) => path.join(dir, f));
}

export function readGasSource(root = DEFAULT_ROOT) {
  const files = gasSourceFiles(root);
  if (!files.length) throw new Error(`${GAS_SOURCE_DIR}/ に .gs がありません`);
  return files.map((f) => fs.readFileSync(f, 'utf8')).join('');
}
