"use client";

import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";

const CARD_CLASS =
  "group flex w-full items-start gap-4 rounded-xl border border-neutral-200/80 bg-white p-5 text-left shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-[border-color,box-shadow] duration-150 hover:border-[color:var(--panel-accent)] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)] motion-reduce:transition-none";

/**
 * A large card for "pick one of these" screens (product kind, Tanımlamalar…): a link
 * with `href`, a button with `onClick`.
 */
export function TrPanelChoiceCard({
  href,
  onClick,
  icon,
  title,
  description,
}: {
  href?: string;
  onClick?: () => void;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  const body = (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[color:var(--panel-accent-soft)] text-[color:var(--panel-accent-deep)]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold text-neutral-900">{title}</span>
        <span className="mt-1 block text-[14px] leading-relaxed text-neutral-600">
          {description}
        </span>
      </span>
      <ChevronRight
        className="mt-1 h-5 w-5 shrink-0 text-neutral-300 transition-colors duration-150 group-hover:text-[color:var(--panel-accent-deep)] motion-reduce:transition-none"
        strokeWidth={1.75}
        aria-hidden
      />
    </>
  );
  return href ? (
    <Link href={href} className={CARD_CLASS}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={`${CARD_CLASS} cursor-pointer`}>
      {body}
    </button>
  );
}
