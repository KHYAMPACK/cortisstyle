import Link from "next/link";
import { TrSectionHeader } from "@/components/tr/TrSectionHeader";
import { trHomePath } from "@/lib/tr/paths";

export default function TrComingSoonPage() {
  return (
    <div>
      <TrSectionHeader
        tone="cadde"
        index="01"
        kicker="Yakında"
        title="Yakında"
        description="Hukuki metinler ve tam ödeme deneyimi kayıt süreci tamamlandığında yayınlanacak."
        clearChrome
      />

      <div className="px-5 py-10 md:px-10">
        <Link
          href={trHomePath()}
          className="font-cadde-nav text-[10px] tracking-[0.22em] text-jet-black uppercase underline underline-offset-2 transition-colors hover:text-cadde-red"
        >
          ← Ana sayfaya dön
        </Link>
      </div>
    </div>
  );
}
