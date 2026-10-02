"use client";

import { panelChipClass, panelFieldClass, panelHintClass } from "@/components/tr/panel/panelUi";
import { featureValueMax } from "@/lib/tr/catalog/productFeatures";
import { choiceChips, readFeatureValue, withFeatureValue } from "@/lib/tr/productKinds/featureValues";
import { kindOptionsFor } from "@/lib/tr/productKinds/rules";
import type { TrAttributeDefinition, TrProductKind } from "@/lib/tr/productKinds/types";
import type { TrProductFeatures } from "@/types/tr-marketplace";

/**
 * The product's Özellikler: its kind's fields, in the kind's order, filled in as each
 * field says (chips, a line, a box). A stored value that isn't one of the chips is shown
 * as a selected chip of its own, so nothing saved is ever hidden. Other `features`
 * entries are left as they are.
 */
export function TrProductAttributesFields({
  kind,
  attributes,
  features,
  onChange,
  disabled = false,
}: {
  kind: TrProductKind;
  attributes: readonly TrAttributeDefinition[];
  features: TrProductFeatures;
  onChange: (next: TrProductFeatures) => void;
  disabled?: boolean;
}) {
  const byId = new Map(attributes.map((attribute) => [attribute.id, attribute]));
  const set = (key: string, value: string) => onChange(withFeatureValue(features, key, value));

  return (
    <div className="space-y-5">
      {kind.attributes.map((link) => {
        const attribute = byId.get(link.attributeId);
        if (!attribute) return null;
        const value = readFeatureValue(features, attribute.key);
        const label = (
          <span className="text-[14px] font-medium text-neutral-700">
            {attribute.label}
            {link.required ? (
              <span className="text-[color:var(--panel-accent)]"> *</span>
            ) : null}
          </span>
        );

        if (attribute.input === "choice") {
          const options = kindOptionsFor(attribute, link);
          const isOption = options.some(
            (option) => option.toLocaleLowerCase("tr") === value.toLocaleLowerCase("tr"),
          );
          // A typed value lives in the box below; otherwise an off-list value gets a chip.
          const chips = attribute.allowCustom ? options : choiceChips(options, value);
          const typed = attribute.allowCustom && !isOption ? value : "";
          return (
            <div key={attribute.id} className="space-y-2">
              <p>{label}</p>
              <div className="flex flex-wrap gap-2">
                {chips.map((chip) => {
                  const on = chip.toLocaleLowerCase("tr") === value.toLocaleLowerCase("tr");
                  return (
                    <button
                      key={chip}
                      type="button"
                      aria-pressed={on}
                      disabled={disabled}
                      onClick={() => set(attribute.key, on ? "" : chip)}
                      className={panelChipClass(on)}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
              {attribute.allowCustom ? (
                <input
                  value={typed}
                  onChange={(event) => set(attribute.key, event.target.value)}
                  maxLength={featureValueMax(attribute.key)}
                  placeholder="Listede yoksa yazın"
                  aria-label={`${attribute.label}: başka bir değer`}
                  disabled={disabled}
                  className={`${panelFieldClass} max-w-sm`}
                />
              ) : null}
            </div>
          );
        }

        return (
          <label key={attribute.id} className="block space-y-2">
            {label}
            {attribute.input === "textarea" ? (
              <textarea
                value={value}
                onChange={(event) => set(attribute.key, event.target.value)}
                maxLength={featureValueMax(attribute.key)}
                disabled={disabled}
                className={`${panelFieldClass} min-h-20`}
              />
            ) : (
              <input
                value={value}
                onChange={(event) => set(attribute.key, event.target.value)}
                maxLength={featureValueMax(attribute.key)}
                disabled={disabled}
                className={panelFieldClass}
              />
            )}
          </label>
        );
      })}
      <p className={panelHintClass}>Boş bırakılanlar sitede görünmez.</p>
    </div>
  );
}
