export const normalizeSearchText = (value: unknown): string =>
  String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .trim();

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
