import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Cortisstyle — Butiğiniz için online mağaza",
  description:
    "Ürün yönetimi, ödeme, kargo, müşteri desteği — hepsi hazır. Butiğinizin online mağazasını sizin için kuruyoruz.",
};

const WHATSAPP_NUMBER = "905515998156";
const PHONE_DISPLAY = "+90 551 599 81 56";
const EMAIL = "ekizmert3@gmail.com";

const CONTACT_LINKS = [
  {
    href: `mailto:${EMAIL}`,
    label: "E-posta",
    value: EMAIL,
    icon: Mail,
  },
  {
    href: `https://wa.me/${WHATSAPP_NUMBER}`,
    label: "WhatsApp",
    value: PHONE_DISPLAY,
    icon: MessageCircle,
  },
  {
    href: `tel:+${WHATSAPP_NUMBER}`,
    label: "Telefon",
    value: PHONE_DISPLAY,
    icon: Phone,
  },
];

export default function RootPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-[#0a0a0a] text-white">
      <header className="flex items-center justify-between px-6 py-6 md:px-10">
        <Image
          src="/brand/cortisstyle-logo-light.png"
          alt="Cortisstyle"
          width={36}
          height={36}
          priority
          unoptimized
          className="h-8 w-8 md:h-9 md:w-9"
        />
        <Link
          href="/tr/panel"
          className="text-[13px] tracking-wide text-white/50 transition-colors hover:text-white"
        >
          Mağaza sahibi misiniz? Panele giriş yapın →
        </Link>
      </header>

      <div className="flex flex-1 flex-col items-start justify-center px-6 py-16 md:px-10">
        <div className="max-w-2xl">
          <h1 className="font-serif text-4xl leading-[1.15] tracking-tight text-white sm:text-5xl md:text-6xl">
            Butiğinizin online mağazasını
            <br />
            sizin için kuruyoruz
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/60 sm:text-base">
            Ürün yönetimi, ödeme, kargo, müşteri desteği — hepsi hazır.
            Kurulumu ve yönetimi biz üstleniyoruz; siz satışa odaklanın.
          </p>

          <div className="mt-12">
            <p className="mb-4 text-[11px] tracking-[0.2em] text-white/40 uppercase">
              Bizimle iletişime geçin
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {CONTACT_LINKS.map(({ href, label, value, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/[0.03] px-5 py-3.5 transition-colors hover:border-white/30 hover:bg-white/[0.06]"
                >
                  <Icon className="h-4 w-4 text-white/70" strokeWidth={1.75} />
                  <span className="flex flex-col">
                    <span className="text-[11px] tracking-wide text-white/40">
                      {label}
                    </span>
                    <span className="text-[14px] text-white">{value}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="flex flex-col gap-2 px-6 pb-8 text-[12px] text-white/30 md:flex-row md:items-center md:justify-between md:px-10">
        <span>© {new Date().getFullYear()} Cortisstyle</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-white/60">
            Gizlilik
          </Link>
          <Link href="/terms" className="hover:text-white/60">
            Kullanım Şartları
          </Link>
        </div>
      </footer>
    </main>
  );
}
