"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { getEditorialContent } from "@/lib/tr/boutiqueHome";
import { instagramProfileUrl } from "@/lib/tr/whatsapp";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

interface TrBoutiqueEditorialFooterProps {
  boutique: TrBoutiquePublic;
}

export function TrBoutiqueEditorialFooter({
  boutique,
}: TrBoutiqueEditorialFooterProps) {
  const content = getEditorialContent(boutique);  const { footer } = content;
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setDone(true);
    setEmail("");
  };

  const instagramUrl = boutique.instagramHandle
    ? instagramProfileUrl(boutique.instagramHandle)
    : null;

  return (
    <footer className="mt-auto bg-[#F5F2EA] text-neutral-900">
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
        <div className="border-b border-black/10 pb-8">
          <h2 className="text-[13px] font-semibold tracking-[0.18em] uppercase">
            {footer.newsletterTitle}
          </h2>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-neutral-600">
            {footer.newsletterBody}
          </p>
          {done ? (
            <p className="mt-4 text-[13px] text-neutral-700">
              Demo kayıt alındı — gerçek bülten gönderilmez.
            </p>
          ) : (
            <form
              onSubmit={onSubmit}
              className="mt-4 flex max-w-lg flex-col gap-2 sm:flex-row"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={footer.newsletterPlaceholder}
                className="min-w-0 flex-1 border border-neutral-300 bg-white px-3 py-2.5 text-[13px] outline-none focus:border-neutral-900"
              />
              <button
                type="submit"
                className="bg-neutral-900 px-5 py-2.5 text-[11px] tracking-[0.16em] text-white uppercase transition-opacity hover:opacity-80"
              >
                {footer.newsletterCta}
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-[12px] font-semibold tracking-[0.16em] uppercase">
              İletişim
            </h3>
            <p className="mt-3 text-[13px] text-neutral-700">{footer.phone}</p>
            <p className="mt-1 text-[13px] text-neutral-700">{footer.email}</p>
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

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-black/10 pt-6 text-[11px] text-neutral-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {boutique.name}</p>
        </div>
      </div>
    </footer>
  );
}
