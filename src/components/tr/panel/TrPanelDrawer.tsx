"use client";

import { AnimatePresence, motion, useIsPresent } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useUnsavedChangesGuard } from "@/components/tr/panel/TrOwnerLeaveGuard";
import { TrPanelConfirmPopover } from "@/components/tr/panel/TrPanelConfirmPopover";
import {
  trPanelEase,
  trPanelFadeTransition,
  TrPanelBusySpinner,
} from "@/components/tr/panel/TrPanelMotion";
import {
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { useSaveShortcut } from "@/components/tr/panel/useSaveShortcut";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface TrPanelDrawerProps {
  open: boolean;
  /** Called when the drawer should close (after the unsaved-changes prompt, if any). */
  onClose: () => void;
  title: string;
  /**
   * The form inside differs from what was last saved. Vazgeç, Esc and a click
   * outside then ask "Çıkmak istediğinize emin misiniz?" before closing.
   */
  dirty?: boolean;
  saving?: boolean;
  /** Kaydet, the footer button and Ctrl/Cmd+S. The caller closes the drawer when it succeeds. */
  onSave: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  saveDisabled?: boolean;
  children: ReactNode;
}

/**
 * The right-hand slide-over the panel uses to create or edit a small thing in
 * place (a variant type, a brand, a category…) without leaving the page. It is a
 * form, so it follows the panel's save model: manual Kaydet, and an exit
 * confirmation when there are unsaved edits.
 */
export function TrPanelDrawer(props: TrPanelDrawerProps) {
  // Every open is a new session (a new key), so nothing from the last one — the
  // confirmation popover, focus — carries over, even if it is reopened while the
  // closing animation is still running.
  const [session, setSession] = useState(0);
  const [wasOpen, setWasOpen] = useState(props.open);
  if (props.open !== wasOpen) {
    setWasOpen(props.open);
    if (props.open) setSession((current) => current + 1);
  }

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {props.open ? <DrawerPanel key={session} {...props} /> : null}
    </AnimatePresence>,
    document.body,
  );
}

/** One open session of the drawer; unmounts (and forgets everything) when it closes. */
function DrawerPanel({
  onClose,
  title,
  dirty = false,
  saving = false,
  onSave,
  saveLabel = "Kaydet",
  cancelLabel = "Vazgeç",
  saveDisabled = false,
  children,
}: TrPanelDrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // While the closing animation runs this session is already over: it must not
  // react to keys or hold the page's unsaved-changes guard.
  const isPresent = useIsPresent();
  const canSave = !saving && !saveDisabled;

  const requestClose = () => {
    if (dirty) setConfirmOpen(true);
    else onClose();
  };

  // A reload or closed tab with edits in the drawer gets the browser's prompt.
  useUnsavedChangesGuard(`drawer-${titleId}`, dirty && isPresent);
  useSaveShortcut(onSave, canSave && isPresent);

  // Focus in on open and back on close; the page behind does not scroll.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const firstField = panel?.querySelector<HTMLElement>(
      "input, select, textarea",
    );
    (firstField ?? panel)?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  // Esc (closes the prompt first, then the drawer) and a Tab that stays inside.
  useEffect(() => {
    if (!isPresent) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (confirmOpen) setConfirmOpen(false);
        else requestClose();
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
    // requestClose only reads dirty / onClose, which are in the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPresent, confirmOpen, dirty, onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[55]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/45"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={trPanelFadeTransition}
        onClick={requestClose}
        aria-hidden
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl outline-none sm:w-[26rem]"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.22, ease: trPanelEase }}
      >
        <header className="flex items-center justify-between gap-3 border-b border-neutral-200 px-6 py-4">
          <h2
            id={titleId}
            className="min-w-0 truncate text-[15px] font-semibold text-neutral-900"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Kapat"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-neutral-500 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)] motion-reduce:transition-none"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</div>

        <footer className="flex gap-3 border-t border-neutral-200 px-6 py-4">
          <TrPanelConfirmPopover
            open={confirmOpen}
            onCancel={() => setConfirmOpen(false)}
            onConfirm={onClose}
          >
            <button
              type="button"
              className={panelSecondaryBtnClass}
              onClick={requestClose}
            >
              {cancelLabel}
            </button>
          </TrPanelConfirmPopover>
          <button
            type="button"
            className={`${panelPrimaryBtnClass} flex-1 gap-2`}
            disabled={!canSave}
            onClick={onSave}
          >
            {saving ? (
              <>
                <TrPanelBusySpinner />
                Kaydediliyor…
              </>
            ) : (
              saveLabel
            )}
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
}
