"use client";

import Link from "next/link";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { MinimoraLogo } from "@/components/tr/boutique/minimora/MinimoraLogo";
import { minimoraDisplay } from "@/components/tr/boutique/minimora/minimoraTheme";
import { TrPlatformCredit } from "@/components/tr/TrPlatformCredit";
import { TrIyzicoFooterPaymentBand } from "@/components/tr/TrIyzicoPaymentBadges";
import { resolveBoutiqueContactEmail } from "@/lib/tr/checkoutMode";
import { getEditorialContent } from "@/lib/tr/boutiqueHome";
import { trBoutiquePath } from "@/lib/tr/paths";
import { instagramProfileUrl } from "@/lib/tr/whatsapp";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

interface TrMinimoraFooterProps {
  boutique: TrBoutiquePublic;
}

export function TrMinimoraFooter({ boutique }: TrMinimoraFooterProps) {
  const { footer } = getEditorialContent(boutique);
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

  return (
    <footer className="mt-auto border-t border-black/5 bg-[#FDFBF7] text-[#3D3D3D]">
      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
          <Link href={trBoutiquePath(boutique.slug)} aria-label="Minimora">
            <MinimoraLogo className="h-16 w-auto md:h-20" />
          </Link>
          <div className="flex flex-wrap gap-3">
            {instagramUrl ? (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-full border border-black/10 px-5 py-2 text-[13px] font-medium text-[#3D3D3D] transition-colors hover:border-[#F3A575] hover:text-[#E08E5C]"
              >
                Instagram
              </a>
            ) : null}
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-full bg-[#F3A575] px-5 py-2 text-[13px] font-semibold text-[#3D3D3D] transition-colors hover:bg-[#E08E5C]"
              >
                WhatsApp
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className={`${minimoraDisplay} text-[16px] font-bold`}>
              İletişim
            </h3>
            <p className="mt-3 text-[13px] text-[#6B7280]">{footer.phone}</p>
            <p className="mt-1 text-[13px] text-[#6B7280]">{contactEmail}</p>
            {boutique.physicalAddress ? (
              <p className="mt-3 text-[13px] leading-relaxed text-[#6B7280]">
                {boutique.physicalAddress}
              </p>
            ) : null}
          </div>

          {footer.columns.map((column) => (
            <div key={column.title}>
              <h3 className={`${minimoraDisplay} text-[16px] font-bold`}>
                {column.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-[#6B7280] transition-colors hover:text-[#E08E5C]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className={`${minimoraDisplay} text-[16px] font-bold`}>
              Sosyal Medya
            </h3>
            <div className="mt-3 flex items-center gap-3">
              {instagramUrl ? (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 transition-opacity hover:opacity-70"
                >
                  <InstagramIcon className="h-4 w-4" strokeWidth={1.75} />
                </a>
              ) : null}
            </div>
            {boutique.shippingNote ? (
              <p className="mt-4 text-[12px] leading-relaxed text-[#6B7280]">
                {boutique.shippingNote}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-black/5 pt-6 text-[12px] text-[#9CA3AF] sm:flex-row sm:items-end sm:justify-between">
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
