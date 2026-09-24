/**
 * Date ranges for the panel home dashboard: the window to report on, the window
 * to compare it with, and how to bucket it for the chart.
 *
 * Pure and timezone-explicit (Europe/Istanbul). Turkey has been UTC+3 all year
 * since 2016, so the offset is a constant and no DST handling is needed.
 */

export type TrDashboardRangeId =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "7d"
  | "30d"
  | "3m"
  | "6m"
  | "this_year"
  | "custom";

/** Labels and order match the date picker in the reference admin. */
export const TR_DASHBOARD_RANGE_OPTIONS: ReadonlyArray<{
  id: TrDashboardRangeId;
  label: string;
}> = [
  { id: "today", label: "Bugün" },
  { id: "yesterday", label: "Dün" },
  { id: "this_week", label: "Bu Hafta" },
  { id: "last_week", label: "Geçen Hafta" },
  { id: "this_month", label: "Bu Ay" },
  { id: "last_month", label: "Geçen Ay" },
  { id: "7d", label: "Son 7 Gün" },
  { id: "30d", label: "Son 30 Gün" },
  { id: "3m", label: "Son 3 Ay" },
  { id: "6m", label: "Son 6 Ay" },
  { id: "this_year", label: "Bu Yıl" },
  { id: "custom", label: "Özel Tarih" },
];

export const DEFAULT_DASHBOARD_RANGE: TrDashboardRangeId = "7d";

export function isDashboardRangeId(value: unknown): value is TrDashboardRangeId {
  return TR_DASHBOARD_RANGE_OPTIONS.some((option) => option.id === value);
}

export type TrDashboardBucket = "hour" | "day" | "week" | "month";

export interface TrDashboardWindow {
  id: TrDashboardRangeId;
  label: string;
  /** Inclusive start, exclusive end (epoch ms). */
  startMs: number;
  endMs: number;
  /** The comparison window, same rules. */
  prevStartMs: number;
  prevEndMs: number;
  bucket: TrDashboardBucket;
}

export type ResolveDashboardWindowResult =
  | { ok: true; window: TrDashboardWindow }
  | { ok: false; error: string };

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const IST_OFFSET_MS = 3 * HOUR;
const MAX_CUSTOM_DAYS = 366;

interface DayParts {
  y: number;
  m: number;
  d: number;
  /** Monday = 0. */
  dow: number;
}

function istParts(ms: number): DayParts {
  const shifted = new Date(ms + IST_OFFSET_MS);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth(),
    d: shifted.getUTCDate(),
    dow: (shifted.getUTCDay() + 6) % 7,
  };
}

/** Istanbul midnight of the given calendar day; month overflow rolls over. */
function istMidnight(y: number, m: number, d: number): number {
  return Date.UTC(y, m, d) - IST_OFFSET_MS;
}

/** Istanbul calendar day of `ms` as YYYY-MM-DD, the format `custom` ranges use. */
export function istanbulDayString(ms: number): string {
  return new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function startOfIstDay(ms: number): number {
  const p = istParts(ms);
  return istMidnight(p.y, p.m, p.d);
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
}

/** Same day-of-month `months` earlier/later, clamped to the target month's length. */
function shiftMonths(ms: number, months: number): number {
  const p = istParts(ms);
  const total = p.y * 12 + p.m + months;
  const y = Math.floor(total / 12);
  const m = total - y * 12;
  return istMidnight(y, m, Math.min(p.d, daysInMonth(y, m)));
}

function parseIstDay(value: string | null | undefined): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  const ms = istMidnight(y, m - 1, d);
  const p = istParts(ms);
  // Reject impossible dates like 2026-02-31 that Date would silently roll over.
  return p.y === y && p.m === m - 1 && p.d === d ? ms : null;
}

function pickBucket(startMs: number, endMs: number): TrDashboardBucket {
  const days = (endMs - startMs) / DAY;
  if (days <= 2) return "hour";
  if (days <= 100) return "day";
  if (days <= 200) return "week";
  return "month";
}

/** The immediately preceding window of exactly the same length. */
function precedingEqualLength(startMs: number, endMs: number) {
  return { prevStartMs: startMs - (endMs - startMs), prevEndMs: startMs };
}

/**
 * Same elapsed span of the previous calendar unit (e.g. this month up to day 10
 * versus last month up to day 10), never reaching into the current unit.
 */
function previousCalendarUnit(
  startMs: number,
  endMs: number,
  prevUnitStartMs: number,
) {
  return {
    prevStartMs: prevUnitStartMs,
    prevEndMs: Math.min(prevUnitStartMs + (endMs - startMs), startMs),
  };
}

