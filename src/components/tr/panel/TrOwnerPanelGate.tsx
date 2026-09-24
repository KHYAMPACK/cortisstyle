"use client";

import type { ReactNode } from "react";
import {
  useTrOwnerPanel,
  type TrOwnerPanelContext,
} from "@/components/tr/panel/TrPanelShell";

/**
 * Hands a page the active boutique and friends.
 *
 * The panel chrome (sign-in, boutique list, sidebar) is NOT rendered here — it
 * lives in `app/tr/panel/layout.tsx` (`TrPanelShell`) and stays mounted across
 * navigations. A page must never mount its own shell; it only reads the context.
 */
export function TrOwnerPanelGate({
  children,
}: {
  children: (context: TrOwnerPanelContext) => ReactNode;
}) {
  const context = useTrOwnerPanel();
  return <>{children(context)}</>;
}
