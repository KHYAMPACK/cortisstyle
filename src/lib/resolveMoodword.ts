/** Editorial moodword — text after an em/en dash in the outfit name, or a fallback label. */
export function resolveMoodwordFromOutfitName(
  name: string,
  emptyFallback = "Archive",
): string {
  const trimmed = name.trim();
  if (!trimmed) return emptyFallback;

  const parts = trimmed.split(/\s*[—–-]\s*/);
  const tail = parts[parts.length - 1]?.trim();

  if (parts.length > 1 && tail) {
    return tail;
  }

  return trimmed;
}
