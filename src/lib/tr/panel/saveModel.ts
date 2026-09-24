/**
 * The panel's save model, in one place (see docs/agent-handoffs/05-owner-panel-commerce.md,
 * "Saving"): forms save manually and ask before exit; actions apply at once.
 */

/** The one sentence every "you have unsaved edits" prompt in the panel uses. */
export const UNSAVED_CHANGES_MESSAGE =
  "Yaptığınız değişiklikler kaydedilmemiştir. Çıkmak istediğinize emin misiniz?";

/** Ctrl+S / Cmd+S, without other modifiers. */
export function isSaveShortcut(event: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}): boolean {
  return (
    (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    !event.shiftKey &&
    event.key.toLowerCase() === "s"
  );
}
