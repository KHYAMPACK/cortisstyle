import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { TrCartLink } from "@/components/tr/TrCartLink";
import { isTrMarketplaceCartEnabled } from "@/lib/tr/platform";
import { TR_LOOKS_SECTION_ID } from "@/lib/tr/looks";
import { trHomePath } from "@/lib/tr/paths";

export async function TrHeader() {
  const cartEnabled = await isTrMarketplaceCartEnabled();

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-blueprint-border bg-ice-floor/95 backdrop-blur-md">
      <div className="grid h-20 w-full grid-cols-[1fr_auto_1fr] items-center px-5 md:px-10">
        <nav
          className="justify-self-start"
          aria-label="Türkiye ana menü"
        >
          <ul className="flex items-center gap-4 md:gap-6">
            <li>
              <Link
                href={`${trHomePath()}#${TR_LOOKS_SECTION_ID}`}
                className="text-meta text-[10px] tracking-[0.22em] uppercase transition-colors hover:text-jet-black"
              >
                Kombinler
              </Link>
            </li>
          </ul>
        </nav>

        <div className="justify-self-center">
          <Link href={trHomePath()} className="block">
            <BrandLogo variant="onLight" className="h-10 w-auto md:h-12" />
          </Link>
        </div>

        <div className="justify-self-end">
          {cartEnabled ? <TrCartLink /> : null}
        </div>
      </div>
    </header>
  );
}
