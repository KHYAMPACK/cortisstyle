"use client";

import { createContext, useContext, useMemo } from "react";
import type { CanvasLayoutReference } from "@/lib/lookCanvasReference";

const LookCanvasLayoutContext = createContext<CanvasLayoutReference | null>(null);

export function LookCanvasLayoutProvider({
  referenceWidth,
  referenceHeight,
  children,
}: {
  referenceWidth: number | null;
  referenceHeight: number | null;
  children: React.ReactNode;
}) {
  const reference = useMemo(() => {
    if (referenceWidth === null || referenceHeight === null) return null;
    return { width: referenceWidth, height: referenceHeight };
  }, [referenceWidth, referenceHeight]);

  return (
    <LookCanvasLayoutContext.Provider value={reference}>
      {children}
    </LookCanvasLayoutContext.Provider>
  );
}

export function useLookCanvasLayoutReference(): CanvasLayoutReference | null {
  return useContext(LookCanvasLayoutContext);
}
