/**
 * Owner-panel chrome — Ikas ops density, boutique accent.
 * Mobile keeps 44px taps; desktop is compact.
 */

/** One easing for the whole panel: sidebar, page enter, pills. Matches `trPanelEase` in TrPanelMotion. */
export const panelEaseCss = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Desktop sidebar widths in px — also published as `--panel-sidebar-w` by the shell. */
export const PANEL_SIDEBAR_WIDTH = 232;
export const PANEL_SIDEBAR_COLLAPSED_WIDTH = 64;

const panelBtnMotion =
  "transition-[background-color,border-color,color,transform,box-shadow] duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100";

const panelFocusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)]";

export const panelFieldClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-3 text-[16px] text-neutral-900 outline-none transition-colors focus:border-[color:var(--panel-accent)] lg:py-2.5 lg:text-[13px]";

export const panelLabelClass =
  "block text-[13px] font-medium text-neutral-600";

export const panelHintClass = "text-[13px] leading-relaxed text-neutral-500";

/** White card surface; lay out the inside yourself. */
export const panelCardClass =
  "rounded-xl border border-neutral-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-5";

export const panelSectionClass = `space-y-4 ${panelCardClass}`;

export const panelPrimaryBtnClass =
  `inline-flex min-h-11 items-center justify-center rounded-lg bg-[color:var(--panel-accent)] px-4 py-2.5 text-[15px] font-semibold text-white hover:bg-[color:var(--panel-accent-hover)] active:bg-[color:var(--panel-accent-active)] disabled:pointer-events-none disabled:opacity-50 lg:min-h-9 lg:text-[13px] ${panelBtnMotion} ${panelFocusRing}`;

export const panelSecondaryBtnClass =
  `inline-flex min-h-11 items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-[15px] font-semibold text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100 disabled:pointer-events-none disabled:opacity-50 lg:min-h-9 lg:text-[13px] ${panelBtnMotion} ${panelFocusRing}`;

export const panelDangerBtnClass =
  `inline-flex min-h-11 items-center justify-center rounded-lg bg-red-700 px-4 py-2.5 text-[15px] font-semibold text-white hover:bg-red-800 active:bg-red-900 disabled:pointer-events-none disabled:opacity-50 lg:min-h-9 lg:text-[13px] ${panelBtnMotion} ${panelFocusRing}`;

/** Ikas period pills: soft accent fill, not solid primary. */
export const panelChipClass = (active: boolean) =>
  [
    `min-h-10 rounded-lg px-3.5 py-2 text-[13px] font-semibold lg:min-h-8 ${panelBtnMotion} ${panelFocusRing}`,
    active
      ? "bg-[color:var(--panel-accent-soft)] text-[color:var(--panel-accent-deep)]"
      : "bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-50",
  ].join(" ");

export const panelAddChipClass =
  `min-h-10 rounded-lg border border-dashed border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-semibold text-neutral-600 hover:bg-neutral-50 lg:min-h-8 ${panelBtnMotion} ${panelFocusRing}`;

export const panelStepperBtnClass =
  `flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-200 bg-white text-[20px] font-semibold text-neutral-900 hover:bg-neutral-50 active:bg-neutral-100 disabled:pointer-events-none disabled:opacity-40 lg:h-8 lg:w-8 lg:text-[16px] ${panelBtnMotion} ${panelFocusRing}`;

export const panelBackLinkClass =
  "inline-block text-[13px] font-medium text-neutral-500 hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)]";

export const panelPageTitleClass =
  "mt-1 text-[1.25rem] font-semibold tracking-tight text-neutral-900 sm:text-[1.375rem]";

export const panelErrorClass =
  "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-800";

export const panelSuccessClass =
  "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] text-emerald-900";

export const panelEmptyClass =
  "rounded-xl border border-neutral-200/80 bg-white px-5 py-10 text-center text-[14px] text-neutral-500";

/** Search + chips stay visible while the list scrolls.
 *  Sits under the mobile panel header (`min-h-14`); desktop has no top chrome. */
export const panelStickyFilterClass =
  "sticky top-14 z-10 -mx-4 space-y-3 border-b border-neutral-200/80 bg-[color:var(--panel-canvas)] px-4 py-3 sm:-mx-5 sm:px-5 lg:top-0 lg:-mx-6 lg:px-6";

/** Always-visible wizard actions, above the mobile tab bar. */
export const panelStickyActionsClass =
  "fixed inset-x-0 z-20 flex flex-wrap gap-3 border-t border-[color:var(--panel-accent-border)] bg-[#F2F3F5]/95 px-4 py-3 shadow-[0_-6px_16px_rgba(16,24,40,0.08)] backdrop-blur-sm sm:px-5 lg:bottom-0 lg:left-[var(--panel-sidebar-w,232px)] lg:px-6 lg:transition-[left] lg:duration-200 motion-reduce:lg:transition-none bottom-[calc(3.5rem+env(safe-area-inset-bottom))]";

/** Clears the fixed action bar so the last field can scroll into view. */
export const panelStickyActionsSpacerClass = "h-24 shrink-0 lg:h-20";

/**
 * Dark sidebar row — the single style for nav items and footer actions, so hover,
 * focus and spacing can never drift apart. The 15px left padding puts the icon at
 * the centre of the 64px collapsed rail, so it never moves when the rail expands.
 */
export const panelSidebarRowClass =
  `group relative flex min-h-11 w-full items-center gap-3 rounded-lg pl-[15px] pr-3 text-left text-[13.5px] font-medium whitespace-nowrap ${panelBtnMotion} focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white/70`;

export const panelSidebarRowIdleClass =
  "text-white/65 hover:bg-white/5 hover:text-white";

