export interface TrCategoryDefinition {
  id: string;
  label: string;
  /**
   * Parent category id. Roots omit / null.
   * Elbise is a root leaf (no children).
   *
   * Depth-1 under a root = shop / nav / assignable leaf (e.g. `mont`).
   * Deeper ids are style variants kept for matching old products
   * (e.g. `kase-kaban` → under `mont`) — not shown in nav or panel chips.
   */
  parentId?: string | null;
}

/**
 * Boutique category taxonomy (shared).
 *
 * ```text
 * elbise
 * ust-giyim
 *   gömlek · tunik · triko · penye · bluz · tişört
 *   ceket (± deri-ceket) · mont (± kaşe / kürk) · trençkot · kaban · takım
 * alt-giyim
 *   etek · pantolon (± kot / kumaş) · eşofman
 * aksesuar
 *   çanta · eşarp · şal
 * ev
 *   nevresim (± nevresim takımı)
 * ```
 *
 * Products should store a **shop leaf** id (`mont`, `pantolon`, …).
 * Parent filters (`ust-giyim`) match all descendant leaves + variants.
 */
export const TR_BOUTIQUE_CATEGORIES: TrCategoryDefinition[] = [
  // Roots
  { id: "elbise", label: "Elbise" },
  { id: "ust-giyim", label: "Üst giyim" },
  { id: "alt-giyim", label: "Alt giyim" },
  { id: "aksesuar", label: "Aksesuar" },
  { id: "ev", label: "Ev" },
  /** Legacy Pervin / older catalogs */
  { id: "dis-giyim", label: "Dış giyim" },

  // Üst giyim — shop leaves (nav + panel)
  { id: "gomlek", label: "Gömlek", parentId: "ust-giyim" },
  { id: "tunik", label: "Tunik", parentId: "ust-giyim" },
  { id: "triko", label: "Triko", parentId: "ust-giyim" },
  { id: "penye", label: "Penye", parentId: "ust-giyim" },
  { id: "bluz", label: "Bluz", parentId: "ust-giyim" },
  { id: "tshirt", label: "Tişört", parentId: "ust-giyim" },
  { id: "ceket", label: "Ceket", parentId: "ust-giyim" },
  { id: "mont", label: "Mont", parentId: "ust-giyim" },
  { id: "trenckot", label: "Trençkot", parentId: "ust-giyim" },
  { id: "kaban", label: "Kaban", parentId: "ust-giyim" },
  { id: "takim", label: "Takım", parentId: "ust-giyim" },

  // Üst — style variants (not in nav; still match under parent leaf)
  { id: "deri-ceket", label: "Deri ceket", parentId: "ceket" },
  { id: "kase-kaban", label: "Kaşe mont", parentId: "mont" },
  { id: "kurk-mont", label: "Kürk mont", parentId: "mont" },

  // Alt giyim — shop leaves
  { id: "etek", label: "Etek", parentId: "alt-giyim" },
  { id: "pantolon", label: "Pantolon", parentId: "alt-giyim" },
  { id: "esofman", label: "Eşofman", parentId: "alt-giyim" },

  // Alt — variants under pantolon
  { id: "kot-pantolon", label: "Kot pantolon", parentId: "pantolon" },
  { id: "kumas-pantolon", label: "Kumaş pantolon", parentId: "pantolon" },

  // Aksesuar
  { id: "canta", label: "Çanta", parentId: "aksesuar" },
  { id: "esarp", label: "Eşarp", parentId: "aksesuar" },
  { id: "sal", label: "Şal", parentId: "aksesuar" },

  // Ev
  { id: "nevresim", label: "Nevresim", parentId: "ev" },
  { id: "nevresim-takimi", label: "Nevresim takımı", parentId: "nevresim" },
];

const BY_ID = new Map(
  TR_BOUTIQUE_CATEGORIES.map((entry) => [entry.id, entry]),
);

const LABEL_BY_ID = new Map(
  TR_BOUTIQUE_CATEGORIES.map((entry) => [entry.id, entry.label]),
);

const CHILDREN_BY_PARENT = (() => {
  const map = new Map<string, TrCategoryDefinition[]>();
  for (const entry of TR_BOUTIQUE_CATEGORIES) {
    const parent = entry.parentId?.trim();
    if (!parent) continue;
    const list = map.get(parent) ?? [];
    list.push(entry);
    map.set(parent, list);
  }
  return map;
})();

