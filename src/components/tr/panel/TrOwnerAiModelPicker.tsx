"use client";

import { listAiModelOptions } from "@/lib/tr/aiModel/registry";

interface TrOwnerAiModelPickerProps {
  boutiqueSlug?: string | null;
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
}

export function TrOwnerAiModelPicker({
  boutiqueSlug,
  value,
  onChange,
  disabled = false,
}: TrOwnerAiModelPickerProps) {
  const options = listAiModelOptions(boutiqueSlug);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[17px] font-semibold text-neutral-800">
          Model seçimi
        </p>
        <p className="mt-1 text-[14px] text-neutral-600">
          Model üzerinde satış fotoğrafı için seçin. Stüdyo veya butik modeli.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const active = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled || !option.ready}
              onClick={() => {
                if (!option.ready) return;
                onChange(active ? null : option.id);
              }}
              className={`rounded-2xl border-2 px-4 py-4 text-left transition-all ${
                active
                  ? "border-[color:var(--panel-accent)] bg-[color:var(--panel-accent-softer)]"
                  : "border-[color:var(--panel-accent-border)] bg-white"
              } disabled:opacity-50`}
              aria-pressed={active}
            >
              <span className="block text-[16px] font-semibold text-neutral-900">
                {option.label}
              </span>
              <span className="mt-1 block text-[13px] text-neutral-600">
                {option.hint}
              </span>
              {!option.ready ? (
                <span className="mt-2 inline-block rounded-lg bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                  Referans bekleniyor
                </span>
              ) : (
                <span className="mt-2 inline-block rounded-lg bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
                  Hazır
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
