"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, MessageCircle } from "lucide-react";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { TrCartLink } from "@/components/tr/TrCartLink";
import { useTrBoutiqueCatalogOptional } from "@/components/tr/boutique/TrBoutiqueCatalogContext";
import { isTrCheckoutEnabled } from "@/lib/tr/platform";
import { trBoutiquePath } from "@/lib/tr/paths";
import {
  buildWhatsAppOrderUrl,
  instagramProfileUrl,
} from "@/lib/tr/whatsapp";
import { resolveBoutiqueThemeAccent } from "@/lib/tr/boutiqueBrand";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

interface TrBoutiqueHeaderProps {
  boutique: TrBoutiquePublic;
}

export function TrBoutiqueHeader({ boutique }: TrBoutiqueHeaderProps) {
  const accent = resolveBoutiqueThemeAccent(boutique);
  const checkoutEnabled = isTrCheckoutEnabled();
  const catalog = useTrBoutiqueCatalogOptional();

  const whatsappUrl = boutique.whatsappPhone
    ? buildWhatsAppOrderUrl(
        boutique.whatsappPhone,
        `Merhaba, ${boutique.name} mağazanızdan sipariş vermek istiyorum.`,
      )
    : null;
  const instagramUrl = boutique.instagramHandle
    ? instagramProfileUrl(boutique.instagramHandle)
    : null;

  const iconButtonClass =
    "inline-flex h-9 w-9 items-center justify-center border transition-opacity hover:opacity-90";

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-[#FFFBFC]/95 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 md:h-20 md:px-8">
        <div className="justify-self-start">
          {catalog ? (
            <button
              type="button"
              onClick={catalog.openDrawer}
              aria-label="Kategorileri aç"
              aria-expanded={catalog.isDrawerOpen}
              className={`${iconButtonClass} border-black/10 bg-white text-neutral-900 hover:border-black/20`}
            >
              <Menu className="h-4 w-4" strokeWidth={1.5} />
            </button>
          ) : (
            <span className="inline-block h-9 w-9" aria-hidden />
          )}
        </div>

        <div className="justify-self-center">
          <Link
            href={trBoutiquePath(boutique.slug)}
            className="flex items-center justify-center"
          >
            {boutique.logoUrl ? (
              <Image
                src={boutique.logoUrl}
                alt={boutique.name}
                width={48}
                height={48}
                className="h-10 w-10 object-contain md:h-12 md:w-12"
                unoptimized
              />
            ) : (
              <span
                className="font-serif text-xl tracking-tight md:text-2xl"
                style={{ color: accent }}
              >
                {boutique.name}
              </span>
            )}
          </Link>
        </div>

        <div className="flex items-center justify-end gap-2">
          {instagramUrl ? (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className={iconButtonClass}
              style={{
                backgroundColor: accent,
                borderColor: accent,
                color: "#ffffff",
              }}
            >
              <InstagramIcon className="h-4 w-4" strokeWidth={1.75} />
            </a>
          ) : null}

          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className={`${iconButtonClass} border-[#25D366] bg-[#25D366] text-white`}
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2} />
            </a>
          ) : null}

          {checkoutEnabled ? <TrCartLink /> : null}
        </div>
      </div>
    </header>
  );
}
