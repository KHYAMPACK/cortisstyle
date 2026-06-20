"use client";

import { createContext, useContext } from "react";

const LookCanvasLayoutContext = createContext<number | null>(null);

export function LookCanvasLayoutProvider({
  referenceWidth,
  children,
}: {
  referenceWidth: number | null;
  children: React.ReactNode;
}) {
  return (
    <LookCanvasLayoutContext.Provider value={referenceWidth}>
      {children}
    </LookCanvasLayoutContext.Provider>
  );
}

export function useLookCanvasReferenceWidth(): number | null {
  return useContext(LookCanvasLayoutContext);
}
