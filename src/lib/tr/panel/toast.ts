/**
 * The panel's toasts: short messages that report what just happened (saved, deleted,
 * couldn't save…) at the bottom center of the screen. One store for the whole panel;
 * `TrPanelToaster` (mounted once in the panel shell) renders it.
 *
 *   toast.success("Ürün kaydedildi.");
 *   toast.error(error, "Ürün kaydedilemedi.");   // an Error's message, else the fallback
 *   toast.warning("Ürün eklendi, ancak kategoriler kaydedilemedi.");
 *
 * A toast reports the result of an action. What stays inline instead: a page that failed
 * to load, a state of the page (empty, "adres eksik"), a live hint next to a field, and
 * anything the user must read to continue. Questions ("Silinsin mi?") are not toasts —
 * they are the confirm popover and the unsaved-changes dialog.
 *
 * No React in here, so the rules (stacking, de-duplication, timers) are unit-tested and
 * `toast.*` can be called from any handler or library code.
 */

export type ToastKind = "success" | "error" | "warning";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  action?: ToastAction;
}

export interface ToastOptions {
  /** Overrides how long it stays (ms). */
  durationMs?: number;
  /** One optional action next to the message ("Geri al"). */
  action?: ToastAction;
}

/** How long each kind stays: errors longest, so there is time to read them. */
export const TOAST_DURATION_MS: Record<ToastKind, number> = {
  success: 4_000,
  warning: 6_000,
  error: 8_000,
};

/** More than this are never on screen at once: a new one pushes the oldest out. */
export const TOAST_MAX_VISIBLE = 3;

interface Entry {
  item: ToastItem;
  /** Time left when the timer last stopped. */
  remaining: number;
  /** When the running timer started; `null` while paused. */
  startedAt: number | null;
  timer: ReturnType<typeof setTimeout> | null;
}

export function createToastStore() {
  let entries: Entry[] = [];
  let snapshot: readonly ToastItem[] = [];
  let nextId = 1;
  /** The stack is being read (hovered or focused): no toast times out meanwhile. */
  let paused = false;
  const listeners = new Set<() => void>();

  function publish() {
    // Nothing left to hold: the pointer can no longer leave, so don't stay paused.
    if (entries.length === 0) paused = false;
    snapshot = entries.map((entry) => entry.item);
    for (const listener of listeners) listener();
  }

  function stop(entry: Entry) {
    if (entry.timer !== null) clearTimeout(entry.timer);
    entry.timer = null;
  }

  function start(entry: Entry) {
    stop(entry);
    if (paused) {
      entry.startedAt = null;
      return;
    }
    entry.startedAt = Date.now();
    entry.timer = setTimeout(() => dismiss(entry.item.id), entry.remaining);
  }

  function dismiss(id: number) {
    const entry = entries.find((candidate) => candidate.item.id === id);
    if (!entry) return;
    stop(entry);
    entries = entries.filter((candidate) => candidate !== entry);
    publish();
  }

  function show(kind: ToastKind, message: string, options: ToastOptions = {}): number {
    const text = message.trim();
    const duration = options.durationMs ?? TOAST_DURATION_MS[kind];

    // The same message already on screen is not shown twice: it stays and its timer
    // starts over, so pressing Kaydet repeatedly doesn't stack copies.
    const same = entries.find(
      (entry) => entry.item.kind === kind && entry.item.message === text,
    );
    if (same) {
      same.remaining = duration;
      start(same);
      return same.item.id;
    }

    const entry: Entry = {
      item: { id: nextId, kind, message: text, ...(options.action ? { action: options.action } : {}) },
      remaining: duration,
      startedAt: null,
      timer: null,
    };
    nextId += 1;
    entries = [...entries, entry];
    start(entry);
    // Only so many at once: the oldest make room.
    while (entries.length > TOAST_MAX_VISIBLE) {
      const oldest = entries[0]!;
      stop(oldest);
      entries = entries.slice(1);
    }
    publish();
    return entry.item.id;
  }

  /**
   * Stops every clock (the pointer is over the stack, or focus is in it). Each toast keeps
   * the time it had left, and one that arrives meanwhile waits too.
   */
  function pauseAll() {
    if (paused) return;
    paused = true;
    const now = Date.now();
    for (const entry of entries) {
      if (entry.startedAt === null) continue;
      entry.remaining = Math.max(0, entry.remaining - (now - entry.startedAt));
      entry.startedAt = null;
      stop(entry);
    }
  }

  function resumeAll() {
    if (!paused) return;
    paused = false;
    for (const entry of entries) start(entry);
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    /** The same array until something changes (what `useSyncExternalStore` needs). */
    getSnapshot: (): readonly ToastItem[] => snapshot,
    show,
    dismiss,
    pauseAll,
    resumeAll,
    /** Removes everything (tests, sign-out). */
    clear() {
      for (const entry of entries) stop(entry);
      entries = [];
      publish();
    },
  };
}

export const toastStore = createToastStore();

const DEFAULT_ERROR = "Bir sorun oluştu. Lütfen tekrar deneyin.";

/**
 * The sentence to show for a failure: a string as it is, an `Error`'s message when it
 * has one, otherwise the fallback. Server messages here are already written for the
 * owner ("Ürün adı zorunlu."); never pass anything else through.
 */
export function toastMessage(source: unknown, fallback: string = DEFAULT_ERROR): string {
  if (typeof source === "string" && source.trim()) return source;
  if (source instanceof Error && source.message.trim()) return source.message;
  return fallback;
}

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    toastStore.show("success", message, options),
  warning: (message: string, options?: ToastOptions) =>
    toastStore.show("warning", message, options),
  /** `source` is a message or the caught error; `fallback` covers an error with no message. */
  error: (source: unknown, fallback?: string, options?: ToastOptions) =>
    toastStore.show("error", toastMessage(source, fallback), options),
  dismiss: (id: number) => toastStore.dismiss(id),
};
