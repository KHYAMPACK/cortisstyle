import Link from "next/link";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import { CADDE_CTA, CADDE_DISPLAY, CADDE_KICKER, caddeBracket } from "@/lib/tr/marketplace/caddeUi";
import { siteLegal } from "@/lib/siteLegal";
import { trComingSoonPath, trHomePath } from "@/lib/tr/paths";
import { CADDE_TRANSITION_WORD } from "@/lib/platform/caddeTransition";

const linkClass = `${CADDE_CTA} text-jet-black transition-colors hover:text-cadde-red`;

export function TrFooter() {
  return (
    <footer className="border-t border-black/10 bg-ice-floor px-5 py-12 md:px-10 md:py-16">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
        <p className={`${CADDE_DISPLAY} text-[2rem] md:text-[2.6rem]`}>
          {CADDE_TRANSITION_WORD}
        </p>
        <p className={CADDE_KICKER}>
          © 2026 {siteLegal.siteName} Türkiye
        </p>

        <nav
          aria-label="Türkiye pazarı"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          <TrSoftNavLink href={trHomePath()} className={linkClass}>
            {caddeBracket("Ana sayfa")}
          </TrSoftNavLink>
          <TrSoftNavLink href={trComingSoonPath()} className={linkClass}>
            {caddeBracket("Hukuki")}
          </TrSoftNavLink>
          <Link href="/contact" className={linkClass}>
            {caddeBracket("İletişim")}
          </Link>
        </nav>

        <p className="max-w-xl font-cadde-nav text-[12px] leading-relaxed tracking-[0.04em] text-neutral-500">
          Butik caddesinden seçilmiş kombinler ve parçalar. Farklı satıcılardan
          tek sepet — online ödeme yakında.
        </p>

        <p className="font-cadde-nav text-[11px] tracking-[0.06em] text-neutral-500">
          İletişim:{" "}
          <a
            href={`mailto:${siteLegal.contactEmail}`}
            className="text-jet-black underline-offset-2 transition-colors hover:text-cadde-red hover:underline"
          >
            {siteLegal.contactEmail}
          </a>
        </p>
      </div>
    </footer>
  );
}
