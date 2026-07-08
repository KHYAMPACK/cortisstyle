import type { Metadata } from "next";
import { TrOwnerComingSoonPage } from "@/components/tr/panel/TrOwnerComingSoonPage";

export const metadata: Metadata = {
  title: "İndirim · Butik paneli",
  robots: { index: false, follow: false },
};

export default function TrPanelDiscountsPage() {
  return <TrOwnerComingSoonPage title="İndirim" />;
}
