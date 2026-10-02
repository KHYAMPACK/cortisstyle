import type { Metadata } from "next";
import { TrOwnerNewProductPage } from "@/components/tr/panel/TrOwnerNewProductPage";

export const metadata: Metadata = {
  title: "Yeni ürün",
  robots: { index: false, follow: false },
};

export default function TrPanelNewProductRoute() {
  return <TrOwnerNewProductPage />;
}
