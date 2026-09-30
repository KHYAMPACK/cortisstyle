import type { Metadata } from "next";
import { TrOwnerEditProductPage } from "@/components/tr/panel/TrOwnerEditProductPage";

export const metadata: Metadata = {
  title: "Ürünü düzenle",
  robots: { index: false, follow: false },
};

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function TrPanelEditProductRoute({
  params,
}: EditProductPageProps) {
  const { id } = await params;
  return <TrOwnerEditProductPage productId={id} />;
}
