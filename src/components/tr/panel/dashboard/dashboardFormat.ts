import type {
  TrDashboardKpis,
  TrDashboardSeriesPoint,
} from "@/lib/tr/panel/dashboardMetrics";
import { formatTryFromKurus } from "@/types/tr-marketplace";

const integerFormat = new Intl.NumberFormat("tr-TR");
const oneDecimalFormat = new Intl.NumberFormat("tr-TR", {
  maximumFractionDigits: 1,
});
const spanDayFormat = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
});
const spanDayYearFormat = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
  year: "numeric",
});
const isoDayFormat = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
});

export const formatCount = (value: number): string => integerFormat.format(value);

export const formatDecimal = (value: number): string =>
  oneDecimalFormat.format(value);

/** 0.1234 → "%12,3"; null means "not measurable" and shows a dash. */
export function formatRate(rate: number | null): string {
  return rate === null ? "—" : `%${oneDecimalFormat.format(rate * 100)}`;
}

/** Compact money for chart axes: ₺750, ₺1,5 bin, ₺2 Mn. Input is TL. */
export function formatAxisTry(tl: number): string {
  if (tl >= 1_000_000) return `₺${oneDecimalFormat.format(tl / 1_000_000)} Mn`;
  if (tl >= 1_000) return `₺${oneDecimalFormat.format(tl / 1_000)} bin`;
  return `₺${oneDecimalFormat.format(tl)}`;
}

/** "18 Eyl – 24 Eyl 2026" for a window whose end is exclusive. */
export function formatWindowSpan(startMs: number, endMs: number): string {
  const first = new Date(startMs);
  const last = new Date(endMs - 1);
  if (spanDayFormat.format(first) === spanDayFormat.format(last)) {
    return spanDayYearFormat.format(last);
  }
  const sameYear =
    spanDayYearFormat.format(first).slice(-4) ===
    spanDayYearFormat.format(last).slice(-4);
  return `${
    sameYear ? spanDayFormat.format(first) : spanDayYearFormat.format(first)
  } – ${spanDayYearFormat.format(last)}`;
}

/** "2026-09-18" → "18 Eyl" (the string is already a calendar day, so no zone shift). */
export function formatIsoDay(day: string): string {
  return isoDayFormat.format(new Date(`${day}T00:00:00Z`));
}

/** What the chart can plot: one number per KPI and per time bucket. */
export type TrDashboardMetricId =
  | "revenue"
  | "orders"
  | "averageOrder"
  | "newCustomers"
  | "cancelled";

export interface TrDashboardMetric {
  id: TrDashboardMetricId;
  label: string;
  /** Raw values are kuruş — the chart converts to TL for its axis. */
  money: boolean;
  /** More of this is bad (cancellations), so an increase is shown in red. */
  invertDelta: boolean;
  total: (kpis: TrDashboardKpis) => number;
  point: (point: TrDashboardSeriesPoint) => number;
  format: (value: number) => string;
}

export const TR_DASHBOARD_METRICS: ReadonlyArray<TrDashboardMetric> = [
  {
    id: "revenue",
    label: "Toplam Satış",
    money: true,
    invertDelta: false,
    total: (kpis) => kpis.revenueKurus,
    point: (point) => point.revenueKurus,
    format: formatTryFromKurus,
  },
  {
    id: "orders",
    label: "Sipariş Sayısı",
    money: false,
    invertDelta: false,
    total: (kpis) => kpis.orderCount,
    point: (point) => point.orderCount,
    format: formatCount,
  },
  {
    id: "averageOrder",
    label: "Ort. Sipariş Tutarı",
    money: true,
    invertDelta: false,
    total: (kpis) => kpis.averageOrderKurus,
    point: (point) =>
      point.orderCount === 0
        ? 0
        : Math.round(point.revenueKurus / point.orderCount),
    format: formatTryFromKurus,
  },
  {
    id: "newCustomers",
    label: "Yeni Müşteri",
    money: false,
    invertDelta: false,
    total: (kpis) => kpis.newCustomers,
    point: (point) => point.newCustomers,
    format: formatCount,
  },
  {
    id: "cancelled",
    label: "İptaller",
    money: false,
    invertDelta: true,
    total: (kpis) => kpis.cancelledCount,
    point: (point) => point.cancelledCount,
    format: formatCount,
  },
];

/**
 * Axis ceiling and step for a chart with `intervals` gridlines above zero.
 * Steps are 1 / 2 / 2.5 / 5 × 10ⁿ in display units (TL or a plain count), so
 * ticks read as round numbers; counts never get a fractional step.
 */
export function niceAxis(
  maxValue: number,
  { integer, intervals = 4 }: { integer: boolean; intervals?: number },
): { step: number; max: number } {
  const rawStep = maxValue > 0 ? maxValue / intervals : integer ? 1 : 100;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const candidates = integer ? [1, 2, 5, 10] : [1, 2, 2.5, 5, 10];
  const scaled = candidates.find((c) => c * magnitude >= rawStep - 1e-9) ?? 10;
  let step = scaled * magnitude;
  if (integer) step = Math.max(1, Math.round(step));
  else step = Math.max(1, step);
  return { step, max: step * intervals };
}
