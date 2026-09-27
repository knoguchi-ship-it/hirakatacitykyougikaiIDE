/** docs/288_FEATURE_INVENTORY.md の生成ブロックを更新する。 */
import { readFileSync, writeFileSync } from 'node:fs';
import { DOC_PATH, applyToDoc, readGasSource, renderInventory } from './feature-inventory.mjs';

const rendered = renderInventory(readGasSource());
const before = readFileSync(DOC_PATH, 'utf8');
const after = applyToDoc(before, rendered);
if (before === after) {
  console.log(`${DOC_PATH} は最新（変更なし）`);
} else {
  writeFileSync(DOC_PATH, after, 'utf8');
  console.log(`${DOC_PATH} を更新`);
}
