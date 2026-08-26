"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { TrBoutiqueSizeChartBodyGuide } from "@/components/tr/boutique/pdp/TrBoutiqueSizeChartBodyGuide";
import type { TrSizeChartTable } from "@/lib/tr/catalog/sizeCharts";

interface TrBoutiqueSizeChartModalProps {
  open: boolean;
  chart: TrSizeChartTable;
  onClose: () => void;
}

export function TrBoutiqueSizeChartModal({
  open,
  chart,
  onClose,
}: TrBoutiqueSizeChartModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            key="size-chart-backdrop"
            type="button"
            aria-label="Kapat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 z-[120] bg-black/40"
          />
          <div className="pointer-events-none fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              key="size-chart-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white px-5 py-6 shadow-2xl sm:max-h-[88vh] sm:max-w-3xl sm:rounded-2xl sm:px-8 sm:py-8"
            >
              <div className="flex items-start justify-between gap-4">
                <h2
                  id={titleId}
                  className="text-[18px] font-semibold tracking-tight text-neutral-950"
                >
                  {chart.title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Kapat"
                  className="flex h-10 w-10 shrink-0 items-center justify-center text-neutral-500 transition-colors hover:text-neutral-900"
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>

              <p className="mt-3 text-[12px] text-neutral-500">
                Ölçü birimi: {chart.unit}
              </p>

              {chart.measureKind === "body" && chart.measurePoints?.length ? (
                <TrBoutiqueSizeChartBodyGuide points={chart.measurePoints} />
              ) : null}

              <div className="-mx-1 mt-4 overflow-x-auto">
                <table className="w-max min-w-full border-collapse text-left text-[12px] md:text-[13px]">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="sticky left-0 bg-white py-2.5 pr-3 font-medium text-neutral-500">
                        Beden
                      </th>
                      {chart.columns.map((col) => (
                        <th
                          key={col}
                          className="px-2 py-2.5 text-center font-semibold text-neutral-950"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chart.rows.map((row, index) => (
                      <tr
                        key={row.id}
                        className={
                          index % 2 === 0 ? "bg-neutral-50" : "bg-white"
                        }
                      >
                        <th className="sticky left-0 bg-inherit py-2.5 pr-3 font-medium text-neutral-800">
                          {row.label}
                        </th>
                        {row.values.map((value, colIndex) => (
                          <td
                            key={`${row.id}-${chart.columns[colIndex]}`}
                            className="px-2 py-2.5 text-center tabular-nums text-neutral-800"
                          >
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-[12px] leading-relaxed text-neutral-600">
                {chart.howToMeasure}
              </p>
              <p className="mt-2 text-[12px] text-neutral-500">
                {chart.tolerance}
              </p>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
