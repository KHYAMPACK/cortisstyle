import { cleanText, kindOptionsFor, textKey, PRODUCT_KIND_LIMITS } from "@/lib/tr/productKinds/rules";
import type {
  TrAttributeDefinition,
  TrAttributeInput,
  TrKindAttribute,
  TrProductKind,
} from "@/lib/tr/productKinds/types";

/**
 * Form state of the Özellik and Ürün türü drawers, kept apart from the components so the
 * list rules (adding, ordering, option subsets) can be tested. Pure.
 */

export interface AttributeFormState {
  label: string;
  input: TrAttributeInput;
  options: string[];
  allowCustom: boolean;
}

export function emptyAttributeForm(): AttributeFormState {
  return { label: "", input: "choice", options: [], allowCustom: false };
}

export function formFromAttribute(attribute: TrAttributeDefinition): AttributeFormState {
  return {
    label: attribute.label,
    input: attribute.input,
    options: [...attribute.options],
    allowCustom: attribute.allowCustom,
  };
}

/** "Keten, Pamuk\nSaten" → appended options; repeats and overflow are reported. */
export function addOptions(
  options: readonly string[],
  raw: string,
): { options: string[]; skipped: string[] } {
  const next = [...options];
  const known = new Set(next.map(textKey));
  const skipped: string[] = [];
  for (const part of raw.split(/[,\n;]/)) {
    const option = cleanText(part).slice(0, PRODUCT_KIND_LIMITS.optionMax);
    if (!option) continue;
    if (known.has(textKey(option)) || next.length >= PRODUCT_KIND_LIMITS.optionsMax) {
      skipped.push(option);
      continue;
    }
    known.add(textKey(option));
    next.push(option);
  }
  return { options: next, skipped };
}

export function attributeBody(form: AttributeFormState): Record<string, unknown> {
  return {
    label: form.label,
    input: form.input,
    options: form.input === "choice" ? form.options : [],
    allowCustom: form.input === "choice" && form.allowCustom,
  };
}

export interface KindFormState {
  name: string;
  defaultOptionTypeIds: string[];
  suggestedCategoryId: string | null;
  attributes: TrKindAttribute[];
}

export function emptyKindForm(): KindFormState {
  return { name: "", defaultOptionTypeIds: [], suggestedCategoryId: null, attributes: [] };
}

export function formFromKind(kind: TrProductKind): KindFormState {
  return {
    name: kind.name,
    defaultOptionTypeIds: [...kind.defaultOptionTypeIds],
    suggestedCategoryId: kind.suggestedCategoryId,
    attributes: kind.attributes.map((link) => ({ ...link })),
  };
}

export function kindBody(form: KindFormState): Record<string, unknown> {
  return {
    name: form.name,
    defaultOptionTypeIds: form.defaultOptionTypeIds,
    suggestedCategoryId: form.suggestedCategoryId,
    attributes: form.attributes,
  };
}

/** Toggles a starting variant type, keeping the order they were picked in (max 3). */
export function toggleOptionType(ids: readonly string[], id: string): string[] {
  if (ids.includes(id)) return ids.filter((entry) => entry !== id);
  if (ids.length >= PRODUCT_KIND_LIMITS.optionTypesMax) return [...ids];
  return [...ids, id];
}

/**
 * Turns one of a field's options on or off for a kind. The subset is kept in the field's
 * order and collapses to `null` ("all options") when it covers them all.
 */
export function toggleKindOption(
  attribute: Pick<TrAttributeDefinition, "options">,
  link: TrKindAttribute,
  option: string,
): TrKindAttribute {
  const current = new Set(kindOptionsFor(attribute, link).map(textKey));
  if (current.has(textKey(option))) current.delete(textKey(option));
  else current.add(textKey(option));
  const kept = attribute.options.filter((entry) => current.has(textKey(entry)));
  return { ...link, options: kept.length === attribute.options.length ? null : kept };
}

/** Fields not yet on the kind, for its "Özellik ekle" menu. */
export function attributesToAdd<T extends Pick<TrAttributeDefinition, "id">>(
  all: readonly T[],
  form: Pick<KindFormState, "attributes">,
): T[] {
  const used = new Set(form.attributes.map((link) => link.attributeId));
  return all.filter((attribute) => !used.has(attribute.id));
}
