/**
 * Placeholder standalone tenant — same pattern as Minimora
 * (src/lib/tr/boutique/minimora/isMinimoraBoutique.ts): a one-off
 * storefront skin, not a reusable boutique template.
 *
 * TODO(rename): once the real brand name + slug are decided,
 * rename this file/function/slug and everything under
 * src/components/tr/boutique/newtenant/ to match — a simple
 * find-replace of "newtenant" is enough, nothing else changes.
 */
export function isNewTenantBoutique(slug: string): boolean {
  return slug.trim().toLowerCase() === "newtenant";
}
