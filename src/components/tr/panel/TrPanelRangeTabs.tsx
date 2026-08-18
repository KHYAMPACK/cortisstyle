"use client";

export type TrPanelSummaryRange = "today" | "7d" | "30d" | "all";

export const TR_PANEL_RANGE_TABS: Array<{
  id: TrPanelSummaryRange;
  label: string;
}> = [
  { id: "today", label: "Bugün" },
  { id: "7d", label: "Bu hafta" },
  { id: "30d", label: "Bu ay" },
  { id: "all", label: "Tümü" },
];

export function TrPanelRangeTabs({
  value,
  onChange,
}: {
  value: TrPanelSummaryRange;
  onChange: (next: TrPanelSummaryRange) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Tarih aralığı"
      className="flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ring-1 ring-neutral-200/80"
    >
      {TR_PANEL_RANGE_TABS.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`min-h-10 shrink-0 rounded-lg px-3.5 text-[13px] font-semibold transition-colors lg:min-h-8 ${
              active
                ? "bg-[color:var(--panel-accent-soft)] text-[color:var(--panel-accent-deep)]"
                : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
