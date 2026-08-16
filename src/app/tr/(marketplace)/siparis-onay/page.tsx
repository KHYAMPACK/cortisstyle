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
        tone="cadde"
        index="01"
        kicker="Sipariş"
        title={demo ? "Demo sipariş alındı" : "Sipariş onayı"}
        description={
          demo
            ? "Gerçek ödeme alınmadı — vitrin demosu tamamlandı."
            : "Başarılı ödeme sonrası sipariş özeti burada görünecek."
        }
        clearChrome
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
          className="font-cadde-nav inline-flex items-center justify-center bg-jet-black px-6 py-4 text-[11px] font-semibold tracking-[0.28em] text-white uppercase transition-opacity hover:opacity-85"
        >
          [ Ana sayfaya dön ]
        </Link>
      </div>
    </div>
  );
}
