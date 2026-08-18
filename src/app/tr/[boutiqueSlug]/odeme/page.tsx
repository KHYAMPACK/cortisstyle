import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrCheckoutPageContent } from "@/components/tr/TrCheckoutPageContent";
import { resolveBoutiqueHomeLayout } from "@/lib/tr/boutiqueHome";
import { boutiqueOffersIyzicoCheckout } from "@/lib/tr/payments/registry";
import { safeGetPublicBoutique } from "@/lib/tr/publicData";

interface BoutiqueCheckoutPageProps {
  params: Promise<{ boutiqueSlug: string }>;
}

export async function generateMetadata({
  params,
}: BoutiqueCheckoutPageProps): Promise<Metadata> {
  const { boutiqueSlug } = await params;
  const boutique = await safeGetPublicBoutique(boutiqueSlug);
  if (!boutique) return { title: "Ödeme" };
  return {
    title: "Ödeme",
    description: `${boutique.name} sipariş ödeme sayfası.`,
  };
}

export default async function BoutiqueCheckoutPage({
  params,
}: BoutiqueCheckoutPageProps) {
  const { boutiqueSlug } = await params;
  const boutique = await safeGetPublicBoutique(boutiqueSlug);

  if (!boutique) notFound();

  if (
    resolveBoutiqueHomeLayout(boutiqueSlug, boutique.homeLayout) !== "editorial"
  ) {
    notFound();
  }

  return (
    <div className="px-5 py-8 md:px-10 md:py-10">
      <header className="mx-auto mb-8 max-w-3xl text-center">
        <p className="text-[10px] tracking-[0.22em] text-neutral-500 uppercase">
          Ödeme
        </p>
        <h1 className="mt-2 font-serif text-3xl tracking-tight text-neutral-950 md:text-4xl">
          Siparişi tamamla
        </h1>
        <p className="mt-3 text-[14px] text-neutral-600">
          Teslimat bilgilerinizi girin
          {boutiqueOffersIyzicoCheckout(boutique.slug)
            ? " ve kart ile ödeyin."
            : "."}
        </p>
      </header>
      <TrCheckoutPageContent boutiqueSlug={boutique.slug} />
    </div>
  );
}
