import Link from "next/link";
import { TrSectionHeader } from "@/components/tr/TrSectionHeader";
import { trHomePath } from "@/lib/tr/paths";

export default function TrOrderConfirmationPage() {
  return (
    <div>
      <TrSectionHeader
        kicker="[ SİPARİŞ ]"
        title="Sipariş onayı"
        description="Başarılı ödeme sonrası sipariş özeti burada görünecek."
      />

      <div className="px-5 py-10 md:px-10">
        <Link
          href={trHomePath()}
          className="btn-primary inline-flex items-center justify-center px-6 py-4 text-[11px] tracking-[0.2em]"
        >
          Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}
