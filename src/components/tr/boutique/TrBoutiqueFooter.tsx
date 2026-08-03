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
        </div>
      </div>

      <p className="mx-auto mt-8 max-w-6xl text-center text-[10px] tracking-[0.12em] text-neutral-400">
        © {new Date().getFullYear()} {boutique.name}
      </p>
    </footer>
  );
}
