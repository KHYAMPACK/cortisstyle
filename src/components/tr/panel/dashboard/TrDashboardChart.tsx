"use client";

import { useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  formatAxisTry,
  formatCount,
  niceAxis,
} from "@/components/tr/panel/dashboard/dashboardFormat";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";

const AXIS_INTERVALS = 4;
/** The SVG is drawn in a 1000 × 100 box and stretched, so paths keep their shape at any width. */
const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 100;
const MAX_X_LABELS = 6;
const TOOLTIP_FLIP_AT = 60;

interface ChartSeries {
  labels: string[];
  /** Raw values: kuruş for money, plain counts otherwise. */
  values: number[];
}

function linePath(points: Array<[number, number]>): string {
  return points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
}

/**
 * Trend line with an optional dashed previous-period line, hover tooltip and a
 * left-to-right reveal whenever `seriesKey` changes.
 */
export function TrDashboardChart({
  current,
  previous,
  money,
  formatValue,
  seriesKey,
  empty,
  ariaLabel,
}: {
  current: ChartSeries;
  previous: ChartSeries | null;
  money: boolean;
  formatValue: (raw: number) => string;
  /** Changes when the data behind the chart changes, replaying the reveal. */
  seriesKey: string;
  empty: boolean;
  ariaLabel: string;
}) {
  const reduceMotion = useReducedMotion();
  const gradientId = `dash-area-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [hover, setHover] = useState<number | null>(null);

  const count = current.values.length;
  const unit = money ? 100 : 1;
  const peak =
    Math.max(0, ...current.values, ...(previous?.values ?? [])) / unit;
  const axis = niceAxis(peak, { integer: !money, intervals: AXIS_INTERVALS });
  const ticks = Array.from({ length: AXIS_INTERVALS + 1 }, (_, i) => i * axis.step);

  const xOf = (index: number) =>
    count <= 1 ? VIEW_WIDTH / 2 : (index / (count - 1)) * VIEW_WIDTH;
  const yOf = (raw: number) => VIEW_HEIGHT - (raw / unit / axis.max) * VIEW_HEIGHT;

  const currentPoints = current.values.map((v, i): [number, number] => [xOf(i), yOf(v)]);
  const previousPoints = previous
    ? previous.values.slice(0, count).map((v, i): [number, number] => [xOf(i), yOf(v)])
    : null;

  const line = linePath(currentPoints);
  const area =
    currentPoints.length > 1
      ? `${line} L${xOf(count - 1)} ${VIEW_HEIGHT} L${xOf(0)} ${VIEW_HEIGHT} Z`
      : "";

  const active = hover !== null && hover < count ? hover : null;
  const labelEvery = Math.max(1, Math.ceil(count / MAX_X_LABELS));
  const axisLabel = (tl: number) => (money ? formatAxisTry(tl) : formatCount(tl));

  function indexAt(event: React.PointerEvent<HTMLDivElement>): number {
    if (count <= 1) return 0;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    return Math.min(count - 1, Math.max(0, Math.round(ratio * (count - 1))));
  }

  const activeX = active === null ? 0 : (xOf(active) / VIEW_WIDTH) * 100;

  return (
    <div className="relative flex h-[240px] sm:h-[280px]">
      <div className="relative w-14 shrink-0" aria-hidden>
        <div className="absolute inset-x-0 top-2 bottom-7">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-2 translate-y-1/2 text-[11.5px] tabular-nums text-neutral-400"
              style={{ bottom: `${(tick / axis.max) * 100}%` }}
            >
              {axisLabel(tick)}
            </span>
          ))}
        </div>
      </div>

      <div className="relative min-w-0 flex-1">
        <div
          role="img"
          aria-label={ariaLabel}
          className="absolute inset-x-0 top-2 bottom-7 cursor-crosshair touch-pan-y"
          onPointerMove={(event) => setHover(indexAt(event))}
          onPointerDown={(event) => setHover(indexAt(event))}
          onPointerLeave={() => setHover(null)}
        >
          <motion.svg
            key={seriesKey}
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
            initial={
              reduceMotion ? false : { clipPath: "inset(-10% 100% -10% -2%)" }
            }
            animate={{ clipPath: "inset(-10% -2% -10% -2%)" }}
            transition={{ duration: 0.7, ease: trPanelEase }}
            aria-hidden
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0"
                  style={{ stopColor: "var(--panel-accent)", stopOpacity: 0.22 }}
                />
                <stop
                  offset="1"
                  style={{ stopColor: "var(--panel-accent)", stopOpacity: 0 }}
                />
              </linearGradient>
            </defs>
            {ticks.map((tick) => {
              const y = VIEW_HEIGHT - (tick / axis.max) * VIEW_HEIGHT;
              return (
                <line
                  key={tick}
                  x1={0}
                  x2={VIEW_WIDTH}
                  y1={y}
                  y2={y}
                  className="stroke-neutral-200"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
            {area ? <path d={area} fill={`url(#${gradientId})`} /> : null}
            {previousPoints && previousPoints.length > 1 ? (
              <path
                d={linePath(previousPoints)}
                fill="none"
                className="stroke-neutral-400"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            {currentPoints.length > 1 ? (
              <path
                d={line}
                fill="none"
                style={{ stroke: "var(--panel-accent)" }}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
          </motion.svg>

          {count === 1 && active === null ? (
            <span
              className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--panel-accent)] ring-2 ring-white"
              style={{ left: "50%", top: `${currentPoints[0]?.[1] ?? 100}%` }}
              aria-hidden
            />
          ) : null}

          {active !== null ? (
            <>
              <span
                className="pointer-events-none absolute inset-y-0 w-px bg-neutral-300"
                style={{ left: `${activeX}%` }}
                aria-hidden
              />
              {previousPoints && previousPoints[active] ? (
                <span
                  className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-400 ring-2 ring-white"
                  style={{ left: `${activeX}%`, top: `${previousPoints[active]![1]}%` }}
                  aria-hidden
                />
              ) : null}
              <span
                className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--panel-accent)] ring-2 ring-white"
                style={{ left: `${activeX}%`, top: `${currentPoints[active]![1]}%` }}
                aria-hidden
              />
              <div
                className="pointer-events-none absolute top-0 z-10 min-w-[9rem] rounded-lg border border-neutral-200/80 bg-white px-3 py-2 shadow-[0_8px_24px_rgba(16,24,40,0.14)]"
                style={{
                  left: `${activeX}%`,
                  transform:
                    activeX > TOOLTIP_FLIP_AT
                      ? "translateX(calc(-100% - 12px))"
                      : "translateX(12px)",
                }}
                aria-hidden
              >
                <p className="text-[11.5px] font-medium text-neutral-500">
                  {current.labels[active]}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[13.5px] font-semibold tabular-nums text-neutral-900">
                  <span className="h-2 w-2 rounded-full bg-[color:var(--panel-accent)]" />
                  {formatValue(current.values[active] ?? 0)}
                </p>
                {previous && previous.values[active] !== undefined ? (
                  <p className="mt-0.5 flex items-center gap-1.5 text-[12px] tabular-nums text-neutral-500">
                    <span className="h-2 w-2 rounded-full bg-neutral-400" />
                    {previous.labels[active]} · {formatValue(previous.values[active] ?? 0)}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}

          {empty ? (
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13.5px] text-neutral-400">
              Bu dönemde veri yok.
            </p>
          ) : null}
        </div>

        <div className="absolute inset-x-0 bottom-0 h-7" aria-hidden>
          {current.labels.map((label, index) =>
            index % labelEvery === 0 ? (
              <span
                key={index}
                className="absolute top-2 text-[11.5px] whitespace-nowrap text-neutral-400"
                style={{
                  left: `${(xOf(index) / VIEW_WIDTH) * 100}%`,
                  transform:
                    count <= 1
                      ? "translateX(-50%)"
                      : index === 0
                        ? "translateX(0)"
                        : index === count - 1
                          ? "translateX(-100%)"
                          : "translateX(-50%)",
                }}
              >
                {label}
              </span>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
}
