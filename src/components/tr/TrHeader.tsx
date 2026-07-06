import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { TrCartLink } from "@/components/tr/TrCartLink";
import { isTrCheckoutEnabled } from "@/lib/tr/platform";
import { trHomePath } from "@/lib/tr/paths";

export function TrHeader() {
  const checkoutEnabled = isTrCheckoutEnabled();

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-blueprint-border bg-ice-floor/95 backdrop-blur-md">
      <div className="grid h-20 w-full grid-cols-[1fr_auto_1fr] items-center px-5 md:px-10">
        <div className="justify-self-start">
          <Link
            href={trHomePath()}
            className="text-meta text-[10px] tracking-[0.22em] uppercase transition-colors hover:text-jet-black"
          >
            Butikler
          </Link>
        </div>

        <div className="justify-self-center">
          <Link href={trHomePath()} className="block">
            <BrandLogo variant="onLight" className="h-10 w-auto md:h-12" />
          </Link>
        </div>

        <div className="justify-self-end">
          {checkoutEnabled ? <TrCartLink /> : null}
        </div>
      </div>
    </header>
  );
}
