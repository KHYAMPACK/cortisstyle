import type { Metadata } from "next";
import { TrOwnerDefinitionsPage } from "@/components/tr/panel/TrOwnerDefinitionsPage";

export const metadata: Metadata = {
  title: "Tanımlamalar",
  robots: { index: false, follow: false },
};

export default function TrPanelDefinitionsRoute() {
  return <TrOwnerDefinitionsPage />;
}
