export function buildLabeledContent(pageTexts: string[], from: number, to: number): string {
  const start = Math.max(1, Math.min(from, pageTexts.length));
  const end = Math.max(start, Math.min(to || pageTexts.length, pageTexts.length));

  return pageTexts
    .slice(start - 1, end)
    .map((text, i) => '[Página ' + (start + i) + ']\n' + text)
    .join('\n\n');
}
