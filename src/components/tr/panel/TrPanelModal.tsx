"use client";

import { AnimatePresence, motion, useIsPresent } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { trPanelFadeTransition } from "@/components/tr/panel/TrPanelMotion";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface TrPanelModalProps {
  open: boolean;
  /** Esc, the ×, and a click on the dimmed page all call this. */
  onClose: () => void;
  title: string;
  /** Buttons along the bottom edge (right-aligned). */
  footer?: ReactNode;
  /** Text shown at the bottom-left of the footer (a count, a hint). */
  footerNote?: ReactNode;
  size?: "sm" | "lg";
  children: ReactNode;
}

/**
 * A centered dialog for a focused choice — picking products, entering an amount. Unlike
 * `TrPanelDrawer` (a form saved with the page's save model) it does not guard unsaved
 * edits: what it holds is a small step of the page behind it, applied on its own Kaydet.
 * Esc and a click outside close it; focus is kept inside and returned afterwards.
 */
export function TrPanelModal(props: TrPanelModalProps) {
  // Every open is a new session, so nothing from the last one (typed text, focus) carries over.
  const [session, setSession] = useState(0);
  const [wasOpen, setWasOpen] = useState(props.open);
  if (props.open !== wasOpen) {
    setWasOpen(props.open);
    if (props.open) setSession((current) => current + 1);
  }

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {props.open ? <ModalPanel key={session} {...props} /> : null}
    </AnimatePresence>,
    document.body,
  );
}

function ModalPanel({
  onClose,
  title,
  footer,
  footerNote,
  size = "sm",
  children,
}: TrPanelModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const isPresent = useIsPresent();

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const firstField = panel?.querySelector<HTMLElement>("input, select, textarea");
    (firstField ?? panel)?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    if (!isPresent) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      ).filter((node) => node.offsetParent !== null);
      if (nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isPresent, onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[55] flex items-start justify-center overflow-y-auto p-4 sm:items-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
    >
      <motion.div
        className="fixed inset-0 bg-black/45"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={trPanelFadeTransition}
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-xl bg-white shadow-2xl outline-none ${
          size === "lg" ? "max-w-3xl" : "max-w-md"
        }`}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={trPanelFadeTransition}
      >
        <header className="flex items-center justify-between gap-3 border-b border-neutral-200 px-6 py-4">
          <h2 id={titleId} className="min-w-0 truncate text-[16px] font-semibold text-neutral-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-neutral-500 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)] motion-reduce:transition-none"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer || footerNote ? (
          <footer className="flex items-center justify-between gap-3 border-t border-neutral-200 px-6 py-4">
            <div className="text-[13px] text-neutral-500">{footerNote}</div>
            <div className="flex items-center gap-3">{footer}</div>
          </footer>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
