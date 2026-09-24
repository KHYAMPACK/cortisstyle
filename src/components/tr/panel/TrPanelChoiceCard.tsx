"use client";

import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";

/** A large link card for "pick one of these" screens (product type, fashion flow, …). */
export function TrPanelChoiceCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-xl border border-neutral-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-[border-color,box-shadow] duration-150 hover:border-[color:var(--panel-accent)] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)] motion-reduce:transition-none"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[color:var(--panel-accent-soft)] text-[color:var(--panel-accent-deep)]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold text-neutral-900">
          {title}
        </span>
        <span className="mt-1 block text-[14px] leading-relaxed text-neutral-600">
          {description}
        </span>
      </span>
      <ChevronRight
        className="mt-1 h-5 w-5 shrink-0 text-neutral-300 transition-colors duration-150 group-hover:text-[color:var(--panel-accent-deep)] motion-reduce:transition-none"
        strokeWidth={1.75}
        aria-hidden
      />
    </Link>
  );
}
