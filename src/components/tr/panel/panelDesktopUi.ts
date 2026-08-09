/**
 * Dense desktop-only (lg+) panel table chrome.
 * Mobile keeps panelUi.ts large targets.
 */

export const panelDesktopSearchClass =
  "h-9 w-full max-w-sm rounded-lg border border-[color:var(--panel-accent-border)] bg-white px-3 text-[13px] text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-[color:var(--panel-accent)]";

export const panelDesktopSelectClass =
  "h-8 rounded-md border border-[color:var(--panel-accent-border)] bg-white px-2 text-[13px] text-neutral-900 outline-none focus:border-[color:var(--panel-accent)]";

export const panelDesktopInputClass =
  "h-8 w-24 rounded-md border border-[color:var(--panel-accent-border)] bg-white px-2 text-[13px] tabular-nums text-neutral-900 outline-none focus:border-[color:var(--panel-accent)]";

export const panelDesktopBtnClass =
  "inline-flex h-8 items-center justify-center rounded-md px-3 text-[13px] font-semibold text-white disabled:opacity-50";

export const panelDesktopSecondaryBtnClass =
  "inline-flex h-8 items-center justify-center rounded-md border border-[color:var(--panel-accent-border)] bg-white px-3 text-[13px] font-semibold text-neutral-800 disabled:opacity-50";

export const panelDesktopTableWrapClass =
  "overflow-hidden rounded-xl border border-[color:var(--panel-accent-border)] bg-white shadow-sm";

export const panelDesktopThClass =
  "sticky top-0 z-[1] whitespace-nowrap border-b border-[color:var(--panel-accent-border)] bg-[color:var(--panel-accent-softer)] px-3 py-2.5 text-left text-[12px] font-semibold tracking-wide text-neutral-600";

export const panelDesktopTdClass =
  "border-b border-neutral-100 px-3 py-2.5 text-[13px] text-neutral-800";

export const panelDesktopRowClass =
  "transition-colors hover:bg-[color:var(--panel-accent-soft)]/60";
