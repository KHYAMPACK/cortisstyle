"use client";

import { useEffect } from "react";
import {
  getDefaultReadyAiModelId,
  DEFAULT_HOUSE_PHOTOGRAPHY_STYLE,
  HOUSE_PHOTOGRAPHY_STYLE_LABELS,
  HOUSE_PHOTOGRAPHY_STYLES,
  housePhotographyStyleRefs,
  listAiModelOptions,
  type TrHousePhotographyStyle,
} from "@/lib/tr/aiModel/registry";

interface TrOwnerAiModelPickerProps {
  boutiqueSlug?: string | null;
  value: string | null;
  onChange: (id: string | null) => void;
  photographyStyle?: TrHousePhotographyStyle;
  onPhotographyStyleChange?: (style: TrHousePhotographyStyle) => void;
  disabled?: boolean;
  /** Sheet / regen: skip the page heading, keep a 2-col grid. */
  variant?: "default" | "sheet";
  /** When false, tapping the active model keeps it selected. */
  allowDeselect?: boolean;
  /** Elbise try-on uses grey-studio plates — no blinds/flash picker. */
  hidePhotographyStyle?: boolean;
  /** When false, do not auto-pick the house model (lifestyle shots already exist). */
  autoSelectDefault?: boolean;
}

function pickerCardClass(active: boolean): string {
  return [
    "relative flex min-h-14 cursor-pointer gap-3 rounded-2xl border-2 px-3 py-3 text-left",
    "transition-[border-color,background-color,box-shadow,transform] duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)]",
    "disabled:opacity-50",
    active
      ? "border-[color:var(--panel-accent)] bg-[color:var(--panel-accent-softer)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--panel-accent)_30%,transparent)]"
      : "border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50 hover:shadow-sm",
  ].join(" ");
}

function PickerSelectedMark() {
  return (
    <span
      className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--panel-accent)] text-white shadow-sm"
      aria-hidden
    >
      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
        <path
          d="M3.5 8.2 6.4 11 12.5 4.8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function TrOwnerAiModelPicker({
  boutiqueSlug,
  value,
  onChange,
  photographyStyle = DEFAULT_HOUSE_PHOTOGRAPHY_STYLE,
  onPhotographyStyleChange,
  disabled = false,
  variant = "default",
  allowDeselect = true,
  hidePhotographyStyle = false,
  autoSelectDefault = true,
}: TrOwnerAiModelPickerProps) {
  const options = listAiModelOptions(boutiqueSlug).filter((o) => o.ready);
  const styleRefs = hidePhotographyStyle ? null : housePhotographyStyleRefs(value);

  useEffect(() => {
    if (value || !autoSelectDefault) return;
    const defaultId = getDefaultReadyAiModelId(boutiqueSlug);
    if (defaultId) onChange(defaultId);
  }, [autoSelectDefault, boutiqueSlug, value, onChange]);

  const sheet = variant === "sheet";

  return (
    <div className="space-y-3">
      {sheet ? null : (
        <div>
          <p className="text-[17px] font-semibold text-neutral-800">
            Model seçimi
          </p>
          <p className="mt-1 text-[14px] text-neutral-600">
            {styleRefs
              ? "Kimin üzerinde gösterileceği. Işık stilini siz seçersiniz; poz rastgele."
              : hidePhotographyStyle
                ? "Kimin üzerinde gösterileceği. Poz: üç-çeyrek ve sırt (detay varsa üçüncü kare)."
                : "Kimin üzerinde gösterileceği. Poz otomatik seçilir."}
          </p>
        </div>
      )}
      {options.length === 0 ? (
        <p className="text-[14px] text-amber-800">
          Hazır model yok. Stüdyo referansları henüz yüklenmedi.
        </p>
      ) : (
        <div
          className={
            sheet
              ? "grid grid-cols-1 gap-2 sm:grid-cols-2"
              : "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4"
          }
        >
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
                onClick={() => {
                  if (active && !allowDeselect) return;
                  onChange(active ? null : option.id);
                }}
                className={pickerCardClass(active)}
                aria-pressed={active}
              >
                {active ? <PickerSelectedMark /> : null}
                {thumb ? (
                  <span
                    className={`relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100 ring-2 ${
                      active
                        ? "ring-[color:var(--panel-accent)]"
                        : "ring-transparent"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumb}
                      alt=""
                      className="h-full w-full object-cover object-top"
                    />
                  </span>
                ) : null}
                <span className="min-w-0 flex-1 pr-5">
                  <span className="block text-[16px] font-semibold text-neutral-900">
                    {option.label}
                    {genderHint ? (
                      <span className="ml-1.5 text-[12px] font-medium text-neutral-500">
                        {genderHint}
                      </span>
                    ) : null}
                  </span>
                  {sheet ? null : (
                    <span className="mt-0.5 block text-[13px] text-neutral-600">
                      {option.hint}
                    </span>
                  )}
                  <span
                    className={`mt-2 inline-block rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
                      active
                        ? "bg-[color:var(--panel-accent)] text-white"
                        : "bg-emerald-100 text-emerald-900"
                    }`}
                  >
                    {active ? "Seçili" : "Hazır"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {styleRefs ? (
        <div className="space-y-2">
          <p className="text-[15px] font-semibold text-neutral-800">
            Işık stili
          </p>
          <p className="text-[13px] text-neutral-600">
            Poz rastgele. Bu stilden bir kare üretilir.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {HOUSE_PHOTOGRAPHY_STYLES.map((style) => {
              const active = photographyStyle === style;
              const thumb = styleRefs[style][0];
              return (
                <button
                  key={style}
                  type="button"
                  disabled={disabled}
                  onClick={() => onPhotographyStyleChange?.(style)}
                  className={`${pickerCardClass(active)} items-center`}
                  aria-pressed={active}
                >
                  {active ? <PickerSelectedMark /> : null}
                  {thumb ? (
                    <span
                      className={`relative h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100 ring-2 ${
                        active
                          ? "ring-[color:var(--panel-accent)]"
                          : "ring-transparent"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumb}
                        alt=""
                        className="h-full w-full object-cover object-top"
                      />
                    </span>
                  ) : null}
                  <span className="pr-5 text-[15px] font-semibold text-neutral-900">
                    {HOUSE_PHOTOGRAPHY_STYLE_LABELS[style]}
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
