// v362: \u65e5\u672c\u8a9e\u691c\u7d22\u306e\u6b63\u898f\u5316\u3002\u534a\u89d2\u30ab\u30ca / \u5168\u89d2\u30ab\u30ca / \u5168\u89d2\u3072\u3089\u304c\u306a \u306e\u3044\u305a\u308c\u306e\u5165\u529b\u3067\u3082
// \u540c\u4e00\u8996\u3067\u304d\u308b\u3088\u3046\u3001NFKC\uff08\u534a\u89d2\u2194\u5168\u89d2\u7d71\u4e00\uff09+ \u3072\u3089\u304c\u306a\u2192\u30ab\u30bf\u30ab\u30ca\u7d71\u4e00 + NFC\uff08\u6fc1\u70b9\u5408\u6210\uff09
// \u3092\u4e00\u62ec\u9069\u7528\u3059\u308b\u3002\u3053\u308c\u306b\u3088\u308a matchesSearchQuery \u3092\u4f7f\u3046\u5168\u30b3\u30f3\u30bd\u30fc\u30eb\u3067\u30d5\u30ea\u30ac\u30ca\u691c\u7d22\u304c
// \u5f62\u5f0f\u306b\u4f9d\u5b58\u305b\u305a\u30de\u30c3\u30c1\u3059\u308b\u3002
//
// \u9806\u5e8f: trim \u2192 toLowerCase \u2192 NFKC \u2192 toKatakana \u2192 NFC
//   - NFKC: \u534a\u89d2\u30ab\u30ca\u300c\uff71\u300d\u2192 \u5168\u89d2\u30ab\u30ca\u300c\u30a2\u300d\u3001\u5168\u89d2\u82f1\u6570\u300c\uff21\u300d\u2192 \u534a\u89d2\u82f1\u6570\u300ca\u300d\u3092\u7d71\u4e00
//   - toKatakana: \u300c\u3042\u300d\u2192\u300c\u30a2\u300d\u3092\u7d71\u4e00\uff08NFKC \u306f\u30ab\u30ca\u7a2e\u5225\u3092\u5909\u3048\u306a\u3044\u305f\u3081\u5225\u9014\u5fc5\u8981\uff09
//   - NFC: \u300c\u30ab + \u6fc1\u70b9\u300d\u3092\u5408\u6210\u5f62\u300c\u30ac\u300d\u3078\uff08NFKC \u306f decompose \u5f8c\u518d compose \u3059\u308b\u304c\u3001
//     \u5ff5\u306e\u305f\u3081\u660e\u793a\uff09
//
// \u30d1\u30d5\u30a9\u30fc\u30de\u30f3\u30b9: 1 \u56de\u547c\u3073\u51fa\u3057\u3067 4 \u6bb5\u968e\u306e\u6587\u5b57\u5217\u64cd\u4f5c\u3002\u30af\u30e9\u30a4\u30a2\u30f3\u30c8\u5074\u30d5\u30a3\u30eb\u30bf\u306e
// \u4f53\u611f\u306b\u5f71\u97ff\u3057\u306a\u3044\u7bc4\u56f2\uff08\u6570\u5343\u4ef6\u30fb\u6570\u5341\u6587\u5b57\u7a0b\u5ea6\u3092\u60f3\u5b9a\uff09\u3002

const HIRAGANA_TO_KATAKANA_DIFF = 0x60; // \u3041 U+3041 \u2192 \u30a1 U+30A1, ... \u3096 U+3096 \u2192 \u30f6 U+30F6

/** \u3072\u3089\u304c\u306a\uff08U+3041\u301cU+3096\uff09\u3092\u30ab\u30bf\u30ab\u30ca\uff08U+30A1\u301cU+30F6\uff09\u3078\u7d71\u4e00\u3059\u308b\u3002 */
const toKatakana = (s: string): string =>
  s.replace(/[\u3041-\u3096]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) + HIRAGANA_TO_KATAKANA_DIFF),
  );

export const normalizeSearchText = (value: unknown): string =>
  toKatakana(
    String(value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFKC'),
  ).normalize('NFC');

export const compactSearchText = (value: unknown): string =>
  normalizeSearchText(value).replace(/[\s\u3000]+/g, '');

export const matchesSearchQuery = (query: string, values: unknown[]): boolean => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const normalizedHaystack = values.map(normalizeSearchText).join(' ');
  const compactHaystack = values.map(compactSearchText).join('');
  const compactQuery = compactSearchText(normalizedQuery);

  if (compactQuery && compactHaystack.includes(compactQuery)) return true;

  return normalizedQuery
    .split(/[\s\u3000]+/)
    .filter(Boolean)
    .every((term) => normalizedHaystack.includes(term) || compactHaystack.includes(compactSearchText(term)));
};
