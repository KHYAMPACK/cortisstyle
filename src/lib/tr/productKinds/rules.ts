import type {
  TrAttributeDefinition,
  TrAttributeInputBody,
  TrKindAttribute,
  TrKindTemplate,
  TrProductKind,
  TrProductKindInput,
} from "@/lib/tr/productKinds/types";

/**
 * The rules for product kinds and fields, shared by the panel and the API so a limit or
 * a message lives in one place. Pure: no I/O.
 */

export const PRODUCT_KIND_LIMITS = {
  nameMax: 40,
  labelMax: 40,
  optionMax: 60,
  optionsMax: 60,
  /** Fields per boutique. */
  attributesMax: 80,
  /** Kinds per boutique. */
  kindsMax: 60,
  /** Fields per kind. */
  kindAttributesMax: 40,
  /** Starting variant types per kind. */
  optionTypesMax: 3,
} as const;

/**
 * Keys the platform itself keeps in `tr_products.features` (photos, colour groups,
 * takım parts…). A field can never take one, or the editor would overwrite them.
 */
export const RESERVED_FEATURE_KEYS: ReadonlySet<string> = new Set([
  "aiModelId",
  "lifestyleModelIds",
  "uploadKind",
  "setItems",
  "manualListing",
  "madeToOrder",
  "sizePricesKurus",
  "colorGroupId",
  "colorSiblingIds",
  "hem",
]);

const KEY_PATTERN = /^[a-z][a-zA-Z0-9]{0,39}$/;

/** Single-spaced, trimmed. */
export function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Case-insensitive (Turkish) comparison key for names, labels and options. */
export function textKey(value: string): string {
  return cleanText(value).toLocaleLowerCase("tr");
}

const ASCII: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u",
};

/**
 * A storage key for a new field from its label: "Ana malzeme" → "anaMalzeme". Unique
 * among `taken` and never a reserved key ("…2", "…3" when needed).
 */
export function attributeKeyFromLabel(label: string, taken: Iterable<string>): string {
  const words = cleanText(label)
    .toLocaleLowerCase("tr")
    .replace(/[çğıöşüâîû]/g, (char) => ASCII[char] ?? char)
    .normalize("NFKD")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(" ")
    .filter(Boolean);
  let base = words
    .map((word, index) => (index === 0 ? word : word[0]!.toUpperCase() + word.slice(1)))
    .join("")
    .slice(0, 36);
  if (!base || !/^[a-z]/.test(base)) base = `alan${base}`.slice(0, 36);
  const used = new Set(taken);
  let key = base;
  for (let suffix = 2; used.has(key) || RESERVED_FEATURE_KEYS.has(key); suffix += 1) {
    key = `${base}${suffix}`;
  }
  return key;
}

export function isValidAttributeKey(key: string): boolean {
  return KEY_PATTERN.test(key) && !RESERVED_FEATURE_KEYS.has(key);
}

/** Options as typed: cleaned, empty ones dropped; a repeat is an error. */
function readOptions(raw: unknown): string[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new Error("Seçenekler geçersiz.");
  const seen = new Set<string>();
  const options: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string") throw new Error("Seçenekler geçersiz.");
    const option = cleanText(entry);
    if (!option) continue;
    if (option.length > PRODUCT_KIND_LIMITS.optionMax) {
      throw new Error(
        `Bir seçenek en fazla ${PRODUCT_KIND_LIMITS.optionMax} karakter olabilir.`,
      );
    }
    if (seen.has(textKey(option))) throw new Error(`“${option}” iki kez eklenmiş.`);
    seen.add(textKey(option));
    options.push(option);
  }
  if (options.length > PRODUCT_KIND_LIMITS.optionsMax) {
    throw new Error(`En fazla ${PRODUCT_KIND_LIMITS.optionsMax} seçenek ekleyebilirsiniz.`);
  }
  return options;
}

/**
 * A field request body as a validated input. Throws an `Error` with a sentence for the
 * owner. A text field keeps no options; a choice field needs at least one.
 */
