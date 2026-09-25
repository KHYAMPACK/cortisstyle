"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Check, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";
import {
  toastStore,
  type ToastItem,
  type ToastKind,
} from "@/lib/tr/panel/toast";
import { toastStackLayout, type ToastSlot } from "@/lib/tr/panel/toastStack";

const NO_TOASTS: readonly ToastItem[] = [];
/** Until a toast has been measured. */
const GUESSED_HEIGHT = 44;

const ICON_BADGE: Record<ToastKind, string> = {
  success: "bg-emerald-600",
  error: "bg-red-600",
  warning: "bg-amber-500",
};

function ToastIcon({ kind }: { kind: ToastKind }) {
  const props = { className: "size-3", strokeWidth: 3, "aria-hidden": true } as const;
  return (
    <span
      className={`mt-px grid size-5 shrink-0 place-items-center rounded-full text-white ${ICON_BADGE[kind]}`}
    >
      {kind === "success" ? (
        <Check {...props} />
      ) : kind === "error" ? (
        <X {...props} />
      ) : (
        <AlertTriangle {...props} />
      )}
    </span>
  );
}

function ToastCard({
  item,
  slot,
  reducedMotion,
  onMeasure,
}: {
  item: ToastItem;
  slot: ToastSlot;
  reducedMotion: boolean;
  onMeasure: (id: number, height: number) => void;
}) {
  const content = useRef<HTMLDivElement>(null);

  // The card's natural height decides where the others sit; it is reported when the
  // observer starts and whenever the text wraps differently.
  useEffect(() => {
    const element = content.current;
    if (!element) return;
    const observer = new ResizeObserver(() => onMeasure(item.id, element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, [item.id, onMeasure]);

  const transition = reducedMotion ? { duration: 0 } : { duration: 0.22, ease: trPanelEase };
  return (
    <motion.div
      role={item.kind === "error" ? "alert" : "status"}
      initial={{
        opacity: 0,
        y: slot.y + (reducedMotion ? 0 : 14),
        scale: slot.scale,
        height: slot.height,
      }}
      animate={{ opacity: 1, y: slot.y, scale: slot.scale, height: slot.height }}
      exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.96 }}
      transition={transition}
      style={{ zIndex: slot.zIndex, transformOrigin: "bottom center" }}
      className="absolute inset-x-0 bottom-0 overflow-hidden rounded-lg bg-white ring-1 ring-neutral-200 shadow-[0_8px_24px_rgba(16,24,40,0.14),0_2px_6px_rgba(16,24,40,0.08)]"
    >
      <motion.div
        ref={content}
        animate={{ opacity: slot.contentVisible ? 1 : 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.15 }}
        className="flex items-start gap-3 py-2.5 pr-2 pl-3 text-neutral-900"
      >
        <ToastIcon kind={item.kind} />
        <p className="min-w-0 flex-1 text-[14px] leading-snug">{item.message}</p>
        {item.action ? (
          <button
            type="button"
            onClick={() => {
              item.action!.onClick();
              toastStore.dismiss(item.id);
            }}
            className="shrink-0 rounded px-1.5 py-0.5 text-[13px] font-semibold text-[color:var(--panel-accent-deep)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--panel-accent-deep)]"
          >
            {item.action.label}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => toastStore.dismiss(item.id)}
          aria-label="Kapat"
          className="grid size-6 shrink-0 place-items-center rounded text-neutral-400 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:var(--panel-accent-deep)] motion-reduce:transition-none"
        >
          <X className="size-4" strokeWidth={1.75} aria-hidden />
        </button>
      </motion.div>
    </motion.div>
  );
}

/**
 * Renders the panel's toasts (`toast.success(…)`, see `lib/tr/panel/toast.ts`) at the
 * bottom center of the screen, above drawers and dialogs. Mounted once, in the panel
 * shell, which stays mounted across pages — so a toast raised just before a redirect
 * is still there on the next page.
 *
 * Several toasts sit as a pile, the newest in front; hovering (or focusing) the pile
 * spreads them out and holds their timers until the pointer leaves. Errors are
 * announced to screen readers straight away, the rest politely.
 */
export function TrPanelToaster() {
  const toasts = useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getSnapshot,
    () => NO_TOASTS,
  );
  // Portaled to <body> so no ancestor's stacking context can hide it; on the server
  // there is no document, and nothing to show anyway.
  const canPortal = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const reducedMotion = useReducedMotion() ?? false;
  const [heights, setHeights] = useState<Record<number, number>>({});
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  // With no toast left there is nothing to be over: a removed element never reports
  // that the pointer left.
  if (toasts.length === 0 && (hovered || focused)) {
    setHovered(false);
    setFocused(false);
  }
  const expanded = hovered || focused;

  useEffect(() => {
    if (expanded) toastStore.pauseAll();
    else toastStore.resumeAll();
  }, [expanded]);

  const onMeasure = useCallback((id: number, height: number) => {
    setHeights((current) => (current[id] === height ? current : { ...current, [id]: height }));
  }, []);

  if (!canPortal) return null;

  const layout = toastStackLayout(
    toasts.map((item) => heights[item.id] ?? GUESSED_HEIGHT),
    expanded,
  );
  const transition = reducedMotion ? { duration: 0 } : { duration: 0.22, ease: trPanelEase };

  return createPortal(
    <div
      aria-label="Bildirimler"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex justify-center px-4"
    >
      <motion.div
        animate={{ height: layout.height }}
        initial={false}
        transition={transition}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setFocused(false);
          }
        }}
        className={`relative w-[24rem] max-w-full ${toasts.length > 0 ? "pointer-events-auto" : ""}`}
      >
        <AnimatePresence initial={false}>
          {toasts.map((item, index) => (
            <ToastCard
              key={item.id}
              item={item}
              slot={layout.slots[index]!}
              reducedMotion={reducedMotion}
              onMeasure={onMeasure}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>,
    document.body,
  );
}
