"use client";

import { useEffect } from "react";
import {
  getDefaultReadyAiModelId,
  listAiModelOptions,
} from "@/lib/tr/aiModel/registry";

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
  const options = listAiModelOptions(boutiqueSlug).filter((o) => o.ready);

  useEffect(() => {
    if (value) return;
    const defaultId = getDefaultReadyAiModelId(boutiqueSlug);
    if (defaultId) onChange(defaultId);
  }, [boutiqueSlug, value, onChange]);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[17px] font-semibold text-neutral-800">
          Model seçimi
        </p>
        <p className="mt-1 text-[14px] text-neutral-600">
          Model üzerinde satış fotoğrafı — Ayla (kadın) veya Deniz (erkek).
        </p>
      </div>
      {options.length === 0 ? (
        <p className="text-[14px] text-amber-800">
          Hazır model yok. Stüdyo referansları henüz yüklenmedi.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {options.map((option) => {
            const active = value === option.id;
            const thumb = option.referenceImageUrls[0];
            const genderHint =
              option.gender === "woman"
                ? "Kadın"
                : option.gender === "man"
                  ? "Erkek"
                  : null;
            return (
              <button
                key={option.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange(active ? null : option.id)}
                className={`flex gap-3 rounded-2xl border-2 px-3 py-3 text-left transition-all ${
                  active
                    ? "border-[color:var(--panel-accent)] bg-[color:var(--panel-accent-softer)]"
                    : "border-[color:var(--panel-accent-border)] bg-white"
                } disabled:opacity-50`}
                aria-pressed={active}
              >
                {thumb ? (
                  <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumb}
                      alt=""
                      className="h-full w-full object-cover object-top"
                    />
                  </span>
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-semibold text-neutral-900">
                    {option.label}
                    {genderHint ? (
                      <span className="ml-1.5 text-[12px] font-medium text-neutral-500">
                        {genderHint}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-neutral-600">
                    {option.hint}
                  </span>
                  <span className="mt-2 inline-block rounded-lg bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
                    Hazır
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
