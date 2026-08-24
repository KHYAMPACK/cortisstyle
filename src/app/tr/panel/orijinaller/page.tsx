import type { Metadata } from "next";
import { TrOwnerOriginalsPage } from "@/components/tr/panel/TrOwnerOriginalsPage";

export const metadata: Metadata = {
  title: "Orijinal fotoğraflar · Butik paneli",
  robots: { index: false, follow: false },
};

export default function TrPanelOriginalsPage() {
  return <TrOwnerOriginalsPage />;
}
