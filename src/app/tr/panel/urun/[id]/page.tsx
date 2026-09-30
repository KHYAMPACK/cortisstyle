import type { Metadata } from "next";
import { TrOwnerEditProductPage } from "@/components/tr/panel/TrOwnerEditProductPage";

export const metadata: Metadata = {
  title: "Ürünü düzenle",
  robots: { index: false, follow: false },
};

interface EditProductPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TrPanelEditProductRoute({
  params,
  searchParams,
}: EditProductPageProps) {
  const { id } = await params;
  const { editor } = await searchParams;
  return (
    <TrOwnerEditProductPage
      productId={id}
      requestedFashionEditor={editor === "yeni" ? "manual-save" : null}
    />
  );
}
