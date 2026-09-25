import { TrOwnerNewOrderPage } from "@/components/tr/panel/TrOwnerNewOrderPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <TrOwnerNewOrderPage draftId={id} />;
}
