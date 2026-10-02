import type { Metadata } from "next";
import { TrOwnerNewProductPage } from "@/components/tr/panel/TrOwnerNewProductPage";

export const metadata: Metadata = {
  title: "Varyantlı ürün ekle",
  robots: { index: false, follow: false },
};

/** A product with variants; staff only until the shop can sell them (owners get the chooser). */
export default function TrPanelNewAdvancedProductRoute() {
  return <TrOwnerNewProductPage advanced />;
}
