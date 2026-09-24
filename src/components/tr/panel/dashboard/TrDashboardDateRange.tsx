"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { formatIsoDay } from "@/components/tr/panel/dashboard/dashboardFormat";
import {
  panelFieldClass,
  panelLabelClass,
  panelPrimaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";
import {
  istanbulDayString,
  resolveDashboardWindow,
  TR_DASHBOARD_RANGE_OPTIONS,
} from "@/lib/tr/panel/dashboardRange";
import type { TrOwnerDashboardQuery } from "@/lib/tr/ownerClient";

const DAY_MS = 86_400_000;

function triggerLabel(value: TrOwnerDashboardQuery): string {
  if (value.range === "custom" && value.from && value.to) {
    return value.from === value.to
      ? formatIsoDay(value.from)
      : `${formatIsoDay(value.from)} – ${formatIsoDay(value.to)}`;
  }
  return (
    TR_DASHBOARD_RANGE_OPTIONS.find((option) => option.id === value.range)
      ?.label ?? ""
  );
}

/** Date-range dropdown: presets plus a custom from/to picker. */
export function TrDashboardDateRange({
  value,
  onChange,
}: {
  value: TrOwnerDashboardQuery;
  onChange: (next: TrOwnerDashboardQuery) => void;
}) {
  const reduceMotion = useReducedMotion();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  // Captured when the menu opens so validation and the date inputs' `max` stay
  // pure during render.
  const [openedAt, setOpenedAt] = useState(0);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggleMenu() {
    if (open) {
      setOpen(false);
      return;
    }
    const now = Date.now();
    setOpenedAt(now);
    if (value.range === "custom" && value.from && value.to) {
      setFrom(value.from);
      setTo(value.to);
      setCustomOpen(true);
    } else {
      setFrom(istanbulDayString(now - 6 * DAY_MS));
      setTo(istanbulDayString(now));
      setCustomOpen(false);
    }
    setOpen(true);
  }

  function pickPreset(range: TrOwnerDashboardQuery["range"]) {
    if (range === "custom") {
      setCustomOpen((current) => !current);
      return;
    }
    setOpen(false);
    onChange({ range });
  }

  const customCheck =
    from && to
      ? resolveDashboardWindow({ range: "custom", from, to, nowMs: openedAt })
      : null;
  const customError = customCheck && !customCheck.ok ? customCheck.error : null;
  const canApply = Boolean(customCheck?.ok);

  function applyCustom() {
    if (!canApply) return;
    setOpen(false);
    onChange({ range: "custom", from, to });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleMenu}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-[13px] font-semibold text-neutral-800 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors duration-150 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)] lg:min-h-9"
      >
        <CalendarDays
          className="h-4 w-4 text-neutral-500"
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="whitespace-nowrap">{triggerLabel(value)}</span>
        <ChevronDown
          className={`h-4 w-4 text-neutral-500 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          strokeWidth={1.75}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id={menuId}
            role="group"
            aria-label="Tarih aralığı"
            className="absolute top-full right-0 z-30 mt-2 w-[min(17rem,calc(100vw-2rem))] origin-top-right rounded-xl border border-neutral-200/80 bg-white p-1.5 shadow-[0_12px_32px_rgba(16,24,40,0.14)]"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.14, ease: trPanelEase }}
          >
            <ul>
              {TR_DASHBOARD_RANGE_OPTIONS.map((option) => {
                const selected = value.range === option.id;
                const isCustom = option.id === "custom";
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      onClick={() => pickPreset(option.id)}
                      aria-pressed={selected}
                      aria-expanded={isCustom ? customOpen : undefined}
                      className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-left text-[13.5px] font-medium transition-colors duration-150 lg:min-h-9 ${
                        selected
                          ? "bg-[color:var(--panel-accent-soft)] text-[color:var(--panel-accent-deep)]"
                          : "text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      {option.label}
                      {selected ? (
                        <Check className="h-4 w-4" strokeWidth={2} aria-hidden />
                      ) : isCustom ? (
                        <ChevronDown
                          className={`h-4 w-4 text-neutral-400 transition-transform duration-150 ${customOpen ? "rotate-180" : ""}`}
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>

            {customOpen ? (
              <div className="mt-1 space-y-3 border-t border-neutral-100 px-2 pt-3 pb-2">
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1">
                    <span className={panelLabelClass}>Başlangıç</span>
                    <input
                      type="date"
                      value={from}
                      max={istanbulDayString(openedAt)}
                      onChange={(event) => setFrom(event.target.value)}
                      className={panelFieldClass}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className={panelLabelClass}>Bitiş</span>
                    <input
                      type="date"
                      value={to}
                      max={istanbulDayString(openedAt)}
                      onChange={(event) => setTo(event.target.value)}
                      className={panelFieldClass}
                    />
                  </label>
                </div>
                {customError ? (
                  <p className="text-[12.5px] text-red-700" role="alert">
                    {customError}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={applyCustom}
                  disabled={!canApply}
                  className={`${panelPrimaryBtnClass} w-full`}
                >
                  Uygula
                </button>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
