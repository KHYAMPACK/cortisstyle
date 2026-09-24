"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface TriggerProps {
  "aria-haspopup": "dialog";
  "aria-expanded": boolean;
  "aria-controls": string | undefined;
  onClick: () => void;
}

/**
 * A small panel that opens under its trigger — filters, "more actions" menus.
 * Closes on Escape, on a click outside, and when `children` calls `close`.
 */
export function TrPanelPopover({
  trigger,
  children,
  label,
  align = "start",
  panelClassName = "",
}: {
  trigger: (props: TriggerProps & { open: boolean }) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  /** Accessible name of the panel. */
  label: string;
  align?: "start" | "end";
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && rootRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {trigger({
        open,
        "aria-haspopup": "dialog",
        "aria-expanded": open,
        "aria-controls": open ? panelId : undefined,
        onClick: () => setOpen((current) => !current),
      })}
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={label}
          className={`tr-panel-enter absolute top-full z-30 mt-1.5 min-w-[200px] rounded-lg border border-neutral-200 bg-white p-2 shadow-lg ${
            align === "end" ? "right-0" : "left-0"
          } ${panelClassName}`}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      ) : null}
    </div>
  );
}
