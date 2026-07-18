"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  markTrCanGoBack,
  readTrScroll,
  writeTrScroll,
} from "@/lib/tr/scrollMemory";

/**
 * Persists scroll per /tr path and restores it on history back/forward.
 * Forward navigations scroll to top.
 */
export function TrScrollRestoration() {
  const pathname = usePathname();
  const pendingRestore = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      pendingRestore.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Any in-app /tr link click: remember scroll + enable back
  useEffect(() => {
    const onClickCapture = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
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
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/tr")) return;
      writeTrScroll(pathname, window.scrollY);
      markTrCanGoBack();
    };
    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, [pathname]);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        writeTrScroll(pathname, window.scrollY);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    writeTrScroll(pathname, window.scrollY);
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  useEffect(() => {
    if (pendingRestore.current) {
      pendingRestore.current = false;
      const y = readTrScroll(pathname) ?? 0;
      const restore = () => {
        window.scrollTo({ top: y, left: 0, behavior: "auto" });
      };
      restore();
      requestAnimationFrame(() => {
        restore();
        requestAnimationFrame(restore);
      });
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
