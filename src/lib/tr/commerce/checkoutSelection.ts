/** Persist which cart lines should proceed to boutique checkout. */

const keyFor = (boutiqueSlug: string) =>
  `cortis-tr-checkout-selection:${boutiqueSlug.trim().toLowerCase()}`;

export function saveBoutiqueCheckoutSelection(
  boutiqueSlug: string,
  lineKeys: string[],
): void {
  if (typeof window === "undefined") return;
  const slug = boutiqueSlug.trim();
  if (!slug) return;
  try {
    sessionStorage.setItem(keyFor(slug), JSON.stringify(lineKeys));
  } catch {
    // private mode / quota — checkout falls back to full cart
  }
}

export function loadBoutiqueCheckoutSelection(
  boutiqueSlug: string,
): string[] | null {
  if (typeof window === "undefined") return null;
  const slug = boutiqueSlug.trim();
  if (!slug) return null;
  try {
    const raw = sessionStorage.getItem(keyFor(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    return null;
  }
}

export function clearBoutiqueCheckoutSelection(boutiqueSlug: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(keyFor(boutiqueSlug.trim()));
  } catch {
    // ignore
  }
}
