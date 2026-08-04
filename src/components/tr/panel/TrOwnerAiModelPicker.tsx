"use client";

import { getBoutiqueAiModelIdentity } from "@/lib/tr/aiModel/registry";

export interface TrOwnerModelOption {
  id: string;
  label: string;
  hint: string;
  ready: boolean;
}

function buildModelOptions(boutiqueSlug: string | null | undefined): TrOwnerModelOption[] {
  const options: TrOwnerModelOption[] = [];
  const slug = boutiqueSlug?.trim().toLowerCase() ?? "";
  const boutiqueModel = slug ? getBoutiqueAiModelIdentity(slug) : null;

  if (boutiqueModel) {
    options.push({
      id: `boutique:${boutiqueModel.boutiqueSlug}`,
      label: boutiqueModel.displayName,
      hint: boutiqueModel.referenceImageUrls.length
        ? "Butik modeli"
        : "Referans fotoğrafı yakında",
      ready: boutiqueModel.referenceImageUrls.some((url) => Boolean(url?.trim())),
    });
  }

  options.push(
    {
      id: "studio:ayla",
      label: "Ayla",
      hint: "Stüdyo modeli · yakında",
      ready: false,
    },
    {
      id: "studio:deniz",
      label: "Deniz",
      hint: "Stüdyo modeli · yakında",
      ready: false,
    },
  );

  return options;
}

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
  const options = buildModelOptions(boutiqueSlug);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[17px] font-semibold text-neutral-800">
          Model seçimi
        </p>
        <p className="mt-1 text-[14px] text-neutral-600">
          Seçilen modele kıyafet giydirme yakında. Şimdilik tercih kaydı için
          seçebilirsiniz.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const active = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(active ? null : option.id)}
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
                  Yakında
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
