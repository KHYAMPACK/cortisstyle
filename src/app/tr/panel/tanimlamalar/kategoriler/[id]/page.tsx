import type { Metadata } from "next";
import { TrOwnerCategoryEditorPage } from "@/components/tr/panel/TrOwnerCategoryEditorPage";

export const metadata: Metadata = {
  title: "Kategoriyi düzenle",
  robots: { index: false, follow: false },
};

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function TrPanelEditCategoryRoute({
  params,
}: EditCategoryPageProps) {
  const { id } = await params;
  return <TrOwnerCategoryEditorPage categoryId={id} />;
}
