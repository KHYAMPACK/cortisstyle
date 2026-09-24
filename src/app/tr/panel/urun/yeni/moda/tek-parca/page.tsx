import type { Metadata } from "next";
import { TrOwnerNewProductPage } from "@/components/tr/panel/TrOwnerNewProductPage";

export const metadata: Metadata = {
  title: "Yeni ürün · tek parça",
  robots: { index: false, follow: false },
};

export default function TrPanelNewFashionSingleProductRoute() {
  return <TrOwnerNewProductPage />;
}
