import { TrOwnerOrderDetailPage } from "@/components/tr/panel/TrOwnerOrderDetailPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <TrOwnerOrderDetailPage orderId={id} />;
}