export function readAttributeBody(body: Record<string, unknown>): TrAttributeInputBody {
  const label = typeof body.label === "string" ? cleanText(body.label) : "";
  if (!label) throw new Error("Özellik adı zorunlu.");
  if (label.length > PRODUCT_KIND_LIMITS.labelMax) {
    throw new Error(`Özellik adı en fazla ${PRODUCT_KIND_LIMITS.labelMax} karakter olabilir.`);
  }
  if (body.input !== "text" && body.input !== "textarea" && body.input !== "choice") {
    throw new Error("Giriş türünü seçin.");
  }
  const input = body.input;
  if (input !== "choice") return { label, input, options: [], allowCustom: false };
  const options = readOptions(body.options);
  if (options.length === 0) throw new Error("Seçimli bir özellik için en az bir seçenek ekleyin.");
  return { label, input, options, allowCustom: body.allowCustom === true };
}

/** Kind-field links as sent, deduplicated by field, in order. */
function readKindAttributes(raw: unknown): TrKindAttribute[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new Error("Özellikler geçersiz.");
  const seen = new Set<string>();
  const attributes: TrKindAttribute[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") throw new Error("Özellikler geçersiz.");
    const record = entry as Record<string, unknown>;
    const attributeId = typeof record.attributeId === "string" ? record.attributeId : "";
    if (!attributeId) throw new Error("Özellikler geçersiz.");
    if (seen.has(attributeId)) continue;
    seen.add(attributeId);
    attributes.push({
      attributeId,
      required: record.required === true,
      options: Array.isArray(record.options) ? readOptions(record.options) : null,
    });
  }
  if (attributes.length > PRODUCT_KIND_LIMITS.kindAttributesMax) {
    throw new Error(
      `Bir türe en fazla ${PRODUCT_KIND_LIMITS.kindAttributesMax} özellik eklenebilir.`,
    );
  }
  return attributes;
}

/** A kind request body as a validated input (ids are checked against the boutique later). */
export function readKindBody(body: Record<string, unknown>): TrProductKindInput {
  const name = typeof body.name === "string" ? cleanText(body.name) : "";
  if (!name) throw new Error("Ürün türü adı zorunlu.");
  if (name.length > PRODUCT_KIND_LIMITS.nameMax) {
    throw new Error(`Ürün türü adı en fazla ${PRODUCT_KIND_LIMITS.nameMax} karakter olabilir.`);
  }
  const typeIds = Array.isArray(body.defaultOptionTypeIds)
    ? [
        ...new Set(
          body.defaultOptionTypeIds.filter(
            (id): id is string => typeof id === "string" && id.length > 0,
          ),
        ),
      ]
    : [];
  if (typeIds.length > PRODUCT_KIND_LIMITS.optionTypesMax) {
    throw new Error(
      `En fazla ${PRODUCT_KIND_LIMITS.optionTypesMax} varyant türüyle başlanabilir.`,
    );
  }
  const suggested =
    typeof body.suggestedCategoryId === "string" && body.suggestedCategoryId
      ? body.suggestedCategoryId
      : null;
  return {
    name,
    defaultOptionTypeIds: typeIds,
    suggestedCategoryId: suggested,
    attributes: readKindAttributes(body.attributes),
  };
}

/**
 * Checks a kind's references against the boutique's own rows, and narrows each field's
 * option subset to options the field really has (`null` when it covers them all, or
 * for a field that isn't a choice). Throws a sentence for the owner.
 */
export function resolveKindInput(
  input: TrProductKindInput,
  context: {
    attributes: ReadonlyArray<Pick<TrAttributeDefinition, "id" | "input" | "options">>;
    variantTypeIds: ReadonlySet<string>;
    categoryIds: ReadonlySet<string>;
  },
): TrProductKindInput {
  const byId = new Map(context.attributes.map((attribute) => [attribute.id, attribute]));
  for (const id of input.defaultOptionTypeIds) {
    if (!context.variantTypeIds.has(id)) throw new Error("Varyant türü bulunamadı.");
  }
  if (input.suggestedCategoryId && !context.categoryIds.has(input.suggestedCategoryId)) {
    throw new Error("Kategori bulunamadı.");
  }
  const attributes = input.attributes.map((link) => {
    const attribute = byId.get(link.attributeId);
    if (!attribute) throw new Error("Özellik bulunamadı.");
    return { ...link, options: narrowOptions(attribute, link.options) };
  });
  return { ...input, attributes };
}

/** A kind's option subset kept to the field's options, in the field's order. */
export function narrowOptions(
  attribute: Pick<TrAttributeDefinition, "input" | "options">,
  subset: readonly string[] | null,
): string[] | null {
  if (attribute.input !== "choice" || subset === null) return null;
  const wanted = new Set(subset.map(textKey));
  const kept = attribute.options.filter((option) => wanted.has(textKey(option)));
  return kept.length === attribute.options.length ? null : kept;
}

