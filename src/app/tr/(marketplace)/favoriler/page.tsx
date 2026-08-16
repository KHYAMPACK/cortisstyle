import { TrFavoritesPageContent } from "@/components/tr/TrFavoritesPageContent";
import { TrSectionHeader } from "@/components/tr/TrSectionHeader";

export default function TrFavoritesPage() {
  return (
    <div>
      <TrSectionHeader
        tone="cadde"
        index="01"
        kicker="Favoriler"
        title="Kaydettikleriniz"
        description="Cihazınızda saklanır. Giriş yapmadan kullanabilirsiniz."
        align="center"
        clearChrome
      />
      <TrFavoritesPageContent />
    </div>
  );
}
