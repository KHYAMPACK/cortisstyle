import type { Metadata } from "next";
import { TrOwnerDiscountCampaignEditorPage } from "@/components/tr/panel/discounts/TrOwnerDiscountCampaignEditorPage";

export const metadata: Metadata = {
  title: "Kampanya ekle",
  robots: { index: false, follow: false },
};

export default function TrPanelNewCampaignRoute() {
  return <TrOwnerDiscountCampaignEditorPage />;
}
