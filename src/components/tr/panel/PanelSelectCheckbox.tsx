"use client";

import { useRef } from "react";

export interface PanelSelectModifiers {
  shiftKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
  /** Desired checked state from the checkbox (non-shift clicks). */
  nextChecked?: boolean;
}

/** Controlled checkbox with Shift / Ctrl range selection. */
export function PanelSelectCheckbox({
  id,
  checked,
  disabled,
  label,
  onItemClick,
}: {
  id: string;
  checked: boolean;
  disabled?: boolean;
  label: string;
  onItemClick: (id: string, modifiers: PanelSelectModifiers) => void;
}) {
  const modsRef = useRef({ shiftKey: false, metaKey: false, ctrlKey: false });

  return (
    <input
      type="checkbox"
      className="h-4 w-4 accent-[color:var(--panel-accent)]"
      checked={checked}
      disabled={disabled}
      aria-label={label}
      onClick={(event) => {
        // Capture modifiers here — onChange does not reliably expose them.
        modsRef.current = {
          shiftKey: event.shiftKey,
          metaKey: event.metaKey,
          ctrlKey: event.ctrlKey,
        };
      }}
      onChange={(event) => {
        if (disabled) return;
        onItemClick(id, {
          ...modsRef.current,
          nextChecked: event.target.checked,
        });
      }}
    />
  );
}
