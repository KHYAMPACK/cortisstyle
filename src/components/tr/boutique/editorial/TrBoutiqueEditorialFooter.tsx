"use client";

import Image from "next/image";
import Link from "next/link";
import { useStorefrontTaxonomy } from "@/components/tr/boutique/TrBoutiqueTaxonomy";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import {
  resolveBoutiqueBrandLabel,
  resolveBoutiqueLogoUrl,
} from "@/lib/tr/boutiqueBrand";
import { resolveBoutiqueContactEmail } from "@/lib/tr/checkoutMode";
import {
  getEditorialContent,
  isAtelierEditorialSkin,
} from "@/lib/tr/boutiqueHome";
import { trBoutiquePath } from "@/lib/tr/paths";
import { instagramProfileUrl } from "@/lib/tr/whatsapp";
import { TrPlatformCredit } from "@/components/tr/TrPlatformCredit";
import {
  TrIyzicoFooterPaymentBand,
} from "@/components/tr/TrIyzicoPaymentBadges";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

interface TrBoutiqueEditorialFooterProps {
  boutique: TrBoutiquePublic;
}

export function TrBoutiqueEditorialFooter({
  boutique,
}: TrBoutiqueEditorialFooterProps) {
  const content = getEditorialContent(boutique, useStorefrontTaxonomy());
  const { footer } = content;
  const logoUrl = resolveBoutiqueLogoUrl(boutique);
  const brandTitle = resolveBoutiqueBrandLabel(boutique.slug, boutique.name);
  const atelier = isAtelierEditorialSkin(boutique.slug);
  const contactEmail =
    footer.email?.includes("@")
      ? footer.email
      : resolveBoutiqueContactEmail(boutique);

  const instagramUrl = boutique.instagramHandle
    ? instagramProfileUrl(boutique.instagramHandle)
    : null;

  const whatsappDigits = boutique.whatsappPhone?.replace(/\D/g, "") ?? "";
  const whatsappUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits}`
    : null;

  if (atelier) {
    return (
      <footer className="mt-auto bg-neutral-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-16">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            <div>
              <h2 className="text-[13px] font-semibold tracking-[0.14em] uppercase">
                {footer.newsletterTitle || "Haberdar olun"}
              </h2>
              <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-white/65">
                {footer.newsletterBody ||
                  "Yeni sezon ve kampanyalar için Instagram’dan takip edin veya WhatsApp’tan yazın."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {instagramUrl ? (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center border border-white/35 px-4 py-2.5 text-[11px] tracking-[0.18em] uppercase transition-colors hover:bg-white hover:text-neutral-950"
                  >
                    Instagram
                  </a>
                ) : null}
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center border border-white/35 px-4 py-2.5 text-[11px] tracking-[0.18em] uppercase transition-colors hover:bg-white hover:text-neutral-950"
                  >
                    WhatsApp
                  </a>
                ) : null}
              </div>
            </div>

            <div>
              <h3 className="text-[12px] font-semibold tracking-[0.16em] uppercase">
                İletişim
              </h3>
              <p className="mt-3 text-[13px] text-white/75">{footer.phone}</p>
              <p className="mt-1 text-[13px] text-white/75">{contactEmail}</p>
              {boutique.physicalAddress ? (
                <p className="mt-3 text-[12px] leading-relaxed text-white/55">
                  {boutique.physicalAddress}
                </p>
              ) : null}
            </div>

            {footer.columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-[12px] font-semibold tracking-[0.16em] uppercase">
                  {column.title}
                </h3>
                <ul className="mt-3 space-y-2">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[13px] text-white/65 transition-opacity hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-6 border-t border-white/15 pt-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                {instagramUrl ? (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="inline-flex h-9 w-9 items-center justify-center border border-white/25 transition-opacity hover:opacity-70"
                  >
                    <InstagramIcon className="h-4 w-4" strokeWidth={1.75} />
                  </a>
                ) : null}
                <p className="text-[11px] text-white/45">
                  © {new Date().getFullYear()} {boutique.name}
                </p>
              </div>
              <TrIyzicoFooterPaymentBand variant="dark" />
              <TrPlatformCredit variant="dark" />
            </div>
            <Link
              href={trBoutiquePath(boutique.slug)}
              className="font-serif text-[clamp(2.6rem,11vw,4.75rem)] leading-none font-light tracking-[0.04em] text-white/88"
            >
              {brandTitle}
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto bg-[#F5F2EA] text-neutral-900">
      <div className="flex flex-col items-center border-b border-black/10 px-5 py-10 md:hidden">
        <Link
          href={trBoutiquePath(boutique.slug)}
          className="flex flex-col items-center gap-3"
          aria-label={boutique.name}
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={boutique.name}
              width={200}
              height={80}
              className="h-14 w-auto object-contain"
              unoptimized
            />
          ) : (
            <span className="font-serif text-2xl tracking-[0.18em] uppercase">
              {brandTitle}
            </span>
          )}
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
        <div className="border-b border-black/10 pb-8">
          <h2 className="text-[13px] font-semibold tracking-[0.18em] uppercase">
            Haberdar olun
          </h2>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-neutral-600">
            Yeni sezon ve kampanyalar için Instagram’dan takip edin
            {whatsappUrl ? " veya WhatsApp’tan yazın" : ""}.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {instagramUrl ? (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-neutral-900 bg-neutral-900 px-5 py-2.5 text-[11px] tracking-[0.16em] text-white uppercase"
              >
                Instagram
              </a>
            ) : null}
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center border border-neutral-900 px-5 py-2.5 text-[11px] tracking-[0.16em] text-neutral-900 uppercase"
              >
                WhatsApp
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-[12px] font-semibold tracking-[0.16em] uppercase">
              İletişim
            </h3>
            <p className="mt-3 text-[13px] text-neutral-700">{footer.phone}</p>
            <p className="mt-1 text-[13px] text-neutral-700">{contactEmail}</p>
            {boutique.physicalAddress ? (
              <p className="mt-3 text-[12px] leading-relaxed text-neutral-600">
                {boutique.physicalAddress}
              </p>
            ) : null}
          </div>

          {footer.columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-[12px] font-semibold tracking-[0.16em] uppercase">
                {column.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-neutral-600 transition-opacity hover:opacity-70"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-[12px] font-semibold tracking-[0.16em] uppercase">
              Sosyal Medya
            </h3>
            <div className="mt-3 flex items-center gap-3">
              {instagramUrl ? (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="inline-flex h-9 w-9 items-center justify-center border border-black/15 transition-opacity hover:opacity-70"
                >
                  <InstagramIcon className="h-4 w-4" strokeWidth={1.75} />
                </a>
              ) : null}
            </div>
            {boutique.shippingNote ? (
              <p className="mt-4 text-[12px] leading-relaxed text-neutral-600">
                {boutique.shippingNote}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-black/10 pt-6 text-[11px] text-neutral-500 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3">
            <p>
              © {new Date().getFullYear()} {boutique.name}
            </p>
            <TrIyzicoFooterPaymentBand variant="light" />
            <TrPlatformCredit variant="light" />
          </div>
        </div>
      </div>
    </footer>
  );
}
