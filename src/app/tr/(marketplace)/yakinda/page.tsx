import Link from "next/link";
import { TrSectionHeader } from "@/components/tr/TrSectionHeader";
import { trHomePath } from "@/lib/tr/paths";

export default function TrComingSoonPage() {
  return (
    <div>
      <TrSectionHeader
        kicker="[ YAKINDA ]"
        title="Yakında"
        description="Hukuki metinler ve tam ödeme deneyimi kayıt süreci tamamlandığında yayınlanacak."
      />

      <div className="px-5 py-10 md:px-10">
        <Link
          href={trHomePath()}
          className="text-meta text-[10px] tracking-[0.22em] uppercase underline underline-offset-2"
        >
          ← Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}