function humanizeId(id: string): string {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr") + part.slice(1))
    .join(" ");
}

/** True when this id is a shop leaf shown in nav / owner picker. */
function isShopLeaf(entry: TrCategoryDefinition): boolean {
  if (!entry.parentId) {
    // Root with no children (elbise, legacy dis-giyim)
    return getTrCategoryChildren(entry.id).length === 0;
  }
  const parent = BY_ID.get(entry.parentId);
  // Depth-1 under a root only — variants nest under other leaves
  return Boolean(parent && !parent.parentId);
}

export function getTrCategoryDefinition(
  categoryId: string | null | undefined,
): TrCategoryDefinition | null {
  if (!categoryId?.trim()) return null;
  return BY_ID.get(categoryId.trim()) ?? null;
}

export function getTrCategoryLabel(
  categoryId: string | null | undefined,
): string | null {
  if (!categoryId?.trim()) return null;
  const id = categoryId.trim();
  return LABEL_BY_ID.get(id) ?? humanizeId(id);
}

/**
 * "Shop all" link copy — Turkish plural / collective after "Tüm", sentence case.
 * Prefer this over `Tüm ${label}` (avoids "Tüm elbise", "Tüm Üst").
 */
const SHOP_ALL_PHRASE_BY_ID: Record<string, string> = {
  elbise: "elbiseler",
  "ust-giyim": "üst giyim",
  "alt-giyim": "alt giyim",
  aksesuar: "aksesuarlar",
  ev: "ev ürünleri",
  "dis-giyim": "dış giyim",
  gomlek: "gömlekler",
  tunik: "tunikler",
  triko: "trikolar",
  penye: "penyeler",
  bluz: "bluzlar",
  tshirt: "tişörtler",
  ceket: "ceketler",
  "deri-ceket": "deri ceketler",
  mont: "montlar",
  trenckot: "trençkotlar",
  kaban: "kabanlar",
  "kase-kaban": "kaşe montlar",
  "kurk-mont": "kürk montlar",
  takim: "takımlar",
  etek: "etekler",
  pantolon: "pantolonlar",
  "kot-pantolon": "kot pantolonlar",
  "kumas-pantolon": "kumaş pantolonlar",
  esofman: "eşofmanlar",
  canta: "çantalar",
  esarp: "eşarplar",
  sal: "şallar",
  nevresim: "nevresimler",
  "nevresim-takimi": "nevresim takımları",
};

export function getTrCategoryShopAllLabel(
  categoryId: string | null | undefined,
): string {
  if (!categoryId?.trim()) return "Tüm ürünler";
  const id = categoryId.trim();
  const phrase = SHOP_ALL_PHRASE_BY_ID[id];
  if (phrase) return `Tüm ${phrase}`;

  const label = getTrCategoryLabel(id);
  if (!label) return "Tüm ürünler";
  const lowered =
    label.charAt(0).toLocaleLowerCase("tr-TR") + label.slice(1);
  return `Tüm ${lowered}`;
}

/** Prefer registry label over abbreviated content copy ("Üst" → "Üst giyim"). */
export function resolveTrCategoryDisplayLabel(
  categoryId: string | null | undefined,
  fallback?: string | null,
): string {
  return (
    getTrCategoryLabel(categoryId) ??
    fallback?.trim() ??
    "Kategori"
  );
}

/**
 * Map a variant id to the shop leaf owners should use / filters should prefer
 * (`kase-kaban` → `mont`). Unknown ids pass through.
 */
export function canonicalizeTrCategoryId(
  categoryId: string | null | undefined,
): string | null {
  if (!categoryId?.trim()) return null;
  let current = BY_ID.get(categoryId.trim());
  if (!current) return categoryId.trim();
  const seen = new Set<string>();
  while (current && !isShopLeaf(current) && current.parentId) {
    if (seen.has(current.id)) break;
    seen.add(current.id);
    const parent = BY_ID.get(current.parentId);
    if (!parent) break;
    current = parent;
  }
  return current?.id ?? categoryId.trim();
}

