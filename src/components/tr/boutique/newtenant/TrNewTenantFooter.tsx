"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { FacebookIcon } from "@/components/icons/FacebookIcon";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";
import { X } from "lucide-react";
import { TrPlatformCredit } from "@/components/tr/TrPlatformCredit";
import { TrIyzicoFooterPaymentBand } from "@/components/tr/TrIyzicoPaymentBadges";
import { resolveBoutiqueContactEmail } from "@/lib/tr/checkoutMode";
import { getEditorialContent } from "@/lib/tr/boutiqueHome";
import { trBoutiquePath } from "@/lib/tr/paths";
import { instagramProfileUrl } from "@/lib/tr/whatsapp";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

/**
 * PopSockets-style footer: dark newsletter block + social icons on
 * the left, legal/contact link columns on the right, bottom bar with
 * copyright + payment badges. Social links other than Instagram are
 * placeholders (`href="#"`) until real handles exist — TODO(social):
 * wire tiktokHandle / facebookUrl / xHandle / youtubeUrl once this
 * tenant has real accounts (would need new TrBoutiquePublic fields).
 * Newsletter form is UI-only for now — no subscribe endpoint yet.
 */
interface TrNewTenantFooterProps {
  boutique: TrBoutiquePublic;
}

export function TrNewTenantFooter({ boutique }: TrNewTenantFooterProps) {
  const { footer } = getEditorialContent(boutique);
  const contactEmail =
    footer.email?.includes("@")
      ? footer.email
      : resolveBoutiqueContactEmail(boutique);
  const instagramUrl = boutique.instagramHandle
    ? instagramProfileUrl(boutique.instagramHandle)
    : null;

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSent, setNewsletterSent] = useState(false);

  const handleNewsletterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newsletterEmail.trim()) return;
    // TODO(newsletter): wire to a real subscribe endpoint.
    setNewsletterSent(true);
  };

  const socialLinks = [
    {
      label: "Instagram",
      href: instagramUrl,
      Icon: InstagramIcon,
    },
    { label: "TikTok", href: "#", Icon: TikTokIcon },
    { label: "Facebook", href: "#", Icon: FacebookIcon },
    { label: "X", href: "#", Icon: X },
    { label: "YouTube", href: "#", Icon: YouTubeIcon },
  ];

  return (
    <footer className="mt-auto bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          {/* Newsletter + socials */}
          <div>
            <h2 className="text-[26px] font-bold leading-tight tracking-tight md:text-[30px]">
              İçeriklerimizi Kaçırma
            </h2>
            <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-white/60">
              Yeni tasarımlar ve kampanyalardan e-posta ile haberdar ol.
              İstediğin zaman abonelikten çıkabilirsin.
            </p>

            <form
              onSubmit={handleNewsletterSubmit}
              className="mt-6 flex max-w-sm gap-2"
            >
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => {
                  setNewsletterEmail(e.target.value);
                  setNewsletterSent(false);
                }}
                placeholder="E-posta adresin"
                className="w-full min-w-0 rounded-full border border-white/20 bg-transparent px-4 py-2.5 text-[13px] text-white outline-none placeholder:text-white/40 focus:border-white"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-[#B8FF3D] px-5 py-2.5 text-[13px] font-bold text-[#0A0A0A] transition-colors hover:bg-[#A8EF2D]"
              >
                Kayıt Ol
              </button>
            </form>
            {newsletterSent ? (
              <p className="mt-2 text-[12px] text-[#B8FF3D]">Teşekkürler, kayıt oldun!</p>
            ) : null}

            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href ?? "#"}
                  target={href && href !== "#" ? "_blank" : undefined}
                  rel={href && href !== "#" ? "noopener noreferrer" : undefined}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-white"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </a>
              ))}
            </div>
          </div>

          {/* İletişim */}
          <div>
            <h3 className="text-[14px] font-bold">İletişim</h3>
            <ul className="mt-4 space-y-2.5 text-[13px] text-white/60">
              {footer.phone ? <li>{footer.phone}</li> : null}
              {contactEmail ? <li>{contactEmail}</li> : null}
              {boutique.physicalAddress ? (
                <li className="leading-relaxed">{boutique.physicalAddress}</li>
              ) : null}
            </ul>
          </div>

          {/* Legal / policy columns, real data from editorial_content */}
          {footer.columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-[14px] font-bold">{column.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-white/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-[12px] text-white/40 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3">
            <Link
              href={trBoutiquePath(boutique.slug)}
              className="text-[13px] font-bold text-white"
            >
              {boutique.name}
            </Link>
            <p>
              © {new Date().getFullYear()} {boutique.name}
            </p>
            <TrIyzicoFooterPaymentBand variant="dark" />
            <TrPlatformCredit variant="dark" />
          </div>
        </div>
      </div>
    </footer>
  );
}
