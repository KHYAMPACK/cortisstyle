import type { Metadata } from "next";
import { TrOwnerCategoryEditorPage } from "@/components/tr/panel/TrOwnerCategoryEditorPage";

export const metadata: Metadata = {
  title: "Kategori ekle",
  robots: { index: false, follow: false },
};

export default function TrPanelNewCategoryRoute() {
  return <TrOwnerCategoryEditorPage />;
}
