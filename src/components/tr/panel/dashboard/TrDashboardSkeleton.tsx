import { TrPanelPulse } from "@/components/tr/panel/TrPanelMotion";
import { panelCardClass } from "@/components/tr/panel/panelUi";

/** Same silhouette as the loaded dashboard: KPI strip, chart, then the cards. */
export function TrDashboardSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Özet yükleniyor">
      <div className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex divide-x divide-neutral-100 border-b border-neutral-100">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="min-w-[9.5rem] flex-1 space-y-2 px-4 py-4 sm:px-5">
              <TrPanelPulse className="h-3 w-20" />
              <TrPanelPulse className="h-7 w-24" />
              <TrPanelPulse className="h-4 w-12" />
            </div>
          ))}
        </div>
        <div className="p-4 sm:p-5">
          <TrPanelPulse className="h-[240px] w-full sm:h-[280px]" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-[repeat(auto-fit,minmax(15rem,1fr))]">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className={`${panelCardClass} space-y-3`}>
            <TrPanelPulse className="h-4 w-32" />
            <TrPanelPulse className="h-7 w-28" />
            <TrPanelPulse className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <TrPanelPulse className="h-72 w-full" />
        <TrPanelPulse className="h-72 w-full" />
      </div>
    </div>
  );
}
