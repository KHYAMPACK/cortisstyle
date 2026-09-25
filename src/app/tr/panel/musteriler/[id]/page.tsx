import { TrOwnerCustomerDetailPage } from "@/components/tr/panel/customers/TrOwnerCustomerDetailPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <TrOwnerCustomerDetailPage customerId={id} />;
}
