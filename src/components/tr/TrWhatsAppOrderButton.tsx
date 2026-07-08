"use client";

import { MessageCircle } from "lucide-react";
import {
  buildProductOrderMessage,
  buildWhatsAppOrderUrl,
} from "@/lib/tr/whatsapp";
import type { TrProductStatus } from "@/types/tr-marketplace";

interface TrWhatsAppOrderButtonProps {
  phone: string;
  product: {
    title: string;
    priceKurus: number;
    size?: string | null;
    color?: string | null;
  };
  status: TrProductStatus;
  disabled?: boolean;
  className?: string;
}

export function TrWhatsAppOrderButton({
  phone,
  product,
  status,
  disabled = false,
  className = "",
}: TrWhatsAppOrderButtonProps) {
  if (status === "sold") {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex w-full cursor-not-allowed items-center justify-center border border-black/10 bg-neutral-100 px-6 py-4 text-[11px] tracking-[0.16em] text-neutral-500 uppercase ${className}`}
      >
        Satıldı
      </button>
    );
  }

  if (status === "hidden") {
    return null;
  }

  const message = buildProductOrderMessage(product);
  const href = buildWhatsAppOrderUrl(phone, message);

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex w-full cursor-not-allowed items-center justify-center gap-2 border border-black/10 bg-neutral-100 px-6 py-4 text-[11px] tracking-[0.16em] text-neutral-500 uppercase ${className}`}
      >
        <MessageCircle className="h-4 w-4" strokeWidth={2} />
        Beden seçin
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex w-full items-center justify-center gap-2 rounded-sm bg-[#25D366] px-6 py-4 text-[11px] tracking-[0.16em] text-white uppercase transition-opacity hover:opacity-90 ${className}`}
    >
      <MessageCircle className="h-4 w-4" strokeWidth={2} />
      WhatsApp ile sipariş ver
    </a>
  );
}
