export function buildLabeledContent(pageTexts: string[], from: number, to: number): string {
  const start = Math.max(1, Math.min(from, pageTexts.length));
  const end = Math.max(start, Math.min(to || pageTexts.length, pageTexts.length));

  return pageTexts
    .slice(start - 1, end)
    .map((text, i) => '[Página ' + (start + i) + ']\n' + text)
    .join('\n\n');
}

/**
 * Same as buildLabeledContent, but when the range is too large for maxChars it
 * samples pages evenly across the whole range instead of just keeping the
 * beginning — so "todo el texto completo" actually covers every chapter, not
 * only the first one.
 */
export function buildLabeledContentForBudget(pageTexts: string[], from: number, to: number, maxChars: number): string {
  const full = buildLabeledContent(pageTexts, from, to);
  if (full.length <= maxChars) return full;

  const start = Math.max(1, Math.min(from, pageTexts.length));
  const end = Math.max(start, Math.min(to || pageTexts.length, pageTexts.length));
  const totalPages = end - start + 1;

  const sampleSize = Math.min(totalPages, 25);
  const perPageBudget = Math.max(200, Math.floor(maxChars / sampleSize));
  const pageNumbers = [...new Set(Array.from({ length: sampleSize }, (_, i) => start + Math.floor((i / sampleSize) * totalPages)))];

  let out = '';
  for (const pageNum of pageNumbers) {
    const chunk = '[Página ' + pageNum + ']\n' + pageTexts[pageNum - 1].slice(0, perPageBudget) + '\n\n';
    if (out.length + chunk.length > maxChars) break;
    out += chunk;
  }
  return out.trim();
}
