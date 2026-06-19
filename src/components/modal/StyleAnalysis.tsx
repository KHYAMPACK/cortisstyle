"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { MetricRating, StyleMetrics } from "@/types/style-metrics";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };
const MAX_DOTS = 5;

interface StyleAnalysisProps extends StyleMetrics {}

export function StyleAnalysis({
  vibe,
  investmentRetail,
  investmentWithGuide,
  versatility,
}: StyleAnalysisProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.04 }}
      className="mt-6 space-y-4 border-t border-neutral-200 pt-6"
      aria-label="Style analysis"
    >
      <p className="text-[9px] tracking-[0.4em] text-neutral-400 uppercase">
        Style Analysis
      </p>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-4">
        <MetricItem label="Vibe" value={vibe} />
        <MetricItem label="Original Budget">
          <DotRating value={investmentRetail} muted />
        </MetricItem>
        <MetricItem label="Sourced Budget">
          <DotRating value={investmentWithGuide} accent />
        </MetricItem>
        <MetricItem label="Versatility">
          <DotRating value={versatility} />
        </MetricItem>
      </dl>
    </motion.section>
  );
}

function MetricItem({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <dt className="text-[9px] tracking-[0.28em] text-neutral-400 uppercase">
        {label}
      </dt>
      {value ? (
        <dd className="font-light text-sm leading-relaxed text-neutral-800">
          {value}
        </dd>
      ) : (
        <dd>{children}</dd>
      )}
    </div>
  );
}

function DotRating({
  value,
  muted = false,
  accent = false,
}: {
  value: MetricRating;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2"
      role="img"
      aria-label={`${value} out of ${MAX_DOTS}`}
    >
      {Array.from({ length: MAX_DOTS }, (_, index) => {
        const filled = index < value;

        return (
          <span
            key={index}
            className={`h-1.5 w-1.5 rounded-full ${
              filled
                ? accent
                  ? "bg-neutral-950"
                  : muted
                    ? "bg-neutral-400"
                    : "bg-neutral-800"
                : "border border-neutral-300"
            }`}
          />
        );
      })}
    </div>
  );
}
