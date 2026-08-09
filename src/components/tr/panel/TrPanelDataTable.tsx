"use client";

import type { ReactNode } from "react";
import {
  panelDesktopTableWrapClass,
  panelDesktopTdClass,
  panelDesktopThClass,
} from "@/components/tr/panel/panelDesktopUi";

interface TrPanelDataTableProps {
  headers: ReactNode[];
  /** When set, renders a leading checkbox column for select-all. */
  selectAll?: {
    checked: boolean;
    indeterminate?: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
  };
  /** Classic Ctrl/Cmd+A / Escape when table is focused. */
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  children: ReactNode;
  empty?: ReactNode;
  footer?: ReactNode;
}

export function TrPanelDataTable({
  headers,
  selectAll,
  onKeyDown,
  children,
  empty,
  footer,
}: TrPanelDataTableProps) {
  return (
    <div
      className={panelDesktopTableWrapClass}
      tabIndex={onKeyDown ? 0 : undefined}
      onKeyDown={onKeyDown}
      role={onKeyDown ? "region" : undefined}
      aria-label={onKeyDown ? "Seçilebilir tablo" : undefined}
    >
      <div className="max-h-[min(70vh,720px)] overflow-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr>
              {selectAll ? (
                <th className={`${panelDesktopThClass} w-10`}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[color:var(--panel-accent)]"
                    checked={selectAll.checked}
                    ref={(el) => {
                      if (el) el.indeterminate = Boolean(selectAll.indeterminate);
                    }}
                    onChange={(event) => selectAll.onChange(event.target.checked)}
                    disabled={selectAll.disabled}
                    aria-label="Tümünü seç"
                    title="Tümünü seç (Ctrl+A)"
                  />
                </th>
              ) : null}
              {headers.map((header, index) => (
                <th key={index} className={panelDesktopThClass}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {empty ? (
              <tr>
                <td
                  colSpan={headers.length + (selectAll ? 1 : 0)}
                  className={`${panelDesktopTdClass} py-10 text-center text-neutral-500`}
                >
                  {empty}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
      {footer ? (
        <div className="border-t border-[color:var(--panel-accent-border)] px-3 py-2 text-[12px] text-neutral-600">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function TrPanelDataTableRow({
  children,
  selected,
  className = "",
}: {
  children: ReactNode;
  selected?: boolean;
  className?: string;
}) {
  return (
    <tr
      className={`border-b border-neutral-100 transition-colors hover:bg-[color:var(--panel-accent-soft)]/60 ${
        selected ? "bg-[color:var(--panel-accent-soft)]/40" : ""
      } ${className}`}
    >
      {children}
    </tr>
  );
}

export function TrPanelDataTableCell({
  children,
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <td className={`${panelDesktopTdClass} ${className}`}>{children}</td>;
}
