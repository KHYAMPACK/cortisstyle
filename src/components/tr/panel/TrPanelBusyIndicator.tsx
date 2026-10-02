"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { TrPanelBusySpinner, trPanelEase } from "@/components/tr/panel/TrPanelMotion";
import {
  getPanelTasks,
  getServerPanelTasks,
  panelBusyLabel,
  subscribePanelTasks,
} from "@/lib/tr/panel/panelBusy";

/** Waits this long before showing, so a quick save doesn't flash. */
const SHOW_AFTER_MS = 250;
/** Once shown, stays at least this long, so it can be read. */
const MIN_VISIBLE_MS = 450;

/**
 * The panel's one "please wait" signal: a thin moving bar along the top and a pill
 * naming what is running ("Kaydediliyor…", "Fotoğraf yükleniyor…"), for every save,
 * delete or upload (`panelBusy.ts`). Mounted once in the panel shell; toasts keep the
 * bottom of the screen.
 */
export function TrPanelBusyIndicator() {
  const tasks = useSyncExternalStore(subscribePanelTasks, getPanelTasks, getServerPanelTasks);
  const label = panelBusyLabel(tasks);
  const [shown, setShown] = useState<string | null>(null);
  const shownAt = useRef(0);
  const reducedMotion = useReducedMotion() ?? false;
  const canPortal = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (label) {
      if (label === shown) return;
      const timer = setTimeout(
        () => {
          if (!shown) shownAt.current = Date.now();
          setShown(label);
        },
        shown ? 0 : SHOW_AFTER_MS,
      );
      return () => clearTimeout(timer);
    }
    if (!shown) return;
    const timer = setTimeout(
      () => setShown(null),
      Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt.current)),
    );
    return () => clearTimeout(timer);
  }, [label, shown]);

  if (!canPortal) return null;

  return createPortal(
    <AnimatePresence>
      {shown ? (
        <motion.div
          key="panel-busy"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: trPanelEase }}
          className="pointer-events-none fixed inset-x-0 top-0 z-[90]"
        >
          <div className="h-[3px] w-full overflow-hidden bg-[color:var(--panel-accent-soft)]">
            {reducedMotion ? (
              <div className="h-full w-full bg-[color:var(--panel-accent)]" />
            ) : (
              <motion.div
                className="h-full w-1/3 rounded-full bg-[color:var(--panel-accent)]"
                initial={{ x: "-100%" }}
                animate={{ x: "300%" }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </div>
          <div className="mt-3 flex justify-center px-4">
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-2.5 rounded-full bg-neutral-900/90 px-4 py-2 text-[13px] font-medium text-white shadow-lg backdrop-blur"
            >
              <TrPanelBusySpinner className="h-3.5 w-3.5 rounded-full" />
              <span>{shown}</span>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
