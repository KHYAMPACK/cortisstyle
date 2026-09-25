import type { Metadata } from "next";
import { TrOwnerNewSimpleProductPage } from "@/components/tr/panel/TrOwnerNewSimpleProductPage";

export const metadata: Metadata = {
  title: "Gelişmiş ürün ekle",
  robots: { index: false, follow: false },
};

export default function TrPanelNewAdvancedProductRoute() {
  return <TrOwnerNewSimpleProductPage productType="advanced" />;
}
