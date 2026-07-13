import Link from "next/link";
import { TrSectionHeader } from "@/components/tr/TrSectionHeader";
import { trHomePath } from "@/lib/tr/paths";

interface TrOrderConfirmationPageProps {
  searchParams: Promise<{ demo?: string }>;
}

export default async function TrOrderConfirmationPage({
  searchParams,
}: TrOrderConfirmationPageProps) {
  const params = await searchParams;
  const demo = params.demo === "1";

  return (
    <div>
      <TrSectionHeader
        kicker="[ SİPARİŞ ]"
        title={demo ? "Demo sipariş alındı" : "Sipariş onayı"}
        description={
          demo
            ? "Gerçek ödeme alınmadı — vitrin demosu tamamlandı."
            : "Başarılı ödeme sonrası sipariş özeti burada görünecek."
        }
      />

      <div className="px-5 py-10 md:px-10">
        {demo ? (
          <p className="text-meta mb-8 max-w-xl text-[12px] leading-relaxed">
            Sepet temizlendi. Canlı stok bağlandığında aynı akış gerçek ödemeyle
            çalışacak.
          </p>
        ) : null}
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
