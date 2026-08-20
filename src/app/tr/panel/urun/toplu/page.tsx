import type { Metadata } from "next";
import { TrOwnerBatchCreatePage } from "@/components/tr/panel/TrOwnerBatchCreatePage";

export const metadata: Metadata = {
  title: "Toplu ürün ekle",
  robots: { index: false, follow: false },
};

export default function TrPanelBatchNewProductsRoute() {
  return <TrOwnerBatchCreatePage />;
}
