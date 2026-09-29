import type { Metadata } from "next";
import { TrOwnerDiscountCampaignEditorPage } from "@/components/tr/panel/discounts/TrOwnerDiscountCampaignEditorPage";

export const metadata: Metadata = {
  title: "Kampanyayı düzenle",
  robots: { index: false, follow: false },
};

interface EditCampaignPageProps {
  params: Promise<{ id: string }>;
}

export default async function TrPanelEditCampaignRoute({
  params,
}: EditCampaignPageProps) {
  const { id } = await params;
  return <TrOwnerDiscountCampaignEditorPage campaignId={id} />;
}
