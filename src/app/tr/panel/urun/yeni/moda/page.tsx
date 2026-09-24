import type { Metadata } from "next";
import { TrOwnerFashionCreateChooser } from "@/components/tr/fashion/panel/TrOwnerFashionCreateChooser";

export const metadata: Metadata = {
  title: "Moda ürünü ekle",
  robots: { index: false, follow: false },
};

export default function TrPanelNewFashionProductRoute() {
  return <TrOwnerFashionCreateChooser />;
}
