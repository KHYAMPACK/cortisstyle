/**
 * Product kinds ("Ürün türü") and their fields ("Özellik"). A kind says what a product
 * is (Elbise, Pantolon, Takım…) and so which fields it has and which variant types a new
 * one starts with; it is independent of the categories a product is filed under. A
 * field's value is stored in `tr_products.features` under the field's key. Client-safe
 * (no server imports). See docs/foundation-no-hardcode-plan.md, F2.
 */

/** How a field is filled in. `choice` = chips from `options` (plus typing when allowed). */
export type TrAttributeInput = "text" | "textarea" | "choice";

export interface TrAttributeDefinition {
  id: string;
  boutiqueId: string;
  /** Where the value lives in `tr_products.features`. Fixed once created. */
  key: string;
  label: string;
  input: TrAttributeInput;
  /** A choice field's options, in order (stored as the values themselves). */
  options: string[];
  /** A choice field also takes a typed value. */
  allowCustom: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** A field plus what the list page shows next to it. */
export interface TrAttributeListEntry extends TrAttributeDefinition {
  /** Kinds that have the field. */
  kindCount: number;
}

/** One field of a kind. */
export interface TrKindAttribute {
  attributeId: string;
  required: boolean;
  /** The options this kind offers (a subset of the field's); `null` = all of them. */
  options: string[] | null;
}

export interface TrProductKind {
  id: string;
  boutiqueId: string;
  name: string;
  /** The starter template's id for the kind (`elbise`…), kept across renames; null = owner-made. */
  systemKey: string | null;
  /** Variant types (`tr_variant_types`) a new product of this kind starts with, in order. */
  defaultOptionTypeIds: string[];
  /** Category pre-selected for a new product of this kind. */
  suggestedCategoryId: string | null;
  sortOrder: number;
  /** In display order. */
  attributes: TrKindAttribute[];
  createdAt: string;
  updatedAt: string;
}

/** A kind plus what the list page shows next to it. */
export interface TrProductKindListEntry extends TrProductKind {
  productCount: number;
}

/** What an owner sends to create or update a field (`key` is derived on create). */
export interface TrAttributeInputBody {
  label: string;
  input: TrAttributeInput;
  options: string[];
  allowCustom: boolean;
}

/** What an owner sends to create or update a kind. */
export interface TrProductKindInput {
  name: string;
  defaultOptionTypeIds: string[];
  suggestedCategoryId: string | null;
  attributes: TrKindAttribute[];
}

/**
 * A vertical's starter set, copied once into a boutique's own rows ("Hazır türleri içe
 * aktar", and at store creation). Fields and kinds refer to each other by key; variant
 * types and categories by name / system key, resolved against the boutique's own rows
 * when it is imported (a missing one is just left out).
 */
export interface TrKindTemplate {
  attributes: Array<TrAttributeInputBody & { key: string }>;
  kinds: Array<{
    systemKey: string;
    name: string;
    attributes: Array<{ key: string; required?: boolean; options?: string[] | null }>;
    /** Variant type names the kind starts with ("Beden"). */
    optionTypeNames?: string[];
    /** `tr_categories.system_key` of the suggested category. */
    suggestedCategoryKey?: string | null;
  }>;
}

export function readAttributeInput(value: unknown): TrAttributeInput {
  return value === "textarea" || value === "choice" ? value : "text";
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

export function mapAttributeRow(row: Record<string, unknown>): TrAttributeDefinition {
  return {
    id: String(row.id),
    boutiqueId: String(row.boutique_id),
    key: String(row.key ?? ""),
    label: String(row.label ?? ""),
    input: readAttributeInput(row.input),
    options: readStringArray(row.options),
    allowCustom: row.allow_custom === true,
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export function mapKindAttributeRow(row: Record<string, unknown>): TrKindAttribute & {
  kindId: string;
  sortOrder: number;
} {
  return {
    kindId: String(row.kind_id),
    attributeId: String(row.attribute_id),
    required: row.required === true,
    options: Array.isArray(row.options) ? readStringArray(row.options) : null,
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
  };
}

export function mapKindRow(
  row: Record<string, unknown>,
  attributes: TrKindAttribute[] = [],
): TrProductKind {
  return {
    id: String(row.id),
    boutiqueId: String(row.boutique_id),
    name: String(row.name ?? ""),
    systemKey: typeof row.system_key === "string" && row.system_key ? row.system_key : null,
    defaultOptionTypeIds: readStringArray(row.default_option_type_ids),
    suggestedCategoryId:
      typeof row.suggested_category_id === "string" ? row.suggested_category_id : null,
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
    attributes,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}
