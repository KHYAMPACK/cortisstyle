/** Longest slug the SEO card accepts (ikas uses the same limit). */
export const SLUG_MAX_LENGTH = 185;

const TURKISH_LETTERS: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  â: "a",
  î: "i",
  û: "u",
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A product id. Slugs must never look like one: the product page tells them apart by shape. */
export function looksLikeUuid(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

/** Lowercase, Turkish letters and accents folded to a-z, everything else a hyphen. */
function fold(text: string): string {
  return text
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşüâîû]/g, (letter) => TURKISH_LETTERS[letter] ?? letter)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-");
}

function clamp(slug: string): string {
  return slug.slice(0, SLUG_MAX_LENGTH).replace(/-+$/, "");
}

/** A finished slug from free text, e.g. "Keten Gömlek Elbise" → "keten-gomlek-elbise". May be empty. */
export function slugify(text: string): string {
  return clamp(fold(text).replace(/^-+|-+$/g, ""));
}

/**
 * For the slug field while typing: same folding, but a trailing hyphen is kept so
 * "keten-" can become "keten-gomlek" without the hyphen vanishing under the cursor.
 */
export function sanitizeSlugInput(raw: string): string {
  return fold(raw).replace(/^-+/, "").slice(0, SLUG_MAX_LENGTH);
}

export function isValidSlug(slug: string): boolean {
  return (
    slug.length > 0 &&
    slug.length <= SLUG_MAX_LENGTH &&
    /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) &&
    !looksLikeUuid(slug)
  );
}

/** `base`, `base-2`, `base-3`… kept within the length limit. */
export function slugWithSuffix(base: string, attempt: number): string {
  if (attempt <= 1) return base;
  const suffix = `-${attempt}`;
  return clamp(base.slice(0, SLUG_MAX_LENGTH - suffix.length)) + suffix;
}

/**
 * First free slug for `base`. `isTaken` asks the database; it is injected so the
 * rule ("add -2, -3 …") is testable without one.
 */
export async function generateUniqueSlug(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>,
  maxAttempts = 50,
): Promise<string> {
  const start = base && !looksLikeUuid(base) ? base : "urun";
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const candidate = slugWithSuffix(start, attempt);
    if (!(await isTaken(candidate))) return candidate;
  }
  throw new Error("Uygun bir slug bulunamadı.");
}
