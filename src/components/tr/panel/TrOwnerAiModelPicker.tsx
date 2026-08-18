"use client";

import { useEffect } from "react";
import {
  getDefaultReadyAiModelId,
  isLilaHouseModelId,
  LILA_DEFAULT_PHOTOGRAPHY_STYLE,
  LILA_PHOTOGRAPHY_STYLE_LABELS,
  LILABUTIK_LILA_TRYON_REFS_BY_STYLE,
  listAiModelOptions,
  type TrLilaPhotographyStyle,
} from "@/lib/tr/aiModel/registry";

interface TrOwnerAiModelPickerProps {
  boutiqueSlug?: string | null;
  value: string | null;
  onChange: (id: string | null) => void;
  photographyStyle?: TrLilaPhotographyStyle;
  onPhotographyStyleChange?: (style: TrLilaPhotographyStyle) => void;
  disabled?: boolean;
}

const LILA_STYLES: TrLilaPhotographyStyle[] = ["blinds", "flash"];

export function TrOwnerAiModelPicker({
  boutiqueSlug,
  value,
  onChange,
  photographyStyle = LILA_DEFAULT_PHOTOGRAPHY_STYLE,
  onPhotographyStyleChange,
  disabled = false,
}: TrOwnerAiModelPickerProps) {
  const options = listAiModelOptions(boutiqueSlug).filter((o) => o.ready);
  const showLilaStyles = isLilaHouseModelId(value);

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
          {showLilaStyles
            ? "Kimin üzerinde gösterileceği. Işık stilini siz seçersiniz; poz rastgele."
            : "Kimin üzerinde gösterileceği. Poz otomatik seçilir."}
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
                className={`flex min-h-14 gap-3 rounded-2xl border-2 px-3 py-3 text-left transition-all ${
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

      {showLilaStyles ? (
        <div className="space-y-2">
          <p className="text-[15px] font-semibold text-neutral-800">
            Işık stili
          </p>
          <p className="text-[13px] text-neutral-600">
            Poz rastgele. Bu stilden 2 farklı kare üretilir.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {LILA_STYLES.map((style) => {
              const active = photographyStyle === style;
              const thumb = LILABUTIK_LILA_TRYON_REFS_BY_STYLE[style][0];
              return (
                <button
                  key={style}
                  type="button"
                  disabled={disabled}
                  onClick={() => onPhotographyStyleChange?.(style)}
                  className={`flex min-h-14 items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left transition-all ${
                    active
                      ? "border-[color:var(--panel-accent)] bg-[color:var(--panel-accent-softer)]"
                      : "border-[color:var(--panel-accent-border)] bg-white"
                  } disabled:opacity-50`}
                  aria-pressed={active}
                >
                  {thumb ? (
                    <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumb}
                        alt=""
                        className="h-full w-full object-cover object-top"
                      />
                    </span>
                  ) : null}
                  <span className="text-[15px] font-semibold text-neutral-900">
                    {LILA_PHOTOGRAPHY_STYLE_LABELS[style]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
