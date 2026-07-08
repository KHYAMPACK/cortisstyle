import type { Metadata } from "next";
import { TrOwnerSettingsPage } from "@/components/tr/panel/TrOwnerSettingsPage";

export const metadata: Metadata = {
  title: "Ayarlar · Butik paneli",
  robots: { index: false, follow: false },
};

export default function TrPanelSettingsPage() {
  return <TrOwnerSettingsPage />;
}
