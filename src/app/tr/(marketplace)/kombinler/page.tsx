import type { Metadata } from "next";
import { TrLookLookbook } from "@/components/tr/marketplace/TrLookLookbook";
import { TrSectionHeader } from "@/components/tr/TrSectionHeader";
import { safeListPublishedTrLooks } from "@/lib/tr/looks";

export const metadata: Metadata = {
  title: "Kombinler",
  description: "Cadde’den seçilmiş kombinler — vitrin ve parçalar.",
};

export default async function TrKombinlerPage() {
  const looks = await safeListPublishedTrLooks();

  return (
    <div>
      <TrSectionHeader
        tone="cadde"
        index="01"
        kicker="Editoryal"
        title="Kombinler"
        align="center"
        clearChrome
      />
      <TrLookLookbook looks={looks} />
    </div>
  );
}
