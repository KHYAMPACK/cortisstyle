"use client";

import {
  DEFAULT_CATALOG_BACKGROUND_ID,
  TR_CATALOG_BACKGROUNDS,
  type TrCatalogBackground,
} from "@/lib/tr/catalogBackgrounds/registry";

interface TrCatalogBackgroundPickerProps {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export function TrCatalogBackgroundPicker({
  value,
  onChange,
  disabled = false,
}: TrCatalogBackgroundPickerProps) {
  const selected = value || DEFAULT_CATALOG_BACKGROUND_ID;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[17px] font-semibold text-neutral-800">
          Katalog arka planı
        </p>
        <p className="mt-1 text-[14px] text-neutral-600">
          Ürün için tek arka plan — ön ve arka kesitlere uygulanır.
        </p>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
        {TR_CATALOG_BACKGROUNDS.map((bg: TrCatalogBackground) => {
          const active = selected === bg.id;
          return (
            <button
              key={bg.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(bg.id)}
              className={`overflow-hidden rounded-xl border-2 text-left transition-all ${
                active
                  ? "border-[color:var(--panel-accent)] ring-2 ring-[color:var(--panel-accent)]/25"
                  : "border-[color:var(--panel-accent-border)]"
              } disabled:opacity-50`}
              aria-pressed={active}
              aria-label={bg.label}
            >
              <span
                className="block aspect-[4/3] w-full"
                style={{ background: bg.css }}
              />
              <span className="block truncate px-1.5 py-1.5 text-center text-[11px] font-semibold text-neutral-700">
                {bg.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
