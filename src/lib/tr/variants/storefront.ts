import { variantLabel } from "@/lib/tr/variants/productVariantRules";

/**
 * What the shop knows about a product's variants and how a shopper picks one (F5). The
 * server loads it (`catalog/publicVariants.ts`); the product page, the quick-add sheet
 * and the cart use these rules. Pure.
 *
 * Photos per value are the variants' own images: the gallery shows the images of the
 * variants that carry the chosen value of the photo option (Renk…), else the product's.
 */

export interface TrPublicVariantValue {
  id: string;
  label: string;
  /** Swatch colour (`#rrggbb`) or picture, for a swatch option. */
  hex: string | null;
  imageUrl: string | null;
}

export interface TrPublicVariantOption {
  typeId: string;
  name: string;
  /** What the option means (Google's color/size attributes, the size filter). */
  role: "size" | "color" | null;
  /** Each value has its own photos: this option drives the gallery and its address
   *  parameter (`?renk=` for Renk). At most one per product. */
  photos: boolean;
  selectionStyle: "list" | "swatch";
  /** Only values some active variant uses, in the type's order. */
  values: TrPublicVariantValue[];
}

export interface TrPublicVariant {
  id: string;
  /** One value id per option, in option order. */
  optionValueIds: string[];
  /** What the shopper pays. */
  priceKurus: number;
  /** Struck-through price, when this variant sells at the product's discount. */
  compareAtPriceKurus: number | null;
  stock: number;
  images: string[];
}

export interface TrPublicVariants {
  options: TrPublicVariantOption[];
  /** Active variants only. */
  variants: TrPublicVariant[];
}

/** The chosen value id per option type id (missing = not chosen yet). */
export type TrVariantSelection = Record<string, string>;

/** A variant row as stored, plus the product's prices, as the shop sees it. */
export function toPublicVariant(
  row: {
    id: string;
    optionValueIds: string[];
    priceKurus: number | null;
    stock: number;
    images: string[];
  },
  product: { priceKurus: number; compareAtPriceKurus?: number | null },
): TrPublicVariant {
  // A variant price of its own replaces the product's price and its discount (M7b).
  const own = row.priceKurus != null;
  const compareAt =
    !own && typeof product.compareAtPriceKurus === "number" &&
    product.compareAtPriceKurus > product.priceKurus
      ? product.compareAtPriceKurus
      : null;
  return {
    id: row.id,
    optionValueIds: row.optionValueIds,
    priceKurus: own ? row.priceKurus! : product.priceKurus,
    compareAtPriceKurus: compareAt,
    stock: Math.max(0, row.stock),
    images: row.images,
  };
}

function matches(
  variant: TrPublicVariant,
  options: readonly TrPublicVariantOption[],
  selection: TrVariantSelection,
): boolean {
  return options.every((option, index) => {
    const chosen = selection[option.typeId];
    return !chosen || variant.optionValueIds[index] === chosen;
  });
}

/**
 * Whether a value of an option can be picked: some in-stock variant has it together
 * with the shopper's other choices. Out-of-stock combinations are shown but disabled.
 */
export function isValueAvailable(
  data: TrPublicVariants,
  selection: TrVariantSelection,
  typeId: string,
  valueId: string,
): boolean {
  const trial = { ...selection, [typeId]: valueId };
  return data.variants.some(
    (variant) => variant.stock > 0 && matches(variant, data.options, trial),
  );
}

/** The variant the selection names, once every option is chosen. */
export function selectedVariant(
  data: TrPublicVariants,
  selection: TrVariantSelection,
): TrPublicVariant | null {
  if (data.options.some((option) => !selection[option.typeId])) return null;
  return data.variants.find((variant) => matches(variant, data.options, selection)) ?? null;
}

/**
 * Picking a value. A choice on another option that no longer forms a sellable
 * combination is dropped (picking "Mavi" clears an "S" that Mavi doesn't have).
 */
