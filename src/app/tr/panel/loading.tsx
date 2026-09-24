import { TrPanelListSkeleton } from "@/components/tr/panel/TrPanelMotion";

/**
 * Shown in the page slot the instant a navigation starts, while the route
 * streams in. The shell around it (sidebar, top bar) stays put. Routes that were
 * prefetched in full skip straight past this.
 */
export default function TrPanelLoading() {
  return <TrPanelListSkeleton rows={4} label="Yükleniyor" />;
}
