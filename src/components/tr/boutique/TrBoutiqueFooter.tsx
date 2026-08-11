import Link from "next/link";
import { TrPlatformCredit } from "@/components/tr/TrPlatformCredit";
import { TrIyzicoFooterPaymentBand } from "@/components/tr/TrIyzicoPaymentBadges";
import { trBoutiqueLegalPath } from "@/lib/tr/paths";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

interface TrBoutiqueFooterProps {
  boutique: TrBoutiquePublic;
}

export function TrBoutiqueFooter({ boutique }: TrBoutiqueFooterProps) {
  return (
    <footer className="mt-auto border-t border-black/5 px-5 py-10 md:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
        <div>
          <h2 className="font-serif text-lg tracking-tight text-neutral-900">
            {boutique.name}
          </h2>
          {boutique.physicalAddress ? (
            <p className="mt-3 text-[12px] leading-relaxed text-neutral-600">
              {boutique.physicalAddress}
            </p>
          ) : null}
          <ul className="mt-4 space-y-1 text-[12px] text-neutral-600">
            <li>
              <Link
                href={trBoutiqueLegalPath(boutique.slug, "kunye")}
                className="underline underline-offset-2 hover:opacity-70"
              >
                Hakkımızda
              </Link>
            </li>
            <li>
              <Link
                href={trBoutiqueLegalPath(boutique.slug, "gizlilik")}
                className="underline underline-offset-2 hover:opacity-70"
              >
                Gizlilik Sözleşmesi
              </Link>
            </li>
            <li>
              <Link
                href={trBoutiqueLegalPath(boutique.slug, "mesafeli-satis")}
                className="underline underline-offset-2 hover:opacity-70"
              >
                Mesafeli Satış Sözleşmesi
              </Link>
            </li>
            <li>
              <Link
                href={trBoutiqueLegalPath(boutique.slug, "iade")}
                className="underline underline-offset-2 hover:opacity-70"
              >
                Teslimat ve İade / Cayma
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-2 text-[12px] leading-relaxed text-neutral-600">
          {boutique.exchangePolicy ? (
            <p>
              <span className="font-medium text-neutral-800">Değişim / iade:</span>{" "}
              {boutique.exchangePolicy}
            </p>
          ) : null}
          {boutique.shippingNote ? (
            <p>
              <span className="font-medium text-neutral-800">Kargo:</span>{" "}
              {boutique.shippingNote}
            </p>
          ) : null}
          <TrIyzicoFooterPaymentBand variant="light" className="pt-4" />
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-6xl flex-col items-center gap-3">
        <p className="text-center text-[10px] tracking-[0.12em] text-neutral-400">
          © {new Date().getFullYear()} {boutique.name}
        </p>
        <TrPlatformCredit variant="light" />
      </div>
    </footer>
  );
}
