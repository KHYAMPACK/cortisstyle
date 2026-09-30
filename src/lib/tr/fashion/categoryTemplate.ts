import type { TrCategoryTemplateEntry } from "@/lib/tr/categories/types";
import {
  canonicalizeTrCategoryId,
  listAssignableTrCategories,
  listTrCategoryRoots,
  TR_BOUTIQUE_CATEGORIES,
} from "@/lib/tr/fashion/categories";

/**
 * The built-in garment tree as a template for "Hazır kategorileri içe aktar": the
 * roots and shop leaves, with the built-in ids as keys (so they become the slugs and
 * system keys). Hidden style variants (kaşe mont, kot pantolon…) and the legacy "Dış
 * giyim" root are left out (Mert, 2026-09-30); products on a variant are filed under its
 * shop leaf through `fashionCategoryAliases`.
 */
export function fashionCategoryTemplate(): TrCategoryTemplateEntry[] {
  const out: TrCategoryTemplateEntry[] = [];
  const seen = new Set<string>();
  for (const entry of [...listTrCategoryRoots(), ...listAssignableTrCategories()]) {
    if (seen.has(entry.id) || entry.id === "dis-giyim") continue;
    seen.add(entry.id);
    out.push({ key: entry.id, name: entry.label, parentKey: entry.parentId ?? null });
  }
  return out;
}

/** Hidden style variants → the shop leaf they belong under (`kase-kaban` → `mont`). */
export function fashionCategoryAliases(): Record<string, string> {
  const keys = new Set(fashionCategoryTemplate().map((entry) => entry.key));
  const aliases: Record<string, string> = {};
  for (const entry of TR_BOUTIQUE_CATEGORIES) {
    if (keys.has(entry.id)) continue;
    const leaf = canonicalizeTrCategoryId(entry.id);
    if (leaf && keys.has(leaf)) aliases[entry.id] = leaf;
  }
  return aliases;
}
