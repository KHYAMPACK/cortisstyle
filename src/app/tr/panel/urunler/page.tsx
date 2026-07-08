import type { Metadata } from "next";
import { TrOwnerProductListPage } from "@/components/tr/panel/TrOwnerProductListPage";

export const metadata: Metadata = {
  title: "Ürünler · Butik paneli",
  robots: { index: false, follow: false },
};

export default function TrPanelProductsPage() {
  return <TrOwnerProductListPage />;
}
