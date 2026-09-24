"use client";

import { usePanelStoredFlag } from "@/components/tr/panel/panelStoredFlag";

/** Desktop sidebar collapsed state, remembered per browser. */
export function usePanelSidebarCollapsed(): [boolean, (next: boolean) => void] {
  return usePanelStoredFlag("tr-panel-sidebar-collapsed", false);
}
