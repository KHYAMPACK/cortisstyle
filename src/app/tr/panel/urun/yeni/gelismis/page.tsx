import type { Metadata } from "next";
import { TrOwnerNewProductPage } from "@/components/tr/panel/TrOwnerNewProductPage";

export const metadata: Metadata = {
  title: "Gelişmiş ürün ekle",
  robots: { index: false, follow: false },
};

/** Gelişmiş ürün (variants); staff only until the shop can sell them (an owner gets a Basit one). */
export default function TrPanelNewAdvancedProductRoute() {
  return <TrOwnerNewProductPage advanced />;
}
