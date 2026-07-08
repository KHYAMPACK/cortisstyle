import type { Metadata } from "next";
import { TrOwnerComingSoonPage } from "@/components/tr/panel/TrOwnerComingSoonPage";
import { isTrCheckoutEnabled } from "@/lib/tr/platform";

export const metadata: Metadata = {
  title: "Siparişler · Butik paneli",
  robots: { index: false, follow: false },
};

export default function TrPanelOrdersPage() {
  const checkoutOn = isTrCheckoutEnabled();
  return (
    <TrOwnerComingSoonPage
      title="Siparişler"
      description={
        checkoutOn
          ? "Sipariş listesi bir sonraki adımda buraya gelecek. Ödeme açık olduğunda günlük özet Ana Sayfa’da görünür."
          : "Online ödeme kapalı. Siparişler şimdilik WhatsApp üzerinden alınıyor. Ödeme açılınca sipariş listesi burada olacak."
      }
    />
  );
}
