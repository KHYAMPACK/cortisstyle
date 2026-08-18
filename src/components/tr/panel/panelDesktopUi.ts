/**
 * Dense desktop-only (lg+) panel table chrome.
 * Mobile keeps panelUi.ts large targets.
 */

export const panelDesktopSearchClass =
  "h-9 w-full max-w-sm rounded-lg border border-neutral-200 bg-white px-3 text-[13px] text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-[color:var(--panel-accent)]";

export const panelDesktopSelectClass =
  "h-8 rounded-md border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 outline-none focus:border-[color:var(--panel-accent)]";

export const panelDesktopInputClass =
  "h-8 w-24 rounded-md border border-neutral-200 bg-white px-2 text-[13px] tabular-nums text-neutral-900 outline-none focus:border-[color:var(--panel-accent)]";

export const panelDesktopBtnClass =
  "inline-flex h-8 items-center justify-center rounded-md bg-[color:var(--panel-accent)] px-3 text-[13px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-[color:var(--panel-accent-hover)] active:scale-[0.98] active:bg-[color:var(--panel-accent-active)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100";

export const panelDesktopSecondaryBtnClass =
  "inline-flex h-8 items-center justify-center rounded-md border border-neutral-200 bg-white px-3 text-[13px] font-semibold text-neutral-800 transition-[background-color,transform] duration-150 hover:bg-neutral-50 active:scale-[0.98] active:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100";

export const panelDesktopDangerBtnClass =
  "inline-flex h-8 items-center justify-center rounded-md bg-red-700 px-3 text-[13px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-red-800 active:scale-[0.98] active:bg-red-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-800 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100";

export const panelDesktopTableWrapClass =
  "overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]";

export const panelDesktopThClass =
  "sticky top-0 z-[1] whitespace-nowrap border-b border-neutral-200 bg-neutral-50 px-3 py-2.5 text-left text-[12px] font-semibold tracking-wide text-neutral-500";

export const panelDesktopTdClass =
  "border-b border-neutral-100 px-3 py-2.5 text-[13px] text-neutral-800";

export const panelDesktopRowClass =
  "transition-colors hover:bg-[color:var(--panel-accent-soft)]/60";
