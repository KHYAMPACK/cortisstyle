"use client";

import { TrPanelComboboxField } from "@/components/tr/panel/TrPanelCreatableSelect";
import { panelFieldClass, panelHintClass } from "@/components/tr/panel/panelUi";
import { featureValueMax } from "@/lib/tr/catalog/productFeatures";
import { readFeatureValue, withFeatureValue } from "@/lib/tr/productKinds/featureValues";
import { kindOptionsFor } from "@/lib/tr/productKinds/rules";
import type { TrAttributeDefinition, TrProductKind } from "@/lib/tr/productKinds/types";
import type { TrProductFeatures } from "@/types/tr-marketplace";

/**
 * The product's Özellikler: its kind's fields, in the kind's order, two per row. A
 * choice field is a searchable box over the kind's options (typing a value of one's own
 * where the field allows it); a stored value outside the list stays shown as the value.
 * Other `features` entries are left as they are. Needs a card with `allowOverflow`.
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
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2">
        {kind.attributes.map((link) => {
          const attribute = byId.get(link.attributeId);
          if (!attribute) return null;
          const value = readFeatureValue(features, attribute.key);

          if (attribute.input === "choice") {
            return (
              <TrPanelComboboxField
                key={attribute.id}
                label={attribute.label}
                required={link.required}
                value={value}
                onChange={(next) => set(attribute.key, next)}
                options={kindOptionsFor(attribute, link)}
                allowCustom={attribute.allowCustom}
                maxLength={featureValueMax(attribute.key)}
                disabled={disabled}
              />
            );
          }

          const label = (
            <span className="text-[14px] font-medium text-neutral-700">
              {attribute.label}
              {link.required ? (
                <span className="text-[color:var(--panel-accent)]"> *</span>
              ) : null}
            </span>
          );
          return attribute.input === "textarea" ? (
            <label key={attribute.id} className="block space-y-2 sm:col-span-2">
              {label}
              <textarea
                value={value}
                onChange={(event) => set(attribute.key, event.target.value)}
                maxLength={featureValueMax(attribute.key)}
                disabled={disabled}
                className={`${panelFieldClass} min-h-20`}
              />
            </label>
          ) : (
            <label key={attribute.id} className="block space-y-2">
              {label}
              <input
                value={value}
                onChange={(event) => set(attribute.key, event.target.value)}
                maxLength={featureValueMax(attribute.key)}
                disabled={disabled}
                className={panelFieldClass}
              />
            </label>
          );
        })}
      </div>
      <p className={panelHintClass}>Boş bırakılanlar sitede görünmez.</p>
    </div>
  );
}
