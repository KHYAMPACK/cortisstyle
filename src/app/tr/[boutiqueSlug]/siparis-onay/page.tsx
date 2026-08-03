import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveBoutiqueHomeLayout } from "@/lib/tr/boutiqueHome";
import { trBoutiquePath } from "@/lib/tr/paths";
import { safeGetPublicBoutique } from "@/lib/tr/publicData";

interface BoutiqueOrderConfirmationPageProps {
  params: Promise<{ boutiqueSlug: string }>;
  searchParams: Promise<{ demo?: string }>;
}

export async function generateMetadata({
  params,
}: BoutiqueOrderConfirmationPageProps): Promise<Metadata> {
  const { boutiqueSlug } = await params;
  const boutique = await safeGetPublicBoutique(boutiqueSlug);
  if (!boutique) return { title: "Sipariş onayı" };
  return {
    title: `Sipariş onayı — ${boutique.name}`,
  };
}

export default async function BoutiqueOrderConfirmationPage({
  params,
  searchParams,
}: BoutiqueOrderConfirmationPageProps) {
  const { boutiqueSlug } = await params;
  const query = await searchParams;
  const boutique = await safeGetPublicBoutique(boutiqueSlug);

  if (!boutique) notFound();

  if (
    resolveBoutiqueHomeLayout(boutiqueSlug, boutique.homeLayout) !== "editorial"
  ) {
    notFound();
  }

  const demo = query.demo === "1";
  const brandTitle =
    boutique.slug === "pervinsoysalbutik" ? "Pervin Soysal" : boutique.name;

  return (
    <div className="mx-auto max-w-xl px-5 py-12 text-center md:px-8 md:py-16">
      <p className="text-[10px] tracking-[0.22em] text-neutral-500 uppercase">
        Sipariş
      </p>
      <h1 className="mt-3 font-serif text-3xl tracking-tight text-neutral-950 md:text-4xl">
        {demo ? "Siparişiniz alındı" : "Sipariş onayı"}
      </h1>
      <p className="mt-4 text-[14px] leading-relaxed text-neutral-600">
        {demo
          ? `Teşekkürler — ${brandTitle} vitrininde demo sipariş tamamlandı. Gerçek ödeme alınmadı.`
          : `Teşekkürler — ${brandTitle} sipariş özeti burada görünecek.`}
      </p>
      <Link
        href={trBoutiquePath(boutique.slug)}
        className="btn-primary mt-10 inline-flex items-center justify-center px-6 py-4 text-[11px] tracking-[0.2em]"
      >
        Ana sayfaya dön
      </Link>
    </div>
  );
}
