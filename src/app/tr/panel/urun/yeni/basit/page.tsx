import type { Metadata } from "next";
import { TrOwnerNewSimpleProductPage } from "@/components/tr/panel/TrOwnerNewSimpleProductPage";

export const metadata: Metadata = {
  title: "Basit ürün ekle",
  robots: { index: false, follow: false },
};

export default function TrPanelNewSimpleProductRoute() {
  return <TrOwnerNewSimpleProductPage />;
}
