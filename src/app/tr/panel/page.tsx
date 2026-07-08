import type { Metadata } from "next";
import { TrOwnerHomePage } from "@/components/tr/panel/TrOwnerHomePage";

export const metadata: Metadata = {
  title: "Butik paneli",
  robots: { index: false, follow: false },
};

export default function TrPanelPage() {
  return <TrOwnerHomePage />;
}
