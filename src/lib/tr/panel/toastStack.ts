/**
 * Where each toast sits in the stack. Pure geometry, so the collapsed / expanded
 * behavior is testable; `TrPanelToaster` animates to whatever this returns.
 *
 * Toasts are given oldest first. All are anchored to the bottom of the stack (the newest
 * is at the bottom, `y` is how far up from there):
 *
 * - **Expanded** (hovered, or a single toast): every toast at its own height with a gap.
 * - **Collapsed** (several toasts, not hovered): the newest is fully shown; each older one
 *   sits behind it, `TOAST_PEEK` px higher and a little smaller, its content hidden, so
 *   only a sliver shows above the front toast — a pile.
 */

export const TOAST_GAP = 8;
export const TOAST_PEEK = 10;
export const TOAST_SCALE_STEP = 0.05;

export interface ToastSlot {
  /** Up from the bottom edge of the stack (≤ 0). */
  y: number;
  scale: number;
  height: number;
  /** Whether the message is readable; hidden on the toasts behind the front one. */
  contentVisible: boolean;
  zIndex: number;
}

export interface ToastStackLayout {
  slots: ToastSlot[];
  /** How tall the stack is as a whole (its hover area). */
  height: number;
  collapsed: boolean;
}

export function toastStackLayout(
  heights: readonly number[],
  expanded: boolean,
): ToastStackLayout {
  const count = heights.length;
  if (count === 0) return { slots: [], height: 0, collapsed: false };

  const collapsed = !expanded && count > 1;
  const front = heights[count - 1]!;

  if (collapsed) {
    return {
      collapsed,
      height: front + TOAST_PEEK * (count - 1),
      slots: heights.map((_, index) => {
        const behind = count - 1 - index;
        return {
          y: 0 - TOAST_PEEK * behind, // `0 -` keeps the front at 0, not -0
          scale: 1 - TOAST_SCALE_STEP * behind,
          // A taller toast behind must not stick out below or above the front one.
          height: front,
          contentVisible: behind === 0,
          zIndex: count - behind,
        };
      }),
    };
  }

  let offset = 0;
  const slots: ToastSlot[] = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    slots[index] = {
      y: 0 - offset,
      scale: 1,
      height: heights[index]!,
      contentVisible: true,
      zIndex: index + 1,
    };
    offset += heights[index]! + TOAST_GAP;
  }
  return { slots, collapsed, height: offset - TOAST_GAP };
}
