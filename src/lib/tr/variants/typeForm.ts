import {
  cleanLabel,
  hasTypeNamed,
  labelKey,
  readVariantTypeBody,
  VARIANT_TYPE_LIMITS,
} from "@/lib/tr/variants/typeRules";
import type {
  TrVariantSelectionStyle,
  TrVariantType,
  TrVariantTypeRole,
} from "@/lib/tr/variants/types";

/**
 * Form state of the variant type drawer, as the owner edits it. Kept apart from the
 * component so the list rules (adding, ordering, duplicates) can be tested.
 */

export interface VariantValueDraft {
  /** Stable React key; not sent. */
  key: string;
  /** The stored value's id, when this row already exists. */
  id?: string;
  label: string;
  /** `#rrggbb` or `""`. */
  hex: string;
  imageUrl: string | null;
}

export interface VariantTypeFormState {
  name: string;
  selectionStyle: TrVariantSelectionStyle;
  role: TrVariantTypeRole | null;
  values: VariantValueDraft[];
}

let keyCounter = 0;
function nextKey(): string {
  keyCounter += 1;
  return `value-${keyCounter}`;
}

export function emptyVariantTypeForm(): VariantTypeFormState {
  return { name: "", selectionStyle: "list", role: null, values: [] };
}

export function formFromVariantType(type: TrVariantType): VariantTypeFormState {
  return {
    name: type.name,
    selectionStyle: type.selectionStyle,
    role: type.role,
    values: type.values.map((value) => ({
      key: value.id,
      id: value.id,
      label: value.label,
      hex: value.hex ?? "",
      imageUrl: value.imageUrl,
    })),
  };
}

/** "S, M\nL" → ["S", "M", "L"]: commas and line breaks separate values. */
export function splitValueInput(raw: string): string[] {
  return raw
    .split(/[,\n;]/)
    .map(cleanLabel)
    .filter(Boolean);
}

/**
 * Appends values from typed or pasted text. Repeats (of an existing value or within
 * the input) and anything beyond the limit are skipped and reported.
 */
export function addValues(
  form: VariantTypeFormState,
  labels: readonly string[],
): { form: VariantTypeFormState; skipped: string[] } {
  const known = new Set(form.values.map((value) => labelKey(value.label)));
  const values = [...form.values];
  const skipped: string[] = [];
  for (const raw of labels) {
    const label = cleanLabel(raw).slice(0, VARIANT_TYPE_LIMITS.labelMax);
    if (!label) continue;
    if (known.has(labelKey(label)) || values.length >= VARIANT_TYPE_LIMITS.valuesMax) {
      skipped.push(label);
      continue;
    }
    known.add(labelKey(label));
    values.push({ key: nextKey(), label, hex: "", imageUrl: null });
  }
  return { form: { ...form, values }, skipped };
}

export function moveValue<T>(values: readonly T[], index: number, offset: -1 | 1): T[] {
  const target = index + offset;
  if (target < 0 || target >= values.length) return [...values];
  const next = [...values];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

/** The API body for the form. */
export function variantTypeBody(form: VariantTypeFormState): Record<string, unknown> {
  return {
    name: form.name,
    selectionStyle: form.selectionStyle,
    role: form.role,
    values: form.values.map((value) => ({
      ...(value.id ? { id: value.id } : {}),
      label: value.label,
      hex: value.hex || null,
      imageUrl: value.imageUrl,
    })),
  };
}

/**
 * The first problem in the form as a sentence, or null when it can be saved. Uses the
 * API's own rules, plus the "name already used" check against the boutique's types.
 */
export function validateVariantTypeForm(
  form: VariantTypeFormState,
  others: ReadonlyArray<Pick<TrVariantType, "id" | "name">> = [],
  exceptId?: string,
): string | null {
  try {
    readVariantTypeBody(variantTypeBody(form));
  } catch (problem) {
    return problem instanceof Error ? problem.message : "Varyant türü geçersiz.";
  }
  if (hasTypeNamed(others, form.name, exceptId)) {
    return `“${cleanLabel(form.name)}” adında bir varyant türü zaten var.`;
  }
  return null;
}
