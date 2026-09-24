import { ArrowDown, ArrowUp } from "lucide-react";
import type { TrDelta } from "@/lib/tr/panel/dashboardMetrics";
import { formatDecimal } from "@/components/tr/panel/dashboard/dashboardFormat";

type Tone = "good" | "bad" | "flat";

const TONE_CLASS: Record<Tone, string> = {
  good: "bg-emerald-50 text-emerald-700",
  bad: "bg-red-50 text-red-700",
  flat: "bg-neutral-100 text-neutral-500",
};

function Chip({
  tone,
  arrow,
  children,
}: {
  tone: Tone;
  arrow?: "up" | "down";
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold tabular-nums ${TONE_CLASS[tone]}`}
    >
      {arrow === "up" ? (
        <ArrowUp className="h-3 w-3" strokeWidth={2.25} aria-hidden />
      ) : arrow === "down" ? (
        <ArrowDown className="h-3 w-3" strokeWidth={2.25} aria-hidden />
      ) : null}
      {children}
    </span>
  );
}

function toneFor(sign: number, invert: boolean): Tone {
  if (sign === 0) return "flat";
  return (sign > 0) !== invert ? "good" : "bad";
}

/**
 * Change versus the previous period. `invert` flips the colours for numbers where
 * more is worse (cancellations).
 */
export function TrDashboardDelta({
  delta,
  invert = false,
}: {
  delta: TrDelta;
  invert?: boolean;
}) {
  if (delta.kind === "none") {
    return <span className="text-[11.5px] text-neutral-400">—</span>;
  }
  if (delta.kind === "new") {
    return (
      <Chip tone={toneFor(1, invert)} arrow="up">
        Yeni
      </Chip>
    );
  }
  const { percent } = delta;
  return (
    <Chip
      tone={toneFor(percent, invert)}
      arrow={percent > 0 ? "up" : percent < 0 ? "down" : undefined}
    >
      %{formatDecimal(Math.abs(percent))}
    </Chip>
  );
}

/** Change in a rate (0–1), in percentage points — a relative % of a % misleads. */
export function TrDashboardRateDelta({
  current,
  previous,
}: {
  current: number | null;
  previous: number | null;
}) {
  if (current === null || previous === null) {
    return <span className="text-[11.5px] text-neutral-400">—</span>;
  }
  const points = Math.round((current - previous) * 1000) / 10;
  return (
    <Chip
      tone={toneFor(points, false)}
      arrow={points > 0 ? "up" : points < 0 ? "down" : undefined}
    >
      {formatDecimal(Math.abs(points))} puan
    </Chip>
  );
}
