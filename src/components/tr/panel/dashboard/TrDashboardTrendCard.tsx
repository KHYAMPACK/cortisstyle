"use client";

import { motion } from "framer-motion";
import { TrDashboardChart } from "@/components/tr/panel/dashboard/TrDashboardChart";
import { TrDashboardDelta } from "@/components/tr/panel/dashboard/TrDashboardDelta";
import { TrDashboardSegmentFooter } from "@/components/tr/panel/dashboard/TrDashboardSegmentFooter";
import {
  formatWindowSpan,
  TR_DASHBOARD_METRICS,
  type TrDashboardMetricId,
} from "@/components/tr/panel/dashboard/dashboardFormat";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";
import {
  computeDelta,
  type TrDashboardSeriesPoint,
  type TrOwnerDashboard,
} from "@/lib/tr/panel/dashboardMetrics";

function toSeries(
  points: TrDashboardSeriesPoint[],
  pick: (point: TrDashboardSeriesPoint) => number,
) {
  return {
    labels: points.map((point) => point.label),
    values: points.map(pick),
  };
}

/** The five headline numbers; the selected one drives the trend chart below. */
export function TrDashboardTrendCard({
  dashboard,
  compare,
  metricId,
  onMetricChange,
}: {
  dashboard: TrOwnerDashboard;
  compare: boolean;
  metricId: TrDashboardMetricId;
  onMetricChange: (next: TrDashboardMetricId) => void;
}) {
  const metric =
    TR_DASHBOARD_METRICS.find((entry) => entry.id === metricId) ??
    TR_DASHBOARD_METRICS[0]!;
  const { range } = dashboard;

  const current = toSeries(dashboard.series, metric.point);
  const previous = compare ? toSeries(dashboard.previousSeries, metric.point) : null;
  const span = formatWindowSpan(range.startMs, range.endMs);
  const previousSpan = formatWindowSpan(range.prevStartMs, range.prevEndMs);

  return (
    <section className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div
        role="tablist"
        aria-label="Metrik"
        className="flex divide-x divide-neutral-100 overflow-x-auto border-b border-neutral-100"
      >
        {TR_DASHBOARD_METRICS.map((entry) => {
          const selected = entry.id === metric.id;
          const value = entry.total(dashboard.current);
          return (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onMetricChange(entry.id)}
              className={`relative min-w-[9.5rem] flex-1 px-4 py-3 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[color:var(--panel-accent-deep)] sm:px-5 sm:py-4 ${
                selected ? "bg-white" : "hover:bg-neutral-50"
              }`}
            >
              <span
                className={`block text-[12px] font-medium ${
                  selected
                    ? "text-[color:var(--panel-accent-deep)]"
                    : "text-neutral-500"
                }`}
              >
                {entry.label}
              </span>
              <span className="mt-1 block text-[1.3rem] font-semibold tracking-tight tabular-nums text-neutral-900 sm:text-[1.5rem]">
                {entry.format(value)}
              </span>
              <span className="mt-1.5 block h-5">
                {compare ? (
                  <TrDashboardDelta
                    delta={computeDelta(value, entry.total(dashboard.previous))}
                    invert={entry.invertDelta}
                  />
                ) : null}
              </span>
              {selected ? (
                <motion.span
                  layoutId="dashboard-kpi-underline"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-[color:var(--panel-accent)]"
                  transition={{ duration: 0.25, ease: trPanelEase }}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        <div className="px-3 pt-4 pb-3 sm:px-5 sm:pb-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1 sm:px-0">
            <p className="text-[13px] text-neutral-500">
              <span className="font-medium text-neutral-800">{metric.label}</span>
              {" · "}
              {span}
            </p>
            {compare ? (
              <p className="flex items-center gap-3 text-[12px] text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 rounded-full bg-[color:var(--panel-accent)]" />
                  Bu dönem
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-0 w-4 border-t-2 border-dashed border-neutral-400" />
                  Önceki dönem ({previousSpan})
                </span>
              </p>
            ) : null}
          </div>
          <TrDashboardChart
            current={current}
            previous={previous}
            money={metric.money}
            formatValue={metric.format}
            seriesKey={`${metric.id}:${range.id}:${range.startMs}`}
            empty={current.values.every((value) => value === 0)}
            ariaLabel={`${metric.label} grafiği, ${span}`}
          />
        </div>
        <TrDashboardSegmentFooter
          dashboard={dashboard}
          metric={metric}
          compare={compare}
        />
      </div>
    </section>
  );
}
