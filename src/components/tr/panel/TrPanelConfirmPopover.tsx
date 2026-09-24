"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import {
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { UNSAVED_CHANGES_MESSAGE } from "@/lib/tr/panel/saveModel";

/**
 * A small yes/no confirmation that opens just above the button it belongs to —
 * "Yaptığınız değişiklikler kaydedilmemiştir…" over a drawer's Vazgeç, or "Silinsin
 * mi?" over a delete button. Controlled: the caller decides when it opens (a click,
 * or Esc on a dirty drawer). A click outside counts as "Hayır".
 *
 * Wrap the trigger: `<TrPanelConfirmPopover open …><button>Vazgeç</button></…>`.
 */
export function TrPanelConfirmPopover({
  open,
  onCancel,
  onConfirm,
  message = UNSAVED_CHANGES_MESSAGE,
  confirmLabel = "Evet",
  cancelLabel = "Hayır",
  align = "start",
  side = "top",
  children,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Which edge of the trigger the popover lines up with. */
  align?: "start" | "end";
  /** Open above the trigger (default) or below it, for triggers near the top of the screen. */
  side?: "top" | "bottom";
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && rootRef.current?.contains(target)) return;
      onCancel();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, onCancel]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      {children}
      {open ? (
        <div
          role="alertdialog"
          aria-label={message}
          className={`tr-panel-enter absolute z-10 w-[18.5rem] rounded-lg border border-neutral-200 bg-white text-neutral-800 shadow-xl ${
            side === "bottom" ? "top-full mt-3" : "bottom-full mb-3"
          } ${align === "end" ? "right-0" : "left-0"}`}
        >
          <div className="flex items-start gap-3 px-4 py-4">
            <AlertCircle
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-500"
              strokeWidth={1.75}
              aria-hidden
            />
            <p className="text-[14px] leading-snug font-medium">{message}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-neutral-200 p-3">
            <button
              ref={cancelRef}
              type="button"
              className={panelSecondaryBtnClass}
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={panelPrimaryBtnClass}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
          <span
            aria-hidden
            className={`absolute h-3 w-3 rotate-45 border-neutral-200 bg-white ${
              side === "bottom"
                ? "-top-1.5 border-t border-l"
                : "-bottom-1.5 border-r border-b"
            } ${align === "end" ? "right-6" : "left-6"}`}
          />
        </div>
      ) : null}
    </div>
  );
}
