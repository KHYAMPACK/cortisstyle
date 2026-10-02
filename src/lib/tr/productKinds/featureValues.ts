import type { TrProductFeatures } from "@/types/tr-marketplace";
import type { TrAttributeDefinition, TrProductKind } from "@/lib/tr/productKinds/types";

/**
 * Reading and writing one field's value in `tr_products.features`. Built-in fields
 * (gender, fabric…) and a store's own fields live side by side under their keys, so the
 * editor treats them the same. Pure.
 */

export function readFeatureValue(features: TrProductFeatures, key: string): string {
  const value = (features as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

/** The features with `key` set to `value`; an empty value removes the key. */
export function withFeatureValue(
  features: TrProductFeatures,
  key: string,
  value: string,
): TrProductFeatures {
  const next = { ...(features as Record<string, unknown>) };
  if (value.trim()) next[key] = value;
  else delete next[key];
  return next as TrProductFeatures;
}

/**
 * The chips a choice field shows: the options this kind offers, plus the stored value
 * when it isn't one of them (old or typed wording), so a value is never hidden.
 */
export function choiceChips(options: readonly string[], stored: string): string[] {
  const value = stored.trim();
  if (!value) return [...options];
  const known = options.some(
    (option) => option.toLocaleLowerCase("tr") === value.toLocaleLowerCase("tr"),
  );
  return known ? [...options] : [...options, value];
}

/** The first required field of the kind left empty, as a sentence; null when all are filled. */
export function missingRequiredField(
  kind: Pick<TrProductKind, "attributes"> | null,
  attributes: ReadonlyArray<Pick<TrAttributeDefinition, "id" | "key" | "label">>,
  features: TrProductFeatures,
): string | null {
  if (!kind) return null;
  const byId = new Map(attributes.map((attribute) => [attribute.id, attribute]));
  for (const link of kind.attributes) {
    const attribute = byId.get(link.attributeId);
    if (link.required && attribute && !readFeatureValue(features, attribute.key).trim()) {
      return `“${attribute.label}” zorunlu.`;
    }
  }
  return null;
}
