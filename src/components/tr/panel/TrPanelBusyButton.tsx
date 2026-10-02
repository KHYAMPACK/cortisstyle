"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { TrPanelBusySpinner } from "@/components/tr/panel/TrPanelMotion";

/**
 * A panel button for an action the owner waits on: while `busy` it shows a spinner and
 * `busyLabel`, can't be pressed again, and tells assistive tech it is busy. Style it
 * with the usual panel button classes.
 */
export function TrPanelBusyButton({
  busy,
  busyLabel,
  children,
  disabled,
  className = "",
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  busy: boolean;
  /** What it says while working ("Kaydediliyor…"); default: its own label. */
  busyLabel?: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={`inline-flex items-center justify-center gap-2 ${className}`}
    >
      {busy ? <TrPanelBusySpinner className="h-3.5 w-3.5 rounded-full" /> : null}
      <span>{busy ? (busyLabel ?? children) : children}</span>
    </button>
  );
}
