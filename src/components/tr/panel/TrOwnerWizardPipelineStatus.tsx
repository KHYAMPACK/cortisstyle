"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { PipelineJobItem } from "@/lib/tr/aiCatalog/pipelineProgress";

export function TrOwnerWizardPipelineStatus({
  jobs,
}: {
  jobs: PipelineJobItem[];
}) {
  const visible = jobs.filter(
    (job) => job.status === "running" || job.status === "error",
  );
  if (visible.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border-2 border-[color:var(--panel-accent-border)] bg-white p-4 shadow-sm"
        aria-live="polite"
      >
        <p className="text-[13px] font-semibold tracking-wide text-neutral-500 uppercase">
          Arka planda hazırlanıyor
        </p>
        <ul className="mt-3 space-y-3">
          {visible.map((job) => (
            <li key={job.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-neutral-900">
                    {job.label}
                  </p>
                  {job.detail ? (
                    <p
                      className={`mt-0.5 text-[12px] ${
                        job.status === "error"
                          ? "text-red-700"
                          : "text-neutral-500"
                      }`}
                    >
                      {job.detail}
                    </p>
                  ) : null}
                </div>
                {job.status === "running" ? (
                  <span className="shrink-0 text-[13px] font-semibold tabular-nums text-neutral-700">
                    {Math.round(job.progressPct)}%
                  </span>
                ) : null}
              </div>
              {job.status === "running" ? (
                <div className="mt-2 h-2 overflow-hidden rounded-sm bg-[color:var(--panel-accent-soft)]">
                  <motion.div
                    className="h-full rounded-sm"
                    style={{ background: "var(--panel-accent)" }}
                    animate={{ width: `${job.progressPct}%` }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </motion.div>
    </AnimatePresence>
  );
}
