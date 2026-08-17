"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import {
  CADDE_TRANSITION_COVER_MS,
  CADDE_TRANSITION_EXIT_MS,
  CADDE_TRANSITION_FILL_MS,
  CADDE_TRANSITION_HOLD_MS,
  CADDE_TRANSITION_MAX_WAIT_MS,
  CADDE_TRANSITION_WORD,
  markCaddePageTransitionBusy,
} from "@/lib/platform/caddeTransition";

type Phase = "idle" | "covering" | "filling" | "holding" | "exiting";

type CaddePageTransitionApi = {
  go: (href: string) => void;
  goBack: () => void;
};

const CaddePageTransitionContext = createContext<CaddePageTransitionApi | null>(
  null,
);

export function useCaddePageTransition(): CaddePageTransitionApi | null {
  return useContext(CaddePageTransitionContext);
}

export function CaddePageTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const maskId = useId().replace(/:/g, "");
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const pendingHref = useRef<string | null>(null);
  const pendingBack = useRef(false);
  const fromPath = useRef(pathname);
  const busy = useRef(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const [wordWidth, setWordWidth] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const node = overlayRef.current;
    if (!node) return;
    const sync = () => setWordWidth(Math.round(node.clientWidth * 0.96));
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => observer.disconnect();
  }, [mounted]);

  const resetIdle = useCallback(() => {
    pendingHref.current = null;
    pendingBack.current = false;
    busy.current = false;
    markCaddePageTransitionBusy(false);
    setPhase("idle");
  }, []);

  const go = useCallback(
    (href: string) => {
      if (busy.current) return;
      if (reduceMotion) {
        router.push(href, href.includes("#") ? { scroll: false } : undefined);
        return;
      }
      busy.current = true;
      markCaddePageTransitionBusy(true);
      pendingBack.current = false;
      pendingHref.current = href;
      fromPath.current = pathname;
      setPhase("covering");
    },
    [pathname, reduceMotion, router],
  );

  const goBack = useCallback(() => {
    if (busy.current) return;
    if (reduceMotion) {
      router.back();
      return;
    }
      busy.current = true;
      markCaddePageTransitionBusy(true);
      pendingBack.current = true;
    pendingHref.current = null;
    fromPath.current = pathname;
    setPhase("covering");
  }, [pathname, reduceMotion, router]);

  useEffect(() => {
    if (phase !== "covering") return;
    const timer = window.setTimeout(() => {
      setPhase("filling");
    }, CADDE_TRANSITION_COVER_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "filling") return;
    const timer = window.setTimeout(() => {
      if (pendingBack.current) {
        router.back();
      } else if (pendingHref.current) {
        const href = pendingHref.current;
        router.push(href, href.includes("#") ? { scroll: false } : undefined);
      }
      setPhase("holding");
    }, CADDE_TRANSITION_FILL_MS);
    return () => window.clearTimeout(timer);
  }, [phase, router]);

  useEffect(() => {
    if (phase !== "holding") return;

    const from = fromPath.current;
    const started = Date.now();

    const tryExit = () => {
      const moved = pathname !== from;
      const waited = Date.now() - started >= CADDE_TRANSITION_HOLD_MS;
      if (moved && waited) {
        setPhase("exiting");
        return true;
      }
      return false;
    };

    if (tryExit()) return;

    const poll = window.setInterval(() => {
      if (tryExit()) window.clearInterval(poll);
    }, 40);
    const cap = window.setTimeout(() => {
      setPhase("exiting");
    }, CADDE_TRANSITION_MAX_WAIT_MS);

    return () => {
      window.clearInterval(poll);
      window.clearTimeout(cap);
    };
  }, [phase, pathname]);

  useEffect(() => {
    if (phase !== "exiting") return;
    const timer = window.setTimeout(resetIdle, CADDE_TRANSITION_EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [phase, resetIdle]);

  const covering = phase === "covering" || phase === "filling" || phase === "holding";
  const filled = phase === "filling" || phase === "holding" || phase === "exiting";
  const transform =
    covering
      ? "translate3d(0, 0, 0)"
      : "translate3d(0, -110%, 0)";
  const durationMs =
    phase === "exiting" ? CADDE_TRANSITION_EXIT_MS : CADDE_TRANSITION_COVER_MS;

  const overlay = mounted
    ? createPortal(
        <div
          ref={overlayRef}
          className={`fixed inset-0 z-[9998] h-dvh w-screen overflow-hidden ${
            covering ? "pointer-events-auto" : "pointer-events-none"
          }`}
          {...(covering
            ? {
                role: "status" as const,
                "aria-live": "polite" as const,
                "aria-label": "Cortisstyle",
              }
            : { "aria-hidden": true })}
          style={{
            transform,
            transition:
              phase === "idle"
                ? "none"
                : `transform ${durationMs}ms cubic-bezier(0.87, 0, 0.13, 1)`,
            willChange: "transform",
          }}
        >
          <svg
            aria-hidden
            className="absolute inset-0 h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <mask
                id={maskId}
                maskUnits="userSpaceOnUse"
                maskContentUnits="userSpaceOnUse"
              >
                <rect width="100%" height="100%" fill="white" />
                <text
                  x="50%"
                  y="90%"
                  textAnchor="middle"
                  fill="black"
                  textLength={wordWidth > 0 ? wordWidth : "96%"}
                  lengthAdjust="spacingAndGlyphs"
                  fontFamily="Anton, Oswald, Impact, sans-serif"
                  fontWeight="400"
                  style={{ fontSize: "max(18vw, 20vh)" }}
                >
                  {CADDE_TRANSITION_WORD}
                </text>
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="#000000"
              mask={`url(#${maskId})`}
            />
          </svg>
          <div
            aria-hidden
            className="absolute inset-0 bg-black"
            style={{
              transform: filled
                ? "translate3d(0, 0, 0)"
                : "translate3d(0, -110%, 0)",
              transition:
                phase === "idle"
                  ? "none"
                  : `transform ${CADDE_TRANSITION_FILL_MS}ms cubic-bezier(0.87, 0, 0.13, 1)`,
            }}
          />
          <div className="absolute inset-0" />
        </div>,
        document.body,
      )
    : null;

  return (
    <CaddePageTransitionContext.Provider value={{ go, goBack }}>
      {children}
      {overlay}
    </CaddePageTransitionContext.Provider>
  );
}
