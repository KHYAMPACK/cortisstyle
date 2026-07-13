import Link from "next/link";
import { siteLegal } from "@/lib/siteLegal";
import { trComingSoonPath, trHomePath } from "@/lib/tr/paths";

const linkClass =
  "text-meta transition-colors hover:text-jet-black underline-offset-2 hover:underline";

export function TrFooter() {
  return (
    <footer className="border-t border-blueprint-border bg-ice-floor px-5 py-8 md:px-10">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
        <p className="text-meta text-[9px] tracking-[0.35em] uppercase">
          © 2026 {siteLegal.siteName} Türkiye — Tüm hakları saklıdır
        </p>

        <nav
          aria-label="Türkiye pazarı"
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] tracking-[0.22em] uppercase"
        >
          <Link href={trHomePath()} className={linkClass}>
            Ana Sayfa
          </Link>
          <span className="text-neutral-300" aria-hidden>
            ·
          </span>
          <Link href={trComingSoonPath()} className={linkClass}>
            Hukuki Metinler
          </Link>
          <span className="text-neutral-300" aria-hidden>
            ·
          </span>
          <Link href="/contact" className={linkClass}>
            İletişim
          </Link>
        </nav>

        <p className="max-w-xl text-[11px] leading-relaxed text-meta">
          Butik caddesinden seçilmiş kombinler ve parçalar. Farklı satıcılardan
          tek sepet — online ödeme yakında.
        </p>

        <p className="text-[11px] text-meta">
          İletişim:{" "}
          <a href={`mailto:${siteLegal.contactEmail}`} className={linkClass}>
            {siteLegal.contactEmail}
          </a>
        </p>
      </div>
    </footer>
  );
}
