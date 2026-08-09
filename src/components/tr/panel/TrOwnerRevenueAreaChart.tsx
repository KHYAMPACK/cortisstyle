"use client";

import { useMemo, useState } from "react";
import { formatTryFromKurus } from "@/types/tr-marketplace";

export type TrRevenueChartRange = "1d" | "5d" | "1m" | "1y" | "max";

export interface TrRevenueSeriesPoint {
  date: string;
  revenueKurus: number;
  orderCount: number;
}

const RANGE_OPTIONS: Array<{ id: TrRevenueChartRange; label: string }> = [
  { id: "1d", label: "1G" },
  { id: "5d", label: "5G" },
  { id: "1m", label: "1A" },
  { id: "1y", label: "1Y" },
  { id: "max", label: "Maks." },
];

function istanbulTodayKey(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDaysKey(dayKey: string, delta: number): string {
  const base = new Date(`${dayKey}T12:00:00.000+03:00`);
  base.setTime(base.getTime() + delta * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(base);
}

function formatDayShort(dayKey: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "short",
  }).format(new Date(`${dayKey}T12:00:00.000+03:00`));
}

function formatDayLong(dayKey: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${dayKey}T12:00:00.000+03:00`));
}

function formatAxisTry(kurus: number): string {
  const tryValue = kurus / 100;
  if (tryValue >= 1000) {
    return `${(tryValue / 1000).toLocaleString("tr-TR", {
      maximumFractionDigits: 1,
    })}B`;
  }
  return tryValue.toLocaleString("tr-TR", {
    maximumFractionDigits: tryValue < 10 ? 1 : 0,
  });
}

function buildWindow(
  series: TrRevenueSeriesPoint[],
  range: TrRevenueChartRange,
): TrRevenueSeriesPoint[] {
  const byDate = new Map(series.map((point) => [point.date, point]));
  const today = istanbulTodayKey();

  if (range === "max") {
    if (series.length === 0) {
      return [{ date: today, revenueKurus: 0, orderCount: 0 }];
    }
    const start = series[0]!.date;
    const end = today;
    const out: TrRevenueSeriesPoint[] = [];
    let cursor = start;
    while (cursor <= end) {
      const hit = byDate.get(cursor);
      out.push(
        hit ?? { date: cursor, revenueKurus: 0, orderCount: 0 },
      );
      cursor = addDaysKey(cursor, 1);
      if (out.length > 800) break;
    }
    return out;
  }

  const days =
    range === "1d" ? 1 : range === "5d" ? 5 : range === "1m" ? 30 : 365;
  const start = addDaysKey(today, -(days - 1));
  const out: TrRevenueSeriesPoint[] = [];
  for (let i = 0; i < days; i += 1) {
    const date = addDaysKey(start, i);
    const hit = byDate.get(date);
    out.push(hit ?? { date, revenueKurus: 0, orderCount: 0 });
  }
  return out;
}

interface TrOwnerRevenueAreaChartProps {
  series: TrRevenueSeriesPoint[];
}

export function TrOwnerRevenueAreaChart({
  series,
}: TrOwnerRevenueAreaChartProps) {
  const [range, setRange] = useState<TrRevenueChartRange>("1m");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const points = useMemo(() => buildWindow(series, range), [series, range]);
  const total = useMemo(
    () => points.reduce((sum, point) => sum + point.revenueKurus, 0),
    [points],
  );
  const orderTotal = useMemo(
    () => points.reduce((sum, point) => sum + point.orderCount, 0),
    [points],
  );

  const width = 640;
  const height = 220;
  const padL = 44;
  const padR = 12;
  const padT = 16;
  const padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const maxY = Math.max(...points.map((p) => p.revenueKurus), 1);
  const niceMax = (() => {
    const raw = maxY * 1.08;
    const step = 10 ** Math.floor(Math.log10(raw));
    return Math.ceil(raw / step) * step;
  })();

  const coords = points.map((point, index) => {
    const x =
      points.length === 1
        ? padL + innerW / 2
        : padL + (index / (points.length - 1)) * innerW;
    const y = padT + innerH * (1 - point.revenueKurus / niceMax);
    return { x, y, point };
  });

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
    .join(" ");

  const areaPath =
    coords.length === 0
      ? ""
      : `${linePath} L ${coords[coords.length - 1]!.x.toFixed(2)} ${(padT + innerH).toFixed(2)} L ${coords[0]!.x.toFixed(2)} ${(padT + innerH).toFixed(2)} Z`;

  const yTicks = [0, 0.5, 1].map((t) => niceMax * t);
  const xLabelIndexes =
    points.length <= 2
      ? points.map((_, i) => i)
      : [0, Math.floor((points.length - 1) / 2), points.length - 1];

  const active =
    hoverIndex != null && coords[hoverIndex] ? coords[hoverIndex] : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-neutral-500">Dönem cirosu</p>
          <p
            className="text-[1.5rem] font-semibold tabular-nums tracking-tight"
            style={{ color: "var(--panel-accent-deep)" }}
          >
            {formatTryFromKurus(total)}
          </p>
          <p className="text-[12px] text-neutral-500">
            {orderTotal} ödenen sipariş
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg bg-neutral-100 p-1">
          {RANGE_OPTIONS.map((option) => {
            const activeRange = range === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setRange(option.id);
                  setHoverIndex(null);
                }}
                className={`rounded-md px-2.5 py-1.5 text-[12px] font-semibold transition-colors ${
                  activeRange
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[220px] w-full"
          role="img"
          aria-label="Ciro grafiği"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="ciroAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--panel-accent)"
                stopOpacity="0.35"
              />
              <stop
                offset="100%"
                stopColor="var(--panel-accent)"
                stopOpacity="0.02"
              />
            </linearGradient>
          </defs>

          {yTicks.map((tick) => {
            const y = padT + innerH * (1 - tick / niceMax);
            return (
              <g key={tick}>
                <line
                  x1={padL}
                  x2={width - padR}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  className="text-neutral-200"
                  strokeWidth={1}
                />
                <text
                  x={padL - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-neutral-400"
                  fontSize={10}
                >
                  {formatAxisTry(tick)}
                </text>
              </g>
            );
          })}

          {areaPath ? (
            <path d={areaPath} fill="url(#ciroAreaFill)" />
          ) : null}
          {linePath ? (
            <path
              d={linePath}
              fill="none"
              stroke="var(--panel-accent)"
              strokeWidth={2.25}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}

          {xLabelIndexes.map((index) => {
            const c = coords[index];
            const p = points[index];
            if (!c || !p) return null;
            return (
              <text
                key={p.date}
                x={c.x}
                y={height - 8}
                textAnchor="middle"
                className="fill-neutral-400"
                fontSize={10}
              >
                {formatDayShort(p.date)}
              </text>
            );
          })}

          {active ? (
            <>
              <line
                x1={active.x}
                x2={active.x}
                y1={padT}
                y2={padT + innerH}
                stroke="currentColor"
                className="text-neutral-400"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <circle
                cx={active.x}
                cy={active.y}
                r={4.5}
                fill="var(--panel-accent)"
                stroke="white"
                strokeWidth={2}
              />
            </>
          ) : null}

          {coords.map((c, index) => (
            <rect
              key={c.point.date}
              x={
                index === 0
                  ? padL
                  : (coords[index - 1]!.x + c.x) / 2
              }
              y={padT}
              width={
                index === 0
                  ? (coords[1]?.x ?? c.x + 8) - padL
                  : index === coords.length - 1
                    ? width - padR - (coords[index - 1]!.x + c.x) / 2
                    : (coords[index + 1]!.x - coords[index - 1]!.x) / 2
              }
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(index)}
            />
          ))}
        </svg>

        {active ? (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-neutral-900 px-3 py-2 text-white shadow-lg"
            style={{
              left: `${(active.x / width) * 100}%`,
              top: `${(active.y / height) * 100}%`,
              marginTop: -10,
            }}
          >
            <p className="text-[14px] font-semibold tabular-nums">
              {formatTryFromKurus(active.point.revenueKurus)}
            </p>
            <p className="text-[11px] text-neutral-300">
              {formatDayLong(active.point.date)}
              {active.point.orderCount > 0
                ? ` · ${active.point.orderCount} sipariş`
                : ""}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
