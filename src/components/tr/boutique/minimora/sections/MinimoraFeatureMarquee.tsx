"use client";

import { Package, Pencil, Shield, Truck } from "lucide-react";
import { minimoraHomeContent } from "@/components/tr/boutique/minimora/minimoraHomeContent";

const MARQUEE_ICONS = {
  craft: Pencil,
  safe: Shield,
  ship: Truck,
  unique: Package,
} as const;

export function MinimoraFeatureMarquee() {
  const items = [
    ...minimoraHomeContent.marquee,
    ...minimoraHomeContent.marquee,
    ...minimoraHomeContent.marquee,
  ];

  return (
    <div className="overflow-hidden border-y border-black/5 bg-[#F4F2EE] py-3.5">
      <div className="flex animate-[minimora-marquee_28s_linear_infinite] gap-12 whitespace-nowrap">
        {items.map((item, index) => {
          const Icon =
            MARQUEE_ICONS[item.id as keyof typeof MARQUEE_ICONS] ?? Pencil;
          return (
            <span
              key={`${item.id}-${index}`}
              className="inline-flex items-center gap-2.5 text-[13px] font-medium text-[#4B5563]"
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              {item.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
