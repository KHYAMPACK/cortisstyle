/**
 * Lower-case text for searching in Turkish. Turkish lower-casing turns "I" into
 * "ı", so a plain `toLocaleLowerCase("tr")` on both sides fails to match "VIP"
 * with "vip" or "ELBISE" with "Elbise". Here "I", "İ", "ı" and "i" all fold to
 * "i" (and everything else lower-cases the Turkish way), on both sides of the
 * comparison.
 */
export function foldForSearch(value: string): string {
  return value.replace(/[İIı]/g, "i").toLocaleLowerCase("tr-TR");
}