export function pickValue(
  data: TrPublicVariants,
  selection: TrVariantSelection,
  typeId: string,
  valueId: string,
): TrVariantSelection {
  const next: TrVariantSelection = { ...selection, [typeId]: valueId };
  for (const option of data.options) {
    const chosen = next[option.typeId];
    if (option.typeId === typeId || !chosen) continue;
    if (!isValueAvailable(data, { [typeId]: valueId }, option.typeId, chosen)) {
      delete next[option.typeId];
    }
  }
  return next;
}

/** The option whose values have their own photos (Renk…), if the product has one. */
export function photoOption(data: TrPublicVariants): TrPublicVariantOption | null {
  return data.options.find((option) => option.photos) ?? null;
}

/** The address parameter of the photo option: its name as a slug ("Renk" → `renk`). */
export function photoParamName(option: TrPublicVariantOption): string {
  return valueParam(option.name) || "secenek";
}

/**
 * The starting selection: the photo option's value from its address parameter
 * (`?renk=`) when it names one, else its first value that has stock; any option with a
 * single sellable value is chosen too.
 */
export function initialSelection(
  data: TrPublicVariants,
  colorParam?: string | null,
): TrVariantSelection {
  let selection: TrVariantSelection = {};
  const color = photoOption(data);
  if (color) {
    const fromParam = colorParam ? valueForParam(color, colorParam) : null;
    const pick =
      fromParam ??
      color.values.find((value) => isValueAvailable(data, {}, color.typeId, value.id)) ??
      null;
    if (pick) selection = { [color.typeId]: pick.id };
  }
  for (const option of data.options) {
    if (selection[option.typeId]) continue;
    const sellable = option.values.filter((value) =>
      isValueAvailable(data, selection, option.typeId, value.id),
    );
    if (sellable.length === 1) selection = { ...selection, [option.typeId]: sellable[0]!.id };
  }
  return selection;
}

const TR_ASCII: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };

/** "Açık Mavi" → "acik-mavi": a colour in the address (`?renk=`). */
export function valueParam(label: string): string {
  return label
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşü]/g, (char) => TR_ASCII[char] ?? char)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function valueForParam(
  option: TrPublicVariantOption,
  param: string,
): TrPublicVariantValue | null {
  const wanted = valueParam(param);
  return option.values.find((value) => valueParam(value.label) === wanted) ?? null;
}

/**
 * The gallery for the selection: the images of the variants with the chosen value of
 * the photo option (in variant order, without repeats), else the product's own images.
 */
export function galleryForSelection(
  data: TrPublicVariants,
  selection: TrVariantSelection,
  productImages: readonly string[],
): string[] {
  const color = photoOption(data);
  const chosen = color ? selection[color.typeId] : null;
  if (!color || !chosen) return [...productImages];
  const index = data.options.indexOf(color);
  const seen = new Set<string>();
  const images: string[] = [];
  for (const variant of data.variants) {
    if (variant.optionValueIds[index] !== chosen) continue;
    for (const url of variant.images) {
      if (url && !seen.has(url)) {
        seen.add(url);
        images.push(url);
      }
    }
  }
  return images.length > 0 ? images : [...productImages];
}

/** "Kırmızı / S" for a variant, the label kept on the cart line and the order. */
export function publicVariantLabel(data: TrPublicVariants, variant: TrPublicVariant): string {
  const labels = new Map(
    data.options.flatMap((option) => option.values.map((value) => [value.id, value.label])),
  );
  return variantLabel(variant.optionValueIds, (id) => labels.get(id) ?? "");
}

/** The cheapest sellable price and whether prices differ ("₺900'den başlayan"). */
export function priceRange(data: TrPublicVariants): { min: number; varies: boolean } | null {
  const prices = data.variants.filter((variant) => variant.stock > 0).map((v) => v.priceKurus);
  const all = prices.length > 0 ? prices : data.variants.map((variant) => variant.priceKurus);
  if (all.length === 0) return null;
  const min = Math.min(...all);
  return { min, varies: all.some((price) => price !== min) };
}

/** Total stock of the active variants. */
export function totalVariantStock(data: TrPublicVariants): number {
  return data.variants.reduce((sum, variant) => sum + variant.stock, 0);
}
