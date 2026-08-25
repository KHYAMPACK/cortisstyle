import type { Metadata } from "next";
import { TrOwnerTakimCreatePage } from "@/components/tr/panel/TrOwnerTakimCreatePage";

export const metadata: Metadata = {
  title: "Takım yükle",
  robots: { index: false, follow: false },
};

export default function TrPanelTakimNewProductRoute() {
  return <TrOwnerTakimCreatePage />;
}
