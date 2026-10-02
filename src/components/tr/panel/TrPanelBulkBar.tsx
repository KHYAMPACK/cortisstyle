"use client";

import { TrPanelBusySpinner } from "@/components/tr/panel/TrPanelMotion";
import type { ReactNode } from "react";
import { panelDesktopSecondaryBtnClass } from "@/components/tr/panel/panelDesktopUi";

interface TrPanelBulkBarProps {
  selectedCount: number;
  onClear: () => void;
  children: ReactNode;
  busy?: boolean;
}

export function TrPanelBulkBar({
  selectedCount,
  onClear,
  children,
  busy = false,
}: TrPanelBulkBarProps) {
  if (selectedCount <= 0) return null;

  return (
    <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-[color:var(--panel-accent-border)] bg-white px-4 py-3 shadow-lg">
      <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-neutral-800">
        {selectedCount} seçili
        {busy ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-neutral-600">
            · <TrPanelBusySpinner className="h-3.5 w-3.5 rounded-full" /> Kaydediliyor…
          </span>
        ) : null}
      </p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      <button
        type="button"
        onClick={onClear}
        disabled={busy}
        className={panelDesktopSecondaryBtnClass}
      >
        Seçimi temizle
      </button>
    </div>
  );
}
