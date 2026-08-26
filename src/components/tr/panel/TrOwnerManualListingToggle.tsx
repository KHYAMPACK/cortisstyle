"use client";

import { panelHintClass } from "@/components/tr/panel/panelUi";

export function TrOwnerManualListingToggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-4 shadow-sm sm:p-5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label="Elle ekle"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="flex w-full items-center gap-4 text-left disabled:opacity-60"
      >
        <span
          className={`relative h-9 w-16 shrink-0 rounded-full transition-colors ${
            checked ? "bg-[color:var(--panel-accent)]" : "bg-neutral-300"
          }`}
        >
          <span
            aria-hidden
            className={`absolute top-1 left-1 h-7 w-7 rounded-full bg-white shadow-sm transition-transform ${
              checked ? "translate-x-7" : "translate-x-0"
            }`}
          />
        </span>
        <span>
          <span className="block text-[17px] font-semibold text-neutral-900">
            Elle ekle
          </span>
          <span className={`mt-0.5 block ${panelHintClass}`}>
            AI packshot ve model üretmez; kategori ve özellikleri sen seçersin.
          </span>
        </span>
      </button>
    </div>
  );
}
