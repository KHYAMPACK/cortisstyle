import { isValidSlug, slugify } from "@/lib/tr/seo/slug";
import type { TrCategoryTemplateEntry } from "@/lib/tr/categories/types";

/**
 * Turning a vertical's ready-made category tree into a boutique's own categories
 * ("Hazır kategorileri içe aktar"). Pure: the DB side is `importCategoryTemplate`.
 *
 * Each template entry becomes a category whose slug and system key are its key, so a
 * product's stored category (`tr_products.category`, e.g. `elbise`) matches the new
 * category's slug and nothing about the product or its URL changes. A product whose
 * category isn't in the template (a hidden style variant, a name the owner typed) is
 * mapped through `aliases` or, failing that, gets a top-level category of its own, so
 * no product loses its category.
 */
export interface CategoryImportEntry {
  slug: string;
  name: string;
  /** Slug of the parent entry; parents come before their children in the list. */
  parentSlug: string | null;
  systemKey: string | null;
}

export interface CategoryImportPlan {
  entries: CategoryImportEntry[];
  /** Every product with a category: which imported slug becomes its primary category. */
  assignments: Array<{ productId: string; slug: string }>;
}

function humanize(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr") + part.slice(1))
    .join(" ");
}

export function planCategoryImport(input: {
  template: readonly TrCategoryTemplateEntry[];
  /** Product categories that belong under another entry (`kase-kaban` → `mont`). */
  aliases?: Readonly<Record<string, string>>;
  products: ReadonlyArray<{ id: string; category: string | null }>;
}): CategoryImportPlan {
  const keys = new Set(input.template.map((entry) => entry.key));
  const entries: CategoryImportEntry[] = [];
  // Parents first, whatever order the template lists them in.
  const pending = [...input.template];
  const placed = new Set<string>();
  while (pending.length > 0) {
    const index = pending.findIndex(
      (entry) =>
        !entry.parentKey || placed.has(entry.parentKey) || !keys.has(entry.parentKey),
    );
    const entry = pending.splice(index === -1 ? 0 : index, 1)[0]!;
    const parentSlug =
      entry.parentKey && keys.has(entry.parentKey) ? entry.parentKey : null;
    entries.push({ slug: entry.key, name: entry.name, parentSlug, systemKey: entry.key });
    placed.add(entry.key);
  }

  const assignments: CategoryImportPlan["assignments"] = [];
  for (const product of input.products) {
    const raw = product.category?.trim();
    if (!raw) continue;
    let slug = keys.has(raw) ? raw : input.aliases?.[raw];
    if (!slug || !keys.has(slug)) {
      // Not in the template: keep it as a top-level category of its own.
      slug = isValidSlug(raw) ? raw : slugify(raw);
      if (!slug) continue;
      if (!entries.some((entry) => entry.slug === slug)) {
        entries.push({ slug, name: humanize(slug), parentSlug: null, systemKey: null });
      }
    }
    assignments.push({ productId: product.id, slug });
  }
  return { entries, assignments };
}
