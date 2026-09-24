import type { Metadata } from "next";
import { TrOwnerProductTypeChooser } from "@/components/tr/panel/TrOwnerProductTypeChooser";

export const metadata: Metadata = {
  title: "Yeni ürün",
  robots: { index: false, follow: false },
};

export default function TrPanelNewProductRoute() {
  return <TrOwnerProductTypeChooser />;
}