/** The options a kind shows for a field. */
export function kindOptionsFor(
  attribute: Pick<TrAttributeDefinition, "options">,
  link: Pick<TrKindAttribute, "options">,
): string[] {
  return link.options ?? attribute.options;
}

export function hasNamed<T extends { id: string }>(
  rows: readonly T[],
  name: string,
  read: (row: T) => string,
  exceptId?: string,
): boolean {
  const key = textKey(name);
  return rows.some((row) => row.id !== exceptId && textKey(read(row)) === key);
}

// ------------------------------------------------------------- template import

export interface KindImportPlan {
  /** Fields to create; a template field whose key the boutique already has is reused. */
  attributes: Array<TrAttributeInputBody & { key: string }>;
  /** Kinds to create, referring to fields by key. */
  kinds: Array<{
    systemKey: string;
    name: string;
    defaultOptionTypeIds: string[];
    suggestedCategoryId: string | null;
    attributes: Array<{ key: string; required: boolean; options: string[] | null }>;
  }>;
}

/**
 * What importing a template creates for a boutique: the fields it lacks (by key) and the
 * kinds it lacks (by system key or name). Variant types are found by name and categories
 * by system key; one the boutique doesn't have is left out, not an error.
 */
export function planKindImport(
  template: TrKindTemplate,
  boutique: {
    attributes: ReadonlyArray<Pick<TrAttributeDefinition, "key" | "label">>;
    kinds: ReadonlyArray<Pick<TrProductKind, "name" | "systemKey">>;
    variantTypes: ReadonlyArray<{ id: string; name: string }>;
    categories: ReadonlyArray<{ id: string; systemKey: string | null }>;
  },
): KindImportPlan {
  const haveKeys = new Set(boutique.attributes.map((attribute) => attribute.key));
  const haveLabels = new Set(boutique.attributes.map((attribute) => textKey(attribute.label)));
  const attributes = template.attributes.filter(
    (attribute) => !haveKeys.has(attribute.key) && !haveLabels.has(textKey(attribute.label)),
  );
  const available = new Set([...haveKeys, ...attributes.map((attribute) => attribute.key)]);

  const haveSystemKeys = new Set(boutique.kinds.map((kind) => kind.systemKey).filter(Boolean));
  const haveNames = new Set(boutique.kinds.map((kind) => textKey(kind.name)));
  const typeByName = new Map(boutique.variantTypes.map((type) => [textKey(type.name), type.id]));
  const categoryByKey = new Map(
    boutique.categories
      .filter((category) => category.systemKey)
      .map((category) => [category.systemKey!, category.id]),
  );

  const kinds = template.kinds
    .filter((kind) => !haveSystemKeys.has(kind.systemKey) && !haveNames.has(textKey(kind.name)))
    .map((kind) => ({
      systemKey: kind.systemKey,
      name: kind.name,
      defaultOptionTypeIds: (kind.optionTypeNames ?? [])
        .map((name) => typeByName.get(textKey(name)))
        .filter((id): id is string => Boolean(id)),
      suggestedCategoryId: kind.suggestedCategoryKey
        ? (categoryByKey.get(kind.suggestedCategoryKey) ?? null)
        : null,
      attributes: kind.attributes
        .filter((link) => available.has(link.key))
        .map((link) => ({
          key: link.key,
          required: link.required === true,
          options: link.options ?? null,
        })),
    }));
  return { attributes, kinds };
}

/**
 * Which products get which kind when a template is imported: every product without a
 * kind whose category maps to one of the boutique's kinds (by system key).
 */
export function planKindAssignments(
  products: ReadonlyArray<{ id: string; category: string | null; kindId: string | null }>,
  kindKeyForCategory: (slug: string | null) => string | null,
  kinds: ReadonlyArray<Pick<TrProductKind, "id" | "systemKey">>,
): Map<string, string[]> {
  const kindBySystemKey = new Map(
    kinds.filter((kind) => kind.systemKey).map((kind) => [kind.systemKey!, kind.id]),
  );
  const byKind = new Map<string, string[]>();
  for (const product of products) {
    if (product.kindId) continue;
    const kindId = kindBySystemKey.get(kindKeyForCategory(product.category) ?? "");
    if (!kindId) continue;
    byKind.set(kindId, [...(byKind.get(kindId) ?? []), product.id]);
  }
  return byKind;
}
