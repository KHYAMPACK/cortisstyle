import type { Metadata } from "next";
import { TrOwnerProductKindsPage } from "@/components/tr/panel/TrOwnerProductKindsPage";

export const metadata: Metadata = {
  title: "Ürün Türleri",
  robots: { index: false, follow: false },
};

export default function TrPanelProductKindsRoute() {
  return <TrOwnerProductKindsPage />;
}
