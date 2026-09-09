export function extractiveSummary(text: string, maxSentences = 8): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return '';

  const sentences = clean.match(/[^.!?]+[.!?]+/g) ?? [clean];
  const picked = sentences.slice(0, maxSentences).join(' ').trim();
  return picked || clean.slice(0, 600);
}
