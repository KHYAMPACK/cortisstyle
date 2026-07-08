import type { Metadata } from "next";
import { TrOwnerComingSoonPage } from "@/components/tr/panel/TrOwnerComingSoonPage";

export const metadata: Metadata = {
  title: "Müşteriler · Butik paneli",
  robots: { index: false, follow: false },
};

export default function TrPanelCustomersPage() {
  return <TrOwnerComingSoonPage title="Müşteriler" />;
}
