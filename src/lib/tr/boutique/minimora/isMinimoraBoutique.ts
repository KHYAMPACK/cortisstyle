/** Minimora is a one-off storefront — not a reusable boutique skin. */
export function isMinimoraBoutique(slug: string): boolean {
  return slug.trim().toLowerCase() === "minimora";
}
