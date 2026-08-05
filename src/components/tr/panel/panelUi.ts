/**
 * Shared owner-panel chrome sized for older users:
 * large type, tall tap targets, clear section cards.
 */

export const panelFieldClass =
  "w-full rounded-xl border-2 border-[color:var(--panel-accent-border)] bg-white px-4 py-4 text-[18px] text-neutral-900 outline-none focus:border-[color:var(--panel-accent)]";

export const panelLabelClass =
  "block text-[17px] font-semibold text-neutral-800";

export const panelHintClass = "text-[15px] leading-relaxed text-neutral-600";

export const panelSectionClass =
  "space-y-4 rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-5 shadow-sm sm:p-6";

export const panelPrimaryBtnClass =
  "inline-flex min-h-14 items-center justify-center rounded-xl px-6 py-4 text-[18px] font-semibold text-white disabled:opacity-50";

export const panelSecondaryBtnClass =
  "inline-flex min-h-14 items-center justify-center rounded-xl border-2 border-[color:var(--panel-accent-border)] bg-white px-6 py-4 text-[18px] font-semibold text-neutral-800 disabled:opacity-50";

export const panelChipClass = (active: boolean) =>
  [
    "min-h-12 rounded-xl px-4 py-3 text-[16px] font-semibold transition-colors",
    active
      ? "text-white"
      : "bg-white text-neutral-800 ring-1 ring-[color:var(--panel-accent-border)]",
  ].join(" ");

export const panelAddChipClass =
  "min-h-12 rounded-xl border-2 border-dashed border-[color:var(--panel-accent-border)] bg-white px-4 py-3 text-[16px] font-semibold text-neutral-700";

export const panelBackLinkClass =
  "inline-block text-[16px] font-medium text-[color:var(--panel-accent-deep)]";

export const panelPageTitleClass =
  "mt-2 text-[1.75rem] font-semibold tracking-tight text-[color:var(--panel-accent-deep)] sm:text-[2rem]";

export const panelErrorClass =
  "rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-4 text-[16px] text-red-800";

export const panelEmptyClass =
  "rounded-2xl border border-[color:var(--panel-accent-border)] bg-white px-5 py-10 text-center text-[17px] text-neutral-600";