export function resolveDashboardWindow(input: {
  range: TrDashboardRangeId;
  from?: string | null;
  to?: string | null;
  nowMs: number;
}): ResolveDashboardWindowResult {
  const { range, nowMs } = input;
  const nowEnd = nowMs + 1;
  const todayStart = startOfIstDay(nowMs);
  const today = istParts(nowMs);
  const weekStart = todayStart - today.dow * DAY;
  const monthStart = istMidnight(today.y, today.m, 1);
  const yearStart = istMidnight(today.y, 0, 1);
  const label =
    TR_DASHBOARD_RANGE_OPTIONS.find((option) => option.id === range)?.label ??
    "";

  let startMs: number;
  let endMs: number;
  let prev: { prevStartMs: number; prevEndMs: number };

  switch (range) {
    case "today":
      startMs = todayStart;
      endMs = nowEnd;
      prev = previousCalendarUnit(startMs, endMs, todayStart - DAY);
      break;
    case "yesterday":
      startMs = todayStart - DAY;
      endMs = todayStart;
      prev = { prevStartMs: startMs - DAY, prevEndMs: startMs };
      break;
    case "this_week":
      startMs = weekStart;
      endMs = nowEnd;
      prev = previousCalendarUnit(startMs, endMs, weekStart - 7 * DAY);
      break;
    case "last_week":
      startMs = weekStart - 7 * DAY;
      endMs = weekStart;
      prev = { prevStartMs: startMs - 7 * DAY, prevEndMs: startMs };
      break;
    case "this_month":
      startMs = monthStart;
      endMs = nowEnd;
      prev = previousCalendarUnit(
        startMs,
        endMs,
        istMidnight(today.y, today.m - 1, 1),
      );
      break;
    case "last_month":
      startMs = istMidnight(today.y, today.m - 1, 1);
      endMs = monthStart;
      prev = {
        prevStartMs: istMidnight(today.y, today.m - 2, 1),
        prevEndMs: startMs,
      };
      break;
    case "7d":
      startMs = todayStart - 6 * DAY;
      endMs = nowEnd;
      prev = precedingEqualLength(startMs, endMs);
      break;
    case "30d":
      startMs = todayStart - 29 * DAY;
      endMs = nowEnd;
      prev = precedingEqualLength(startMs, endMs);
      break;
    case "3m":
      startMs = shiftMonths(todayStart, -3);
      endMs = nowEnd;
      prev = precedingEqualLength(startMs, endMs);
      break;
    case "6m":
      startMs = shiftMonths(todayStart, -6);
      endMs = nowEnd;
      prev = precedingEqualLength(startMs, endMs);
      break;
    case "this_year":
      startMs = yearStart;
      endMs = nowEnd;
      prev = previousCalendarUnit(
        startMs,
        endMs,
        istMidnight(today.y - 1, 0, 1),
      );
      break;
    case "custom": {
      const from = parseIstDay(input.from);
      const to = parseIstDay(input.to);
      if (from === null || to === null) {
        return { ok: false, error: "Geçerli bir başlangıç ve bitiş tarihi seçin." };
      }
      if (from > to) {
        return { ok: false, error: "Başlangıç tarihi bitişten sonra olamaz." };
      }
      if (from > todayStart) {
        return { ok: false, error: "Gelecekteki bir tarih seçilemez." };
      }
      startMs = from;
      endMs = Math.min(to + DAY, nowEnd);
      if ((endMs - startMs) / DAY > MAX_CUSTOM_DAYS) {
        return { ok: false, error: "En fazla 1 yıllık aralık seçilebilir." };
      }
      prev = precedingEqualLength(startMs, endMs);
      break;
    }
    default:
      return { ok: false, error: "Geçersiz tarih aralığı." };
  }

  return {
    ok: true,
    window: {
      id: range,
      label,
      startMs,
      endMs,
      ...prev,
      bucket: pickBucket(startMs, endMs),
    },
  };
}

/** Start of every bucket in [startMs, endMs). */
export function bucketStarts(
  startMs: number,
  endMs: number,
  bucket: TrDashboardBucket,
): number[] {
  const starts: number[] = [];

  if (bucket === "month") {
    starts.push(startMs);
    const first = istParts(startMs);
    for (let i = 1; i < 400; i += 1) {
      const next = istMidnight(first.y, first.m + i, 1);
      if (next >= endMs) break;
      starts.push(next);
    }
    return starts;
  }

  const step = bucket === "hour" ? HOUR : bucket === "day" ? DAY : 7 * DAY;
  for (let at = startMs; at < endMs; at += step) starts.push(at);
  return starts;
}

/** Index of the bucket containing `ms`, or -1 when it is outside the window. */
export function bucketIndexFor(starts: number[], endMs: number, ms: number): number {
  if (starts.length === 0 || ms < starts[0]! || ms >= endMs) return -1;
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (starts[mid]! <= ms) low = mid;
    else high = mid - 1;
  }
  return low;
}

const dayMonthFormat = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
});
const monthFormat = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  month: "short",
});
const hourFormat = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function bucketLabel(startMs: number, bucket: TrDashboardBucket): string {
  if (bucket === "hour") return hourFormat.format(new Date(startMs));
  if (bucket === "month") return monthFormat.format(new Date(startMs));
  return dayMonthFormat.format(new Date(startMs));
}