/** Top-level categories (nav / home tiles). Excludes legacy-only if desired. */
export function listTrCategoryRoots(options?: {
  includeLegacy?: boolean;
}): TrCategoryDefinition[] {
  const includeLegacy = options?.includeLegacy ?? false;
  return TR_BOUTIQUE_CATEGORIES.filter((entry) => {
    if (entry.parentId) return false;
    if (!includeLegacy && entry.id === "dis-giyim") return false;
    return true;
  });
}

export function getTrCategoryChildren(
  parentId: string | null | undefined,
): TrCategoryDefinition[] {
  if (!parentId?.trim()) return [];
  return CHILDREN_BY_PARENT.get(parentId.trim()) ?? [];
}

/**
 * Subcategories for storefront mega / mobile drill-down.
 * Only shop leaves — never style variants like kaşe mont.
 */
export function getTrCategoryNavChildren(
  parentId: string | null | undefined,
): TrCategoryDefinition[] {
  return getTrCategoryChildren(parentId).filter(isShopLeaf);
}

/** Ancestors from nearest parent up to root (excludes self). */
export function getTrCategoryAncestors(
  categoryId: string | null | undefined,
): TrCategoryDefinition[] {
  const start = getTrCategoryDefinition(categoryId);
  if (!start) return [];
  const out: TrCategoryDefinition[] = [];
  let current = start.parentId ? BY_ID.get(start.parentId) : undefined;
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    out.push(current);
    seen.add(current.id);
    current = current.parentId ? BY_ID.get(current.parentId) : undefined;
  }
  return out;
}

/**
 * True when product category equals filter, or product leaf sits under filter parent.
 * Unknown filter/product ids fall back to exact string match.
 */
export function isTrCategoryMatch(
  productCategory: string | null | undefined,
  filterId: string | null | undefined,
): boolean {
  const product = productCategory?.trim() || "";
  const filter = filterId?.trim() || "";
  if (!filter) return true;
  if (!product) return false;
  if (product === filter) return true;

  const filterDef = getTrCategoryDefinition(filter);
  if (!filterDef) return false;

  // Direct child or deeper descendant of filter
  let current: TrCategoryDefinition | null = getTrCategoryDefinition(product);
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    if (current.id === filter) return true;
    if (current.parentId === filter) return true;
    seen.add(current.id);
    current = current.parentId
      ? (BY_ID.get(current.parentId) ?? null)
      : null;
  }
  return false;
}

/** Ids that can be assigned on a product (shop leaves only — not style variants). */
export function listAssignableTrCategories(): TrCategoryDefinition[] {
  return TR_BOUTIQUE_CATEGORIES.filter(isShopLeaf);
}

export interface TrCategoryGroup {
  parent: TrCategoryDefinition | null;
  /** Section label for panel UI */
  label: string;
  items: TrCategoryDefinition[];
}

/** Grouped chips for owner panel: Elbise alone, then Üst/Alt/Aksesuar/Ev with shop leaves. */
export function listTrCategoriesGrouped(): TrCategoryGroup[] {
  const groups: TrCategoryGroup[] = [];

  const elbise = BY_ID.get("elbise");
  if (elbise) {
    groups.push({ parent: null, label: elbise.label, items: [elbise] });
  }

  for (const rootId of ["ust-giyim", "alt-giyim", "aksesuar", "ev"] as const) {
    const parent = BY_ID.get(rootId);
    if (!parent) continue;
    const items = getTrCategoryNavChildren(rootId);
    if (items.length === 0) continue;
    groups.push({ parent, label: parent.label, items });
  }

  const dis = BY_ID.get("dis-giyim");
  if (dis && getTrCategoryChildren("dis-giyim").length === 0) {
    groups.push({ parent: null, label: dis.label, items: [dis] });
  }

  return groups;
}

export function listCategoriesForProducts(
  products: Array<{ category: string | null }>,
): TrCategoryDefinition[] {
  const used = new Set(
    products
      .map((product) => product.category?.trim())
      .filter((value): value is string => Boolean(value)),
  );

  const known = TR_BOUTIQUE_CATEGORIES.filter((entry) => used.has(entry.id));
  const knownIds = new Set(known.map((entry) => entry.id));

  const custom = [...used]
    .filter((id) => !knownIds.has(id))
    .map((id) => ({
      id,
      label: humanizeId(id),
    }));

  return [...known, ...custom];
}
