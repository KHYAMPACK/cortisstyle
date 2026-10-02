import type { Metadata } from "next";
import { TrOwnerAttributesPage } from "@/components/tr/panel/TrOwnerAttributesPage";

export const metadata: Metadata = {
  title: "Özellikler",
  robots: { index: false, follow: false },
};

export default function TrPanelAttributesRoute() {
  return <TrOwnerAttributesPage />;
}
