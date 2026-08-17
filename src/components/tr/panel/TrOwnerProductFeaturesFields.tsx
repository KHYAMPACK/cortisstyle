"use client";

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

interface TrOwnerProductFeaturesFieldsProps {
  value: TrProductFeatures;
  onChange: (next: TrProductFeatures) => void;
  disabled?: boolean;
  fieldClass: string;
  labelClass?: string;
  hintClass?: string;
}

export function TrOwnerProductFeaturesFields({
  value,
  onChange,
  disabled = false,
  fieldClass,
  labelClass = "text-[17px] font-semibold text-neutral-800",
  hintClass = "text-[13px] text-neutral-500",
}: TrOwnerProductFeaturesFieldsProps) {
  const setField = (key: (typeof TR_PRODUCT_FEATURE_KEYS)[number], raw: string) => {
    const next = raw.slice(0, TR_PRODUCT_FEATURE_LIMITS[key]);
    onChange({
      ...value,
      [key]: next,
    });
  };

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
        {TR_PRODUCT_FEATURE_KEYS.map((key) => {
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
