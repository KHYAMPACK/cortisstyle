import type { Metadata } from "next";
import { TrOwnerProductListPage } from "@/components/tr/panel/TrOwnerProductListPage";

export const metadata: Metadata = {
  title: "Butik paneli",
  robots: { index: false, follow: false },
};

export default function TrPanelPage() {
  return <TrOwnerProductListPage />;
}
