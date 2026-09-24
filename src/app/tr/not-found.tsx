import Link from "next/link";

export default function TrNotFound() {
  return (
    <div className="px-5 py-16 md:px-10">
      <p className="text-meta text-[9px] tracking-[0.5em] uppercase">[ 404 ]</p>
      <h1 className="mt-3 font-serif text-3xl tracking-[-0.03em] text-neutral-950">
        Sayfa bulunamadı
      </h1>
      <p className="text-meta mt-4 max-w-md text-[12px] leading-relaxed">
        Aradığınız butik veya ürün mevcut değil.
      </p>
      <Link
        href="/"
        className="btn-primary mt-8 inline-flex items-center justify-center px-6 py-4 text-[11px] tracking-[0.2em]"
      >
        Ana sayfaya dön
      </Link>
    </div>
  );
}
