import { TrCheckoutPageContent } from "@/components/tr/TrCheckoutPageContent";
import { TrSectionHeader } from "@/components/tr/TrSectionHeader";

export default function TrOdemePage() {
  return (
    <div>
      <TrSectionHeader
        tone="cadde"
        index="01"
        kicker="Ödeme"
        title="Ödeme"
        description="Teslimat bilgilerinizi girin. Kart ödemesi henüz aktif değil."
        clearChrome
      />
      <TrCheckoutPageContent />
    </div>
  );
}
