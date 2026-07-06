import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { TrCartLink } from "@/components/tr/TrCartLink";
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
  const whatsappUrl = boutique.whatsappPhone
    ? buildWhatsAppOrderUrl(
        boutique.whatsappPhone,
        `Merhaba, ${boutique.name} mağazanızdan sipariş vermek istiyorum.`,
      )
    : null;
  const instagramUrl = boutique.instagramHandle
    ? instagramProfileUrl(boutique.instagramHandle)
    : null;

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-[#FFFBFC]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 md:h-20 md:px-8">
        <Link
          href={trBoutiquePath(boutique.slug)}
          className="flex min-w-0 items-center gap-3"
        >
          {boutique.logoUrl ? (
            <Image
              src={boutique.logoUrl}
              alt={boutique.name}
              width={48}
              height={48}
              className="h-10 w-10 shrink-0 object-contain md:h-12 md:w-12"
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

        <div className="flex items-center gap-2 md:gap-3">
          {instagramUrl ? (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center px-3 text-[10px] tracking-[0.16em] uppercase transition-opacity hover:opacity-70"
              style={{ color: accent }}
            >
              Instagram
            </a>
          ) : null}

          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#25D366] px-3 text-[10px] tracking-[0.12em] text-white uppercase transition-opacity hover:opacity-90"
            >
              <MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          ) : null}

          {checkoutEnabled ? <TrCartLink /> : null}
        </div>
      </div>
    </header>
  );
}
