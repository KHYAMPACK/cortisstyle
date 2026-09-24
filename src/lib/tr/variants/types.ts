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
  values: TrVariantTypeValueInput[];
}

export interface TrVariantTypeValueInput {
  id?: string;
  label: string;
  hex?: string | null;
  imageUrl?: string | null;
}

/** Preset sizes / colours a boutique already keeps, offered for import as Beden / Renk. */
export interface TrVariantPresetImport {
  sizes: number;
  colors: number;
}

export function readVariantSelectionStyle(value: unknown): TrVariantSelectionStyle {
  return value === "swatch" ? "swatch" : "list";
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
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
    values: [...values].sort((a, b) => a.sortOrder - b.sortOrder),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}
