// v360-fix: 研修名簿の CSV 出力ユーティリティ。
// SheetJS の dynamic import は `import.meta.url` を bundle に漏らし、
// compress-html.mjs の `new Function()` ラッパー（GAS CSP 制約のため必須）と
// 非互換。v351 と同類の罠のため、xlsx を完全除去し CSV (UTF-8 BOM) のみ提供する。
// Excel は CSV を直接開ける（BOM 付きで文字化け回避済み）。

export type SheetCell = string | number | boolean | null | undefined;
export type SheetRow = SheetCell[];

/**
 * 2D 配列を xlsx 拡張子で保存（中身は CSV）。Excel で開ける互換出力。
 * 名前互換のため downloadAsXlsx を保持するが、内部実装は CSV。
 */
export async function downloadAsXlsx(
  rows: SheetRow[],
  fileName: string,
  _sheetName: string = 'Sheet1',
): Promise<void> {
  // .xlsx → .csv に拡張子を置換（Excel で開ける CSV を提供）
  const csvName = fileName.replace(/\.xlsx$/i, '.csv');
  downloadAsCsv(rows, csvName);
}

/**
 * 2D 配列を CSV (UTF-8 BOM 付き) としてダウンロードさせる。Excel での文字化け回避用。
 */
export function downloadAsCsv(rows: SheetRow[], fileName: string): void {
  const escape = (v: SheetCell): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const csv = rows.map((row) => row.map(escape).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
