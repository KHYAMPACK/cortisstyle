import { TrCheckoutPageContent } from "@/components/tr/TrCheckoutPageContent";
import { TrSectionHeader } from "@/components/tr/TrSectionHeader";

export default function TrCheckoutPage() {
  return (
    <div>
      <TrSectionHeader
        kicker="[ ÖDEME ]"
        title="Ödeme"
        description="Teslimat bilgilerinizi girin. Kart ödemesi henüz aktif değil."
      />
      <TrCheckoutPageContent />
    </div>
  );
}
