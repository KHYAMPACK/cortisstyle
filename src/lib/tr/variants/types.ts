/**
 * Variant types ("Varyant türü"): a named option a boutique defines once — Renk, Beden,
 * Boyut… — with an ordered list of values. Products later pick types and values from
 * here to build their variants. Client-safe (no server imports).
 */

/**
 * How a type's values are shown to the shopper: `list` = text chips (S / M / L),
 * `swatch` = a colour and/or picture per value (Renk / Görsel).
 */
export type TrVariantSelectionStyle = "list" | "swatch";

/**
 * What a type is used for, when it matters to a vertical: `size` types are what the
 * fashion panel offers as Beden, `color` types as Renk. `null` = a plain option.
 */
export type TrVariantTypeRole = "size" | "color";

export interface TrVariantTypeValue {
  id: string;
  label: string;
  /** `#rrggbb`; swatch types only. */
  hex: string | null;
  /** A picture for the swatch; swatch types only. */
  imageUrl: string | null;
  sortOrder: number;
}

export interface TrVariantType {
  id: string;
  boutiqueId: string;
  name: string;
  selectionStyle: TrVariantSelectionStyle;
  role: TrVariantTypeRole | null;
  /**
   * Each value has its own photos (a colour, a pattern): in a product the variants of a
   * value share them and the shop's gallery follows the choice. One per product.
   */
  hasPhotos: boolean;
  sortOrder: number;
  /** In display order. */
  values: TrVariantTypeValue[];
  createdAt: string;
  updatedAt: string;
}

/** A type plus what the list page shows next to it. */
export interface TrVariantTypeListEntry extends TrVariantType {
  /** Products that use the type in their options (0 until Gelişmiş products exist). */
  productCount: number;
}

/** What an owner sends to create or update a type; `id` marks a value that already exists. */
export interface TrVariantTypeInput {
  name: string;
  selectionStyle: TrVariantSelectionStyle;
  role: TrVariantTypeRole | null;
  /** Omitted = leave as it is (a new type: no photos). */
  hasPhotos?: boolean;
  values: TrVariantTypeValueInput[];
}

export interface TrVariantTypeValueInput {
  id?: string;
  label: string;
  hex?: string | null;
  imageUrl?: string | null;
}

/** What the Varyant Türleri page can still import: the built-in size types not yet created. */
export interface TrVariantTypeImportOffer {
  /** Names of the built-in size types that would be created ("Beden", "Pantolon bedeni"). */
  sizeTypes: string[];
}

export function readVariantSelectionStyle(value: unknown): TrVariantSelectionStyle {
  return value === "swatch" ? "swatch" : "list";
}

export function readVariantTypeRole(value: unknown): TrVariantTypeRole | null {
  return value === "size" || value === "color" ? value : null;
}

export function mapVariantValueRow(row: Record<string, unknown>): TrVariantTypeValue {
  return {
    id: String(row.id),
    label: String(row.label ?? ""),
    hex: typeof row.hex === "string" ? row.hex : null,
    imageUrl: typeof row.image_url === "string" ? row.image_url : null,
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
  };
}

export function mapVariantTypeRow(
  row: Record<string, unknown>,
  values: TrVariantTypeValue[] = [],
): TrVariantType {
  return {
    id: String(row.id),
    boutiqueId: String(row.boutique_id),
    name: String(row.name ?? ""),
    selectionStyle: readVariantSelectionStyle(row.selection_style),
    role: readVariantTypeRole(row.role),
    // Before patch_variant_type_photos.sql a colour type is the one with photos.
    hasPhotos:
      typeof row.has_photos === "boolean" ? row.has_photos : readVariantTypeRole(row.role) === "color",
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
    values: [...values].sort((a, b) => a.sortOrder - b.sortOrder),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

/**
 * A product's sellable variant: one row per combination of option values (Kırmızı / S).
 * Only Gelişmiş products have them; a product without variants sells at product level.
 */
export interface TrProductVariant {
  id: string;
  /** One value id per option, in the order of the product's option types. */
  optionValueIds: string[];
  sku: string | null;
  barcode: string | null;
  /** Selling price in kuruş; `null` inherits the product's price (and its discount). */
  priceKurus: number | null;
  stock: number;
  /** A subset of the product's images; empty = the product's own. */
  images: string[];
  active: boolean;
  sortOrder: number;
}

/** A product's options (variant type ids in order) and its variants. */
export interface TrProductVariants {
  typeIds: string[];
  variants: TrProductVariant[];
}

export const EMPTY_PRODUCT_VARIANTS: TrProductVariants = { typeIds: [], variants: [] };

/** What an owner sends for a product's variants; a combination is identified by its value ids. */
export interface TrProductVariantInput {
  optionValueIds: string[];
  sku: string | null;
  barcode: string | null;
  priceKurus: number | null;
  stock: number;
  images: string[];
  active: boolean;
}

export interface TrProductVariantsInput {
  typeIds: string[];
  variants: TrProductVariantInput[];
}

export function mapProductVariantRow(row: Record<string, unknown>): TrProductVariant {
  return {
    id: String(row.id),
    optionValueIds: Array.isArray(row.option_value_ids)
      ? row.option_value_ids.filter((id): id is string => typeof id === "string")
      : [],
    sku: typeof row.sku === "string" && row.sku ? row.sku : null,
    barcode: typeof row.barcode === "string" && row.barcode ? row.barcode : null,
    priceKurus: typeof row.price_kurus === "number" ? row.price_kurus : null,
    stock: typeof row.stock === "number" ? row.stock : 0,
    images: Array.isArray(row.images)
      ? row.images.filter((url): url is string => typeof url === "string")
      : [],
    active: row.active !== false,
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
  };
}
