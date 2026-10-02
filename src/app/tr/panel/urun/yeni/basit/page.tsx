import type { Metadata } from "next";
import { TrOwnerNewProductPage } from "@/components/tr/panel/TrOwnerNewProductPage";

export const metadata: Metadata = {
  title: "Basit ürün ekle",
  robots: { index: false, follow: false },
};

export default function TrPanelNewSimpleProductRoute() {
  return <TrOwnerNewProductPage />;
}
