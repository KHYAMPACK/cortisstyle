import type { Metadata } from "next";
import { TrOwnerCategoriesPage } from "@/components/tr/panel/TrOwnerCategoriesPage";

export const metadata: Metadata = {
  title: "Kategoriler",
  robots: { index: false, follow: false },
};

export default function TrPanelCategoriesRoute() {
  return <TrOwnerCategoriesPage />;
}
