import { TrOwnerCustomerDetailPage } from "@/components/tr/panel/TrOwnerCustomerDetailPage";

interface PageProps {
  params: Promise<{ email: string }>;
}

export default async function Page({ params }: PageProps) {
  const { email } = await params;
  return <TrOwnerCustomerDetailPage email={email} />;
}
