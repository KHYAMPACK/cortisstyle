import {
  DEFAULT_LETTER_SIZES,
  DEFAULT_NUMERIC_SIZES,
  NUMERIC_EXPANDED_SIZES,
  sortProductSizes,
} from "@/lib/tr/catalog/productOptions";
import type { TrVariantType } from "@/lib/tr/variants/types";

/**
 * Where the panel's size tables take their sizes from: the boutique's Beden types
 * (variant types with `role = 'size'`), or, for a boutique that has none yet, the two
 * built-in lists the panel used to hardcode. Products still store their own labels
 * (`tr_products.sizes`); a source only decides what the owner is offered. Pure.
 */
export interface TrSizeSource {
  /** A variant type id, or `letter` / `numeric` for the built-in lists. */
  id: string;
  label: string;
  hint: string;
  /** The sizes a new product starts with, in display order. */
  values: string[];
  /** Further sizes offered with one click ("Daha büyük bedenler"). */
  moreValues: string[];
  moreLabel: string | null;
}

/** "No sizes": the product has a single stock count. */
export const NO_SIZE_SOURCE = "none";

export const BUILT_IN_SIZE_SOURCES: readonly TrSizeSource[] = [
  {
    id: "letter",
    label: "Harf (XS–3XL)",
    hint: "Üst giyim / standart beden",
    values: [...DEFAULT_LETTER_SIZES],
    moreValues: [],
    moreLabel: null,
  },
  {
    id: "numeric",
    label: "Numara (24–40)",
    hint: "Pantolon / jean ölçüsü",
    values: [...DEFAULT_NUMERIC_SIZES],
    moreValues: [...NUMERIC_EXPANDED_SIZES],
    moreLabel: "Daha büyük bedenler (42–52)",
  },
];

/** The boutique's size types as sources; the built-in lists when it has none. */
export function sizeSourcesFromTypes(
  types: ReadonlyArray<Pick<TrVariantType, "id" | "name" | "role" | "values">>,
): TrSizeSource[] {
  const sources = types
    .filter((type) => type.role === "size" && type.values.length > 0)
    .map((type) => {
      const values = type.values.map((value) => value.label);
      return {
        id: type.id,
        label: type.name,
        hint: values.length > 1 ? `${values[0]}–${values.at(-1)}` : values[0]!,
        values,
        moreValues: [],
        moreLabel: null,
      };
    });
  return sources.length > 0 ? sources : [...BUILT_IN_SIZE_SOURCES];
}

export function findSizeSource(
  sources: readonly TrSizeSource[],
  id: string,
): TrSizeSource | null {
  return sources.find((source) => source.id === id) ?? null;
}

function allValues(source: TrSizeSource): string[] {
  return [...source.values, ...source.moreValues];
}

function overlap(source: TrSizeSource, sizes: readonly string[]): number {
  const known = new Set(allValues(source).map((size) => size.toLocaleUpperCase("tr")));
  return sizes.filter((size) => known.has(size.trim().toLocaleUpperCase("tr"))).length;
}

/**
 * The source a product's sizes belong to: the one that knows most of its labels (the
 * first one on a tie or when none does). `none` for a product without sizes.
 */
export function detectSizeSourceId(
  sources: readonly TrSizeSource[],
  sizes: readonly string[],
): string {
  const cleaned = sizes.map((size) => size.trim()).filter(Boolean);
  if (cleaned.length === 0 || sources.length === 0) return NO_SIZE_SOURCE;
  let best = sources[0]!;
  let bestScore = overlap(best, cleaned);
  for (const source of sources.slice(1)) {
    const score = overlap(source, cleaned);
    if (score > bestScore) {
      best = source;
      bestScore = score;
    }
  }
  return best.id;
}

/**
 * A stored source id (e.g. from a draft saved before the boutique had size types) as
 * one of the current sources: `none` and known ids stay; a built-in id maps to the
 * source holding the same sizes; anything else becomes the first source.
 */
export function resolveSizeSourceId(
  sources: readonly TrSizeSource[],
  id: string | null | undefined,
): string {
  if (id === NO_SIZE_SOURCE) return NO_SIZE_SOURCE;
  if (id && findSizeSource(sources, id)) return id;
  const builtIn = BUILT_IN_SIZE_SOURCES.find((source) => source.id === id);
  if (builtIn) return detectSizeSourceId(sources, builtIn.values);
  return sources[0]?.id ?? NO_SIZE_SOURCE;
}

/** Sizes in the source's order; labels it doesn't know follow, in the usual size order. */
export function sortSizesForSource(
  source: TrSizeSource | null,
  sizes: readonly string[],
): string[] {
  const unique = [...new Set(sizes.map((size) => size.trim()).filter(Boolean))];
  if (!source) return sortProductSizes(unique);
  const order = allValues(source);
  const known = order.filter((size) => unique.includes(size));
  const rest = sortProductSizes(unique.filter((size) => !order.includes(size)));
  return [...known, ...rest];
}
