/**
 * 検査用の偽の Sheets REST（values:batchGetByDataFilter）。本物と同じ形で答える（docs/332 §10.5）。
 *   - 範囲は本文の dataFilters[].a1Range（"'表'!C1:C" の列の範囲、または "'表'" の表全体）
 *   - 応答は valueRanges[].valueRange.values と dataFilters
 *   - majorDimension が COLUMNS なら列ごと、ROWS なら行ごと。末尾の空セルは本物と同じく省く
 *   - 表が無い範囲が 1 つでもあれば、本物と同じく全体が失敗（400）
 * 読んだ列の見出しを onRead に知らせる（パスワードの列を読んでいないかなどを確かめるため）。
 */
type Matrix = unknown[][];

function letterToIndex(letters: string): number {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}
function trimTrailing(values: unknown[]): unknown[] {
  const out = values.slice();
  while (out.length && (out[out.length - 1] === '' || out[out.length - 1] === undefined || out[out.length - 1] === null)) out.pop();
  return out;
}

export function fakeSheetsRest(matrixOf: (sheet: string) => Matrix | null, onRead?: (sheet: string, headers: string[]) => void) {
  const calls: Array<{ ranges: string[]; majorDimension: string }> = [];
  return {
    calls,
    fetch: (_url: string, opts: { payload: string }) => {
      const body = JSON.parse(opts.payload);
      const ranges: string[] = body.dataFilters.map((d: { a1Range: string }) => d.a1Range);
      const majorDimension = body.majorDimension || 'ROWS';
      calls.push({ ranges, majorDimension });
      const valueRanges = [];
      for (const range of ranges) {
        const m = range.match(/^'(.+)'(?:!([A-Z]+)1:([A-Z]+))?$/);
        const matrix = m ? matrixOf(m[1]) : null;
        if (!m || !matrix) return { getResponseCode: () => 400, getContentText: () => '{}' };
        let values: unknown[][];
        if (m[2]) {
          const idx = letterToIndex(m[2]);
          const column = trimTrailing(matrix.map((row) => row[idx]));
          onRead?.(m[1], [String(matrix[0]?.[idx] ?? '')]);
          values = majorDimension === 'COLUMNS' ? [column] : column.map((v) => [v]);
        } else {
          onRead?.(m[1], (matrix[0] || []).map((h) => String(h)));
          values = majorDimension === 'COLUMNS'
            ? (matrix[0] || []).map((_, c) => trimTrailing(matrix.map((row) => row[c])))
            : matrix.map((row) => trimTrailing(row));
        }
        valueRanges.push({ valueRange: { values }, dataFilters: [{ a1Range: range }] });
      }
      return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ valueRanges }) };
    },
  };
}
