"use client";

import { panelChipClass } from "@/components/tr/panel/panelUi";
import {
  DRESS_FEATURE_GROUPS,
  type DressFeatureKey,
} from "@/lib/tr/catalog/dressFeatures";
import {
  TR_PRODUCT_FEATURE_KEYS,
  TR_PRODUCT_FEATURE_LABELS,
  TR_PRODUCT_FEATURE_LIMITS,
  type TrProductFeatures,
} from "@/lib/tr/catalog/productFeatures";

const HINTS: Partial<Record<keyof TrProductFeatures, string>> = {
  gender: "Kadın, Erkek veya Unisex",
  fit: "Örn. Relaxed, Slim, Oversize",
  color: "Fotoğraftaki renk",
  neckHem: "Yaka veya paça detayı",
  fabric: "Kumaşın görünümü / tutumu",
  composition: "Yalnızca etiketten okunabiliyorsa",
};

const GENDER_CHIPS = ["Kadın", "Erkek", "Unisex"] as const;

const GENERIC_FEATURE_KEYS = [
  "gender",
  "fit",
  "color",
  "neckHem",
  "fabric",
  "composition",
] as const;

const DRESS_FREE_TEXT_KEYS = ["color", "composition"] as const;

interface TrOwnerProductFeaturesFieldsProps {
  value: TrProductFeatures;
  onChange: (next: TrProductFeatures) => void;
  disabled?: boolean;
  fieldClass: string;
  labelClass?: string;
  hintClass?: string;
  /** Elbise: chip groups instead of the generic free-text grid. */
  variant?: "default" | "dress";
}

export function TrOwnerProductFeaturesFields({
  value,
  onChange,
  disabled = false,
  fieldClass,
  labelClass = "text-[17px] font-semibold text-neutral-800",
  hintClass = "text-[13px] text-neutral-500",
  variant = "default",
}: TrOwnerProductFeaturesFieldsProps) {
  const setField = (key: (typeof TR_PRODUCT_FEATURE_KEYS)[number], raw: string) => {
    const next = raw.slice(0, TR_PRODUCT_FEATURE_LIMITS[key]);
    onChange({
      ...value,
      [key]: next,
    });
  };

  const toggleChip = (key: DressFeatureKey | "gender", label: string) => {
    const current = value[key] ?? "";
    setField(key, current === label ? "" : label);
  };

  if (variant === "dress") {
    return (
      <div className="space-y-5">
        <div>
          <p className={labelClass}>Ürün özellikleri</p>
          <p className={`mt-1 ${hintClass}`}>
            AI önerir; siz onaylarsınız. Boş bırakılanlar sitede görünmez.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-[14px] font-medium text-neutral-700">Cinsiyet</p>
          <div className="flex flex-wrap gap-2">
            {GENDER_CHIPS.map((label) => (
              <button
                key={label}
                type="button"
                disabled={disabled}
                onClick={() => toggleChip("gender", label)}
                className={panelChipClass((value.gender ?? "") === label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {DRESS_FEATURE_GROUPS.map((group) => {
          const current = value[group.key] ?? "";
          return (
            <div key={group.key} className="space-y-2">
              <p className="text-[14px] font-medium text-neutral-700">
                {group.label}
                {group.optional ? (
                  <span className="ml-1 font-normal text-neutral-400">
                    (isteğe bağlı)
                  </span>
                ) : null}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleChip(group.key, option.label)}
                    className={panelChipClass(current === option.label)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {DRESS_FREE_TEXT_KEYS.map((key) => {
          const multiline = key === "composition";
          return (
            <label key={key} className="block space-y-2">
              <span className="text-[14px] font-medium text-neutral-700">
                {TR_PRODUCT_FEATURE_LABELS[key]}
              </span>
              {multiline ? (
                <textarea
                  value={value[key] ?? ""}
                  onChange={(event) => setField(key, event.target.value)}
                  className={`${fieldClass} min-h-20`}
                  maxLength={TR_PRODUCT_FEATURE_LIMITS[key]}
                  placeholder={HINTS[key]}
                  disabled={disabled}
                />
              ) : (
                <input
                  value={value[key] ?? ""}
                  onChange={(event) => setField(key, event.target.value)}
                  className={fieldClass}
                  maxLength={TR_PRODUCT_FEATURE_LIMITS[key]}
                  placeholder={HINTS[key]}
                  disabled={disabled}
                />
              )}
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className={labelClass}>Ürün özellikleri</p>
        <p className={`mt-1 ${hintClass}`}>
          AI doldurur; boş bırakılanlar sitede görünmez. Üretim yeri, etiket,
          kapama, cep ve manken ölçüsü yok.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {GENERIC_FEATURE_KEYS.map((key) => {
          const multiline = key === "fabric" || key === "composition";
          const current = value[key] ?? "";
          return (
            <label
              key={key}
              className={`block space-y-2 ${multiline ? "sm:col-span-2" : ""}`}
            >
              <span className="text-[14px] font-medium text-neutral-700">
                {TR_PRODUCT_FEATURE_LABELS[key]}
              </span>
              {multiline ? (
                <textarea
                  value={current}
                  onChange={(event) => setField(key, event.target.value)}
                  className={`${fieldClass} min-h-20`}
                  maxLength={TR_PRODUCT_FEATURE_LIMITS[key]}
                  placeholder={HINTS[key]}
                  disabled={disabled}
                />
              ) : (
                <input
                  value={current}
                  onChange={(event) => setField(key, event.target.value)}
                  className={fieldClass}
                  maxLength={TR_PRODUCT_FEATURE_LIMITS[key]}
                  placeholder={HINTS[key]}
                  disabled={disabled}
                />
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
