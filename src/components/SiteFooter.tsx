import Link from "next/link";
import { siteLegal } from "@/lib/siteLegal";

const linkClass =
  "text-meta transition-colors hover:text-jet-black underline-offset-2 hover:underline";

interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className = "" }: SiteFooterProps) {
  return (
    <footer
      className={`border-t border-blueprint-border bg-ice-floor px-5 py-8 md:px-10 ${className}`}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <p className="text-meta text-[9px] tracking-[0.35em] uppercase">
          © 2026 {siteLegal.siteName} — All rights reserved
        </p>

        <nav
          aria-label="Legal"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] tracking-[0.22em] uppercase"
        >
          <Link href="/privacy" className={linkClass}>
            Privacy Policy
          </Link>
          <span className="text-neutral-300" aria-hidden>
            ·
          </span>
          <Link href="/terms" className={linkClass}>
            Terms of Use
          </Link>
          <span className="text-neutral-300" aria-hidden>
            ·
          </span>
          <Link href="/affiliate-disclosure" className={linkClass}>
            Affiliate Disclosure
          </Link>
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
