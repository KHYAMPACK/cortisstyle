"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle } from "lucide-react";
import { trPanelFadeTransition } from "@/components/tr/panel/TrPanelMotion";
import {
  panelDangerBtnClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import { UNSAVED_CHANGES_MESSAGE } from "@/lib/tr/panel/saveModel";

type LeaveDestination =
  | { kind: "href"; href: string }
  | { kind: "action"; run: () => void };

/**
 * `busy`: work is running (uploads, AI jobs) and leaving stops it.
 * `unsaved`: the page holds edits that leaving would throw away.
 */
export type LeaveKind = "busy" | "unsaved";

interface LeaveGuardContextValue {
  busy: boolean;
  register: (
    id: string,
    busy: boolean,
    blockPanelNav?: boolean,
    kind?: LeaveKind,
  ) => void;
  requestLeave: (destination: LeaveDestination) => void;
}

const LeaveGuardContext = createContext<LeaveGuardContextValue | null>(null);

function sameDocumentUrl(href: string): boolean {
  try {
    const next = new URL(href, window.location.href);
    return (
      next.origin === window.location.origin &&
      next.pathname === window.location.pathname &&
      next.search === window.location.search
    );
  } catch {
    return true;
  }
}

export function TrOwnerLeaveGuardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const titleId = useId();
  const [busyMap, setBusyMap] = useState<
    Map<string, { blockPanelNav: boolean; kind: LeaveKind }>
  >(() => new Map());
  const [pending, setPending] = useState<LeaveDestination | null>(null);
  const navBlocked = [...busyMap.values()].some((entry) => entry.blockPanelNav);
  // Running work outranks unsaved edits when both are registered.
  const dialogKind: LeaveKind = [...busyMap.values()].some(
    (entry) => entry.kind === "busy",
  )
    ? "busy"
    : "unsaved";
  const unloadBusy = busyMap.size > 0;
  const unloadBusyRef = useRef(unloadBusy);
  unloadBusyRef.current = unloadBusy;

  const register = useCallback(
    (
      id: string,
      busy: boolean,
      blockPanelNav = true,
      kind: LeaveKind = "busy",
    ) => {
      setBusyMap((current) => {
        const existing = current.get(id);
        if (!busy) {
          if (!existing) return current;
          const copy = new Map(current);
          copy.delete(id);
          return copy;
        }
        if (
          existing &&
          existing.blockPanelNav === blockPanelNav &&
          existing.kind === kind
        ) {
          return current;
        }
        const copy = new Map(current);
        copy.set(id, { blockPanelNav, kind });
        return copy;
      });
    },
    [],
  );

  const requestLeave = useCallback((destination: LeaveDestination) => {
    if (!unloadBusyRef.current) {
      if (destination.kind === "href") router.push(destination.href);
      else destination.run();
      return;
    }
    setPending(destination);
  }, [router]);

  const stay = useCallback(() => setPending(null), []);

  const leave = useCallback(() => {
    const destination = pending;
    setPending(null);
    if (!destination) return;
    if (destination.kind === "href") {
      router.push(destination.href);
      return;
    }
    destination.run();
  }, [pending, router]);

  useEffect(() => {
    if (!unloadBusy) {
      setPending(null);
      return;
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [unloadBusy]);

  useEffect(() => {
    if (!navBlocked) return;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-leave-guard-dialog]")) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || sameDocumentUrl(href)) return;
      event.preventDefault();
      event.stopPropagation();
      const next = new URL(href, window.location.href);
      setPending({
        kind: "href",
        href: `${next.pathname}${next.search}${next.hash}`,
      });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [navBlocked]);

  useEffect(() => {
    if (!pending) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") stay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, stay]);

  const value = useMemo(
    () => ({ busy: unloadBusy, register, requestLeave }),
    [unloadBusy, register, requestLeave],
  );

  return (
    <LeaveGuardContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {pending ? (
          <motion.div
            key="leave-guard"
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            data-leave-guard-dialog=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={trPanelFadeTransition}
            onClick={stay}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl border border-[color:var(--panel-accent-border)] bg-white p-5 shadow-xl sm:p-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={trPanelFadeTransition}
              onClick={(event) => event.stopPropagation()}
            >
              {dialogKind === "busy" ? (
                <>
                  <p
                    id={titleId}
                    className="text-[20px] font-semibold text-neutral-900"
                  >
                    İşlem devam ediyor
                  </p>
                  <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">
                    Bu işlemi sonlandırmak üzeresiniz. Devam eden katalog veya
                    model hazırlama durur; görseller yarıda kalabilir.
                  </p>
                </>
              ) : (
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className="mt-0.5 h-6 w-6 shrink-0 text-amber-500"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <p
                    id={titleId}
                    className="text-[17px] leading-snug font-medium text-neutral-900"
                  >
                    {UNSAVED_CHANGES_MESSAGE}
                  </p>
                </div>
              )}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className={`${panelSecondaryBtnClass} flex-1`}
                  onClick={stay}
                >
                  {dialogKind === "busy" ? "Vazgeç" : "Hayır"}
                </button>
                <button
                  type="button"
                  className={`${
                    dialogKind === "busy"
                      ? panelDangerBtnClass
                      : panelPrimaryBtnClass
                  } flex-1`}
                  onClick={leave}
                >
                  {dialogKind === "busy" ? "Çık ve durdur" : "Evet"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </LeaveGuardContext.Provider>
  );
}

export function useRegisterLeaveBusy(
  id: string,
  busy: boolean,
  options?: { blockPanelNav?: boolean; kind?: LeaveKind },
) {
  const register = useContext(LeaveGuardContext)?.register;
  const blockPanelNav = options?.blockPanelNav ?? true;
  const kind = options?.kind ?? "busy";
  useEffect(() => {
    if (!register) return;
    register(id, busy, blockPanelNav, kind);
    return () => register(id, false);
  }, [id, busy, blockPanelNav, kind, register]);
}

/**
 * One line for any page that holds unsaved edits: `useUnsavedChangesGuard("id",
 * dirty)`. While `dirty`, leaving the page (sidebar, back arrow, links) asks first,
 * and reloading or closing the tab shows the browser's own prompt. The browser's
 * Back button is not intercepted (the app router does not allow it).
 */
export function useUnsavedChangesGuard(id: string, dirty: boolean) {
  useRegisterLeaveBusy(id, dirty, { kind: "unsaved" });
}

export function useRequestBusyLeave() {
  return useContext(LeaveGuardContext)?.requestLeave ?? null;
}
