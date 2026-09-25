import type { Metadata } from "next";
import { TrOwnerVariantTypesPage } from "@/components/tr/panel/TrOwnerVariantTypesPage";

export const metadata: Metadata = {
  title: "Varyant Türleri",
  robots: { index: false, follow: false },
};

export default function TrPanelVariantTypesRoute() {
  return <TrOwnerVariantTypesPage />;
}
