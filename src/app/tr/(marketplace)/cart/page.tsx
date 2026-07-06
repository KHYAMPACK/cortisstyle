import { TrCartPageContent } from "@/components/tr/TrCartPageContent";
import { TrSectionHeader } from "@/components/tr/TrSectionHeader";

export default function TrCartPage() {
  return (
    <div>
      <TrSectionHeader
        kicker="[ SEPET ]"
        title="Sepetiniz"
        description="Ürünlerinizi gözden geçirin. Ödeme bir sonraki aşamada açılacak."
      />
      <TrCartPageContent />
    </div>
  );
}
