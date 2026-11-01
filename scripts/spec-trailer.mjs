/**
 * 仕様書の追従確認（Spec: 行）の判定 — hook（guard-bash H8）と prerelease（test:spec-trailer）の共通部品。
 * 2026-11-01 operator 決定: 機能のコードを変えたコミットは、仕様書（docs/spec/）を確かめた結果を
 * コミットメッセージの `Spec:` 行に残す。手順の正本は Skill `/spec-sync`。
 *
 * 書き方:
 *   Spec: docs/spec/02_RD.md §2-4・BR-22 を追加      … 仕様書を直した（docs/spec/ のパスを含める）
 *   Spec: 不要（画面の文言だけで仕様書に記載なし）    … 直さなくてよい理由を（）の中に書く
 *   Spec-For: 1a2b3c4 docs/spec/02_RD.md …            … Spec: 行の無い過去のコミットを後から補う
 */

/** 仕様書の確認が要る「機能のコード」。生成物（backend/・gas/）・検査（scripts/）・文書は対象外 */
export const FUNCTIONAL_PATH_PREFIXES = ['gas-src/', 'src/'];

export function isFunctionalPath(file) {
  const p = String(file || '').replace(/\\/g, '/').replace(/^\.\//, '');
  return FUNCTIONAL_PATH_PREFIXES.some((prefix) => p.startsWith(prefix));
}

/** Spec: の値が書式どおりか。理由を返す（null なら合格） */
export function specValueProblem(value) {
  const v = String(value || '').trim();
  if (!v) return '`Spec:` の後が空です。';
  if (/^不要\s*[（(]\s*[^）)\s][^）)]*[）)]/.test(v)) return null;
  if (/^不要/.test(v)) return '`Spec: 不要` には理由を（）で書いてください。例: `Spec: 不要（検査の追加だけで動きは変えていない）`';
  if (/docs\/spec\/\S+/.test(v)) return null;
  return '`Spec:` には直した仕様書のパス（docs/spec/…）か、`不要（理由）` を書いてください。';
}

/** メッセージ中の Spec: 行を探す。{ found, problem, value } */
export function findSpecLine(message) {
  const lines = String(message || '').replace(/\r\n/g, '\n').split('\n');
  for (const raw of lines) {
    // `-m "Spec: …"` のように引用符の直後に来る場合も拾う
    const m = raw.match(/^\s*["']?\s*Spec:\s*(.*?)\s*["']?\s*$/);
    if (m) return { found: true, value: m[1], problem: specValueProblem(m[1]) };
  }
  return { found: false, value: '', problem: 'コミットメッセージに `Spec:` 行がありません。' };
}

/** Spec-For: <hash> … で補われたコミットの短縮ハッシュ一覧 */
export function findSpecForHashes(message) {
  const out = [];
  for (const raw of String(message || '').replace(/\r\n/g, '\n').split('\n')) {
    const m = raw.match(/^\s*Spec-For:\s*([0-9a-f]{7,40})\s+(.+)$/i);
    if (m && !specValueProblem(m[2])) out.push(m[1].toLowerCase());
  }
  return out;
}

/** この基点より後のコミットを prerelease で確かめる（仕組みを入れる直前の HEAD） */
export const SPEC_TRAILER_BASE = '4a71e2a';
