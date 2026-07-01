import Link from "next/link";
import { siteLegal } from "@/lib/siteLegal";

const linkClass =
  "text-meta transition-colors hover:text-jet-black underline-offset-2 hover:underline";

const navRowClass =
  "flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] tracking-[0.22em] uppercase";

function NavDot() {
  return (
    <span className="text-neutral-300" aria-hidden>
      ·
    </span>
  );
}

interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className = "" }: SiteFooterProps) {
  return (
    <footer
      className={`border-t border-blueprint-border bg-ice-floor px-5 py-8 md:px-10 ${className}`}
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
        <p className="text-meta text-[9px] tracking-[0.35em] uppercase">
          © 2026 {siteLegal.siteName} — All rights reserved
        </p>

        <nav aria-label="Site and legal" className="w-full">
          {/* Mobile: About · Contact · PP — then Terms · Affiliate */}
          <div className="flex flex-col items-center gap-2 md:hidden">
            <div className={navRowClass}>
              <Link href="/about" className={linkClass}>
                About
              </Link>
              <NavDot />
              <Link href="/contact" className={linkClass}>
                Contact
              </Link>
              <NavDot />
              <Link href="/privacy" className={linkClass}>
                Privacy Policy
              </Link>
            </div>
            <div className={navRowClass}>
              <Link href="/terms" className={linkClass}>
                Terms of Use
              </Link>
              <NavDot />
              <Link href="/affiliate-disclosure" className={linkClass}>
                Affiliate Disclosure
              </Link>
            </div>
          </div>

          {/* Desktop: single centered row */}
          <div className={`${navRowClass} hidden md:flex`}>
            <Link href="/about" className={linkClass}>
              About
            </Link>
            <NavDot />
            <Link href="/contact" className={linkClass}>
              Contact
            </Link>
            <NavDot />
            <Link href="/privacy" className={linkClass}>
              Privacy Policy
            </Link>
            <NavDot />
            <Link href="/terms" className={linkClass}>
              Terms of Use
            </Link>
            <NavDot />
            <Link href="/affiliate-disclosure" className={linkClass}>
              Affiliate Disclosure
            </Link>
          </div>
        </nav>

        <p className="max-w-xl text-[11px] leading-relaxed text-meta">
          {siteLegal.siteName} may earn commission when you purchase through links on
          this site.
        </p>

        <p className="text-[11px] text-meta">
          Contact:{" "}
          <a href={`mailto:${siteLegal.contactEmail}`} className={linkClass}>
            {siteLegal.contactEmail}
          </a>
        </p>
      </div>
    </footer>
  );
}
