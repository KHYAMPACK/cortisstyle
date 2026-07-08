import type { Metadata } from "next";
import { TrOwnerComingSoonPage } from "@/components/tr/panel/TrOwnerComingSoonPage";

export const metadata: Metadata = {
  title: "Stok · Butik paneli",
  robots: { index: false, follow: false },
};

export default function TrPanelStockPage() {
  return <TrOwnerComingSoonPage title="Stok" />;
}
