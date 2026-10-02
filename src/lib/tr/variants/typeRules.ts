import { ALL_NUMERIC_SIZES, DEFAULT_LETTER_SIZES } from "@/lib/tr/catalog/productOptions";
import {
  readVariantTypeRole,
  type TrVariantSelectionStyle,
  type TrVariantType,
  type TrVariantTypeInput,
  type TrVariantTypeValue,
  type TrVariantTypeValueInput,
} from "@/lib/tr/variants/types";

/**
 * The rules for variant types, shared by the panel drawer and the API so a limit or a
 * message lives in one place. Pure: no I/O.
 */

export const VARIANT_TYPE_LIMITS = {
  nameMax: 40,
  labelMax: 40,
  valuesMax: 100,
  /** Types per boutique. */
  typesMax: 50,
} as const;

const HEX = /^#[0-9a-f]{6}$/i;

/** Single-spaced, trimmed. */
export function cleanLabel(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Case-insensitive (Turkish) comparison key for names and labels. */
export function labelKey(value: string): string {
  return cleanLabel(value).toLocaleLowerCase("tr");
}

/** `#RRGGBB` → `#rrggbb`; anything else is `null`. */
export function normalizeHex(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return HEX.test(trimmed) ? trimmed.toLowerCase() : null;
}

function readOptionalUrl(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * A request body as a validated input. Throws an `Error` with a sentence for the owner
 * when something is wrong. A `list` type keeps no colours or pictures; a `swatch` type
 * needs one of the two on every value.
 */
export function readVariantTypeBody(body: Record<string, unknown>): TrVariantTypeInput {
  const name = typeof body.name === "string" ? cleanLabel(body.name) : "";
  if (!name) throw new Error("Varyant türü adı zorunlu.");
  if (name.length > VARIANT_TYPE_LIMITS.nameMax) {
    throw new Error(
      `Varyant türü adı en fazla ${VARIANT_TYPE_LIMITS.nameMax} karakter olabilir.`,
    );
  }

  if (body.selectionStyle !== "list" && body.selectionStyle !== "swatch") {
    throw new Error("Seçim stilini seçin.");
  }
  const selectionStyle: TrVariantSelectionStyle = body.selectionStyle;
  if (body.role !== undefined && body.role !== null && readVariantTypeRole(body.role) === null) {
    throw new Error("Kullanım alanı geçersiz.");
  }
  const role = readVariantTypeRole(body.role);

  if (!Array.isArray(body.values)) throw new Error("Değerler geçersiz.");
  const seen = new Set<string>();
  const values: TrVariantTypeValueInput[] = [];
  for (const entry of body.values) {
    if (!entry || typeof entry !== "object") throw new Error("Değerler geçersiz.");
    const record = entry as Record<string, unknown>;
    const label = typeof record.label === "string" ? cleanLabel(record.label) : "";
    if (!label) continue; // an empty row is just skipped
    if (label.length > VARIANT_TYPE_LIMITS.labelMax) {
      throw new Error(
        `Bir değer en fazla ${VARIANT_TYPE_LIMITS.labelMax} karakter olabilir.`,
      );
    }
    const key = labelKey(label);
    if (seen.has(key)) throw new Error(`“${label}” iki kez eklenmiş.`);
    seen.add(key);

    const swatch = selectionStyle === "swatch";
    const hex = swatch ? normalizeHex(record.hex) : null;
    const imageUrl = swatch ? readOptionalUrl(record.imageUrl) : null;
    if (swatch && !hex && !imageUrl) {
      throw new Error(`“${label}” için bir renk veya görsel seçin.`);
    }
    const id = typeof record.id === "string" && record.id ? record.id : undefined;
    values.push({ ...(id ? { id } : {}), label, hex, imageUrl });
  }

  if (values.length === 0) throw new Error("En az bir değer ekleyin.");
  if (values.length > VARIANT_TYPE_LIMITS.valuesMax) {
    throw new Error(`En fazla ${VARIANT_TYPE_LIMITS.valuesMax} değer ekleyebilirsiniz.`);
  }
  if (body.hasPhotos !== undefined && typeof body.hasPhotos !== "boolean") {
    throw new Error("Fotoğraf ayarı geçersiz.");
  }
  return {
    name,
    selectionStyle,
    role,
    ...(typeof body.hasPhotos === "boolean" ? { hasPhotos: body.hasPhotos } : {}),
    values,
  };
}

/** What saving a type does to its stored values. */
export interface ValuePlan {
  insert: Array<{ input: TrVariantTypeValueInput; sortOrder: number }>;
  update: Array<{ id: string; input: TrVariantTypeValueInput; sortOrder: number }>;
  remove: string[];
  /**
   * A renamed value takes a label another existing value still holds (a swap, or a
   * value renamed into a name that is being freed): the unique label index would
   * reject it in one pass, so renamed values go through a temporary label first.
   */
  needsTwoPhase: boolean;
}

/**
 * Compares the stored values with the submitted ones. A submitted value keeps its
 * stored row when its id matches — renaming must not change the id, or every variant
 * that references it would lose the link. Values without an id are new; stored values
 * that are not submitted are removed. The submitted order becomes the sort order.
 */
export function planValueChanges(
  existing: readonly Pick<TrVariantTypeValue, "id" | "label">[],
  submitted: readonly TrVariantTypeValueInput[],
): ValuePlan {
  const storedById = new Map(existing.map((value) => [value.id, value]));
  const plan: ValuePlan = { insert: [], update: [], remove: [], needsTwoPhase: false };
  const kept = new Set<string>();

  submitted.forEach((input, sortOrder) => {
    if (input.id && storedById.has(input.id)) {
      kept.add(input.id);
      plan.update.push({ id: input.id, input, sortOrder });
    } else {
      plan.insert.push({ input, sortOrder });
    }
  });
  plan.remove = existing.filter((value) => !kept.has(value.id)).map((value) => value.id);

  // Labels held after the removals; a rename into one that another kept value still
  // holds (before its own rename) is what needs two phases.
  const currentByKey = new Map<string, string>();
  for (const value of existing) {
    if (kept.has(value.id)) currentByKey.set(labelKey(value.label), value.id);
  }
  for (const { id, input } of plan.update) {
    const holder = currentByKey.get(labelKey(input.label));
    if (holder !== undefined && holder !== id) plan.needsTwoPhase = true;
  }
  return plan;
}

/**
 * The size types every fashion boutique can start from, matching the lists the panel
 * used to hardcode: letter sizes and trouser sizes. Created by "Hazır bedenleri içe
 * aktar" (never seeded), after which the boutique edits them like any other type.
 */
export function builtInSizeTypeInputs(): TrVariantTypeInput[] {
  return [
    {
      name: "Beden",
      selectionStyle: "list",
      role: "size",
      values: DEFAULT_LETTER_SIZES.map((label) => ({ label })),
    },
    {
      name: "Pantolon bedeni",
      selectionStyle: "list",
      role: "size",
      values: ALL_NUMERIC_SIZES.map((label) => ({ label })),
    },
  ];
}

/**
 * The built-in size types a boutique can still import: offered only while it has no
 * size type at all, and only those whose name isn't taken.
 */
export function importableSizeTypeInputs(
  existing: ReadonlyArray<Pick<TrVariantType, "id" | "name" | "role">>,
): TrVariantTypeInput[] {
  if (existing.some((type) => type.role === "size")) return [];
  return builtInSizeTypeInputs().filter((input) => !hasTypeNamed(existing, input.name));
}

/** A type's names, for the "already exists" check. */
export function hasTypeNamed(
  types: ReadonlyArray<Pick<TrVariantType, "id" | "name">>,
  name: string,
  exceptId?: string,
): boolean {
  const key = labelKey(name);
  return types.some((type) => type.id !== exceptId && labelKey(type.name) === key);
}
