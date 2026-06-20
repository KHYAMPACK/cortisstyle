/** Single editorial moodword — last token after dash segment, or fallback. */
export function resolveMoodwordFromOutfitName(
  name: string,
  emptyFallback = "Style",
): string {
  const trimmed = name.trim();
  if (!trimmed) return emptyFallback;

  const segments = trimmed.split(/\s*[—–-]\s*/);
  const phrase =
    segments.length > 1
      ? (segments[segments.length - 1]?.trim() ?? "")
      : trimmed;

  if (!phrase) return emptyFallback;

  const words = phrase.split(/\s+/).filter(Boolean);
  const lastWord = words[words.length - 1];

  return lastWord || emptyFallback;
}
