"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type MouseEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  resolveBoutiqueSkeletonKind,
  TrBoutiquePageSkeleton,
  type TrBoutiqueSkeletonKind,
} from "@/components/tr/boutique/editorial/TrBoutiqueSkeletons";
import { markTrCanGoBack, writeTrScroll } from "@/lib/tr/scrollMemory";

interface BeginOptions {
  kind?: TrBoutiqueSkeletonKind;
  /** Called after navigation is accepted (e.g. close drawer). */
  onNavigate?: () => void;
}

interface TrBoutiqueNavPendingContextValue {
  isPending: boolean;
  kind: TrBoutiqueSkeletonKind | null;
  beginNavigation: (href: string, options?: BeginOptions) => void;
}

const TrBoutiqueNavPendingContext =
  createContext<TrBoutiqueNavPendingContextValue | null>(null);

function normalizePath(path: string) {
  const bare = path.split("?")[0]?.split("#")[0] ?? path;
  if (bare.length > 1 && bare.endsWith("/")) return bare.slice(0, -1);
  return bare || "/";
}

/** Strip `/tr/{slug}` so custom-domain `/giris` matches `/tr/slug/giris`. */
function boutiqueRelativePath(path: string) {
  const normalized = normalizePath(path);
  const stripped = normalized.replace(/^\/tr\/[^/]+/, "");
  return stripped || "/";
}

function pathsMatch(current: string, targetHref: string) {
  const a = normalizePath(current);
  const b = normalizePath(targetHref);
  if (a === b) return true;
  return boutiqueRelativePath(a) === boutiqueRelativePath(b);
}

export function useTrBoutiqueNavPendingOptional() {
  return useContext(TrBoutiqueNavPendingContext);
}

export function useTrBoutiqueNavPending() {
  const ctx = useContext(TrBoutiqueNavPendingContext);
  if (!ctx) {
    throw new Error(
      "useTrBoutiqueNavPending must be used within TrBoutiqueNavPendingProvider",
    );
  }
  return ctx;
}

interface ProviderProps {
  children: ReactNode;
}

interface MainProps {
  children: ReactNode;
}

/**
 * Provides instant boutique navigation helpers. Pair with
 * `TrBoutiquePendingMain` so the header/footer stay mounted.
 */
export function TrBoutiqueNavPendingProvider({ children }: ProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [transitionPending, startTransition] = useTransition();
  const [kind, setKind] = useState<TrBoutiqueSkeletonKind | null>(null);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const sawTransitionRef = useRef(false);

  const clearPending = useCallback(() => {
    sawTransitionRef.current = false;
    setPendingHref(null);
    setKind(null);
  }, []);

  useEffect(() => {
    if (transitionPending) sawTransitionRef.current = true;
  }, [transitionPending]);

  // Clear only after the transition has actually run (avoids one-frame flicker).
  useEffect(() => {
    if (!pendingHref || transitionPending || !sawTransitionRef.current) return;
    clearPending();
  }, [transitionPending, pendingHref, clearPending]);

  // Safety: drop stuck skeletons if navigation never settles.
  useEffect(() => {
    if (!pendingHref) return;
    const timer = window.setTimeout(() => clearPending(), 12_000);
    return () => window.clearTimeout(timer);
  }, [pendingHref, clearPending]);

  const beginNavigation = useCallback(
    (href: string, options?: BeginOptions) => {
      if (pathsMatch(pathname, href) && !href.includes("?")) {
        options?.onNavigate?.();
        return;
      }

      writeTrScroll(pathname, window.scrollY);
      markTrCanGoBack();
      options?.onNavigate?.();

      sawTransitionRef.current = false;
      setPendingHref(href);
      setKind(options?.kind ?? resolveBoutiqueSkeletonKind(href));

      startTransition(() => {
        router.push(href);
      });
    },
    [pathname, router],
  );

  const showSkeleton = pendingHref !== null && kind !== null;

  return (
    <TrBoutiqueNavPendingContext.Provider
      value={{
        isPending: showSkeleton,
        kind,
        beginNavigation,
      }}
    >
      {children}
    </TrBoutiqueNavPendingContext.Provider>
  );
}

/** Renders the route skeleton in place of page content while a nav is pending. */
export function TrBoutiquePendingMain({ children }: MainProps) {
  const pending = useTrBoutiqueNavPendingOptional();
  if (pending?.isPending && pending.kind) {
    return <TrBoutiquePageSkeleton kind={pending.kind} />;
  }
  return children;
}

interface TrBoutiquePendingLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
  prefetch?: boolean;
  "aria-label"?: string;
  kind?: TrBoutiqueSkeletonKind;
  onNavigate?: () => void;
}

/** Link that swaps main content to a skeleton immediately on click. */
export function TrBoutiquePendingLink({
  href,
  className,
  children,
  prefetch = true,
  "aria-label": ariaLabel,
  kind,
  onNavigate,
}: TrBoutiquePendingLinkProps) {
  const pending = useTrBoutiqueNavPendingOptional();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    if (!pending) return;

    if (href.includes("#")) {
      onNavigate?.();
      return;
    }

    event.preventDefault();
    pending.beginNavigation(href, { kind, onNavigate });
  };

  return (
    <Link
      href={href}
      prefetch={prefetch}
      onClick={handleClick}
      className={className}
      aria-label={ariaLabel}
      aria-busy={pending?.isPending || undefined}
    >
      {children}
    </Link>
  );
}
