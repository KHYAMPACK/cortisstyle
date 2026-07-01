/** Cortisstyle editorial blueprint tokens — matches homepage / wardrobe */

/** Infinite canvas zone — kept dark per product direction */
export const STUDIO_CANVAS_BG = 'bg-[#0D0D0D]'

/** Shell chrome (header + sidebars) */
export const STUDIO_CHROME_BG = 'bg-ice-floor'
export const STUDIO_SURFACE = 'surface-canvas-paper bg-canvas-paper'
export const STUDIO_SURFACE_BLUEPRINT = 'bg-blueprint-surface border border-blueprint-border'
export const STUDIO_RULE = 'border-blueprint-border'

/** Typography */
export const STUDIO_LABEL =
  'text-meta font-mono text-[9px] uppercase tracking-[0.35em] text-meta'

export const STUDIO_KICKER =
  'text-meta font-mono text-[9px] uppercase tracking-[0.42em] text-meta'

export const STUDIO_SECTION_TITLE =
  'font-serif text-lg tracking-[-0.01em] text-jet-black uppercase md:text-xl'

export const STUDIO_SECTION_TITLE_SM =
  'font-serif text-[11px] tracking-[0.1em] text-neutral-900 uppercase'

/** Form fields */
export const STUDIO_INPUT =
  'w-full border-0 border-b border-blueprint-border bg-transparent px-0 py-1.5 font-sans text-[12px] normal-case tracking-normal text-jet-black outline-none placeholder:text-neutral-400 focus:border-blueprint-accent focus:ring-0 transition-colors duration-200'

export const STUDIO_SELECT = `${STUDIO_INPUT} cursor-pointer`

/** Buttons */
export const STUDIO_BTN_PRIMARY =
  'btn-primary w-full px-4 py-2.5 font-mono text-[10px] font-medium tracking-[0.12em]'

export const STUDIO_BTN_SECONDARY =
  'border border-blueprint-border bg-canvas-paper px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-jet-black transition-colors duration-200 hover:border-jet-black'

export const STUDIO_BTN_GHOST =
  'text-meta font-mono text-[10px] uppercase tracking-[0.28em] transition-colors hover:text-jet-black'

export const STUDIO_BTN_DANGER =
  'w-full border-t border-blueprint-border py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-meta transition-colors hover:bg-red-50 hover:text-red-700'

/** Cards */
export const STUDIO_CARD = 'border border-blueprint-border shadow-[var(--shadow-canvas-paper)]'

/** Floating controls on the dark canvas */
export const STUDIO_CANVAS_CONTROL =
  'surface-canvas-paper border border-blueprint-border px-3 py-2 shadow-[var(--shadow-canvas-paper)]'

export const STUDIO_CANVAS_CONTROL_LABEL =
  'font-mono text-[9px] uppercase tracking-[0.28em] transition-colors'
