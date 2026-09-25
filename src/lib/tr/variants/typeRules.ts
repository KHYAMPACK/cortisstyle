import type {
  TrVariantSelectionStyle,
  TrVariantType,
  TrVariantTypeInput,
  TrVariantTypeValue,
  TrVariantTypeValueInput,
} from "@/lib/tr/variants/types";
import type { TrProductColor } from "@/types/tr-marketplace";

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
  return { name, selectionStyle, values };
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
 * The Beden / Renk types a boutique's saved size and colour presets would become. A
 * type is left out when there is nothing to put in it. Colours without a valid hex
 * are skipped (a swatch needs a colour).
 */
export function presetsToTypeInputs(
  sizePresets: readonly string[],
  colorPresets: readonly TrProductColor[],
): { beden: TrVariantTypeInput | null; renk: TrVariantTypeInput | null } {
  const sizes: TrVariantTypeValueInput[] = [];
  const sizeKeys = new Set<string>();
  for (const size of sizePresets) {
    const label = cleanLabel(size).slice(0, VARIANT_TYPE_LIMITS.labelMax);
    if (!label || sizeKeys.has(labelKey(label))) continue;
    sizeKeys.add(labelKey(label));
    sizes.push({ label });
  }

  const colors: TrVariantTypeValueInput[] = [];
  const colorKeys = new Set<string>();
  for (const color of colorPresets) {
    const label = cleanLabel(color.name).slice(0, VARIANT_TYPE_LIMITS.labelMax);
    const hex = normalizeHex(color.hex);
    if (!label || !hex || colorKeys.has(labelKey(label))) continue;
    colorKeys.add(labelKey(label));
    colors.push({ label, hex, imageUrl: null });
  }

  return {
    beden: sizes.length
      ? {
          name: "Beden",
          selectionStyle: "list",
          values: sizes.slice(0, VARIANT_TYPE_LIMITS.valuesMax),
        }
      : null,
    renk: colors.length
      ? {
          name: "Renk",
          selectionStyle: "swatch",
          values: colors.slice(0, VARIANT_TYPE_LIMITS.valuesMax),
        }
      : null,
  };
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
