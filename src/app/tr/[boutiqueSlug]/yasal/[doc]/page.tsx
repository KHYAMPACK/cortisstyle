import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTrLegalDoc,
  isTrLegalDocId,
  type TrLegalBoutiqueContext,
} from "@/lib/tr/legal/docs";
import { trBoutiquePath } from "@/lib/tr/paths";
import { safeGetPublicBoutique } from "@/lib/tr/publicData";

interface LegalPageProps {
  params: Promise<{ boutiqueSlug: string; doc: string }>;
}

export default async function BoutiqueLegalPage({ params }: LegalPageProps) {
  const { boutiqueSlug, doc } = await params;

  if (!isTrLegalDocId(doc)) {
    notFound();
  }

  const boutique = await safeGetPublicBoutique(boutiqueSlug);
  if (!boutique) {
    notFound();
  }

  const email =
    boutique.slug === "pervinsoysalbutik"
      ? "info@pervinsoysal.com"
      : "info@cortisstyle.com";

  const ctx: TrLegalBoutiqueContext = {
    name: boutique.name,
    legalName: boutique.legalName,
    slug: boutique.slug,
    physicalAddress: boutique.physicalAddress,
    whatsappPhone: boutique.whatsappPhone,
    email,
    exchangePolicy: boutique.exchangePolicy,
    customDomain: boutique.customDomain,
  };

  const legal = getTrLegalDoc(doc, ctx);

  return (
    <article className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-14">
      <Link
        href={trBoutiquePath(boutique.slug)}
        className="text-[11px] tracking-[0.14em] text-neutral-500 uppercase transition-opacity hover:opacity-70"
      >
        ← {boutique.name}
      </Link>
      <h1 className="mt-6 font-serif text-3xl tracking-tight text-neutral-950 md:text-4xl">
        {legal.title}
      </h1>
      <p className="mt-3 text-[14px] leading-relaxed text-neutral-600">
        {legal.summary}
      </p>
      <p className="mt-2 text-[11px] tracking-[0.08em] text-amber-800/90 uppercase">
        Taslak metin — yayına almadan önce avukat onayı gerekir.
      </p>

      <div className="mt-10 space-y-8">
        {legal.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-[13px] font-semibold tracking-[0.14em] uppercase">
              {section.heading}
            </h2>
            <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-neutral-700">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
