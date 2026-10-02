"use client";

import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";

const CARD_CLASS =
  "group flex w-full items-start gap-4 rounded-xl border border-neutral-200/80 bg-white p-5 text-left shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-[border-color,box-shadow] duration-150 hover:border-[color:var(--panel-accent)] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)] motion-reduce:transition-none";

/**
 * A large card for "pick one of these" screens (Ürün ekle, Tanımlamalar…): a link with
 * `href`, a button with `onClick`, or a greyed-out card with `disabled` and a `badge`
 * ("Yakında") saying why.
 */
export function TrPanelChoiceCard({
  href,
  onClick,
  icon,
  title,
  description,
  disabled = false,
  badge,
}: {
  href?: string;
  onClick?: () => void;
  icon: ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
  badge?: string;
}) {
  const body = (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[color:var(--panel-accent-soft)] text-[color:var(--panel-accent-deep)]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 text-[16px] font-semibold text-neutral-900">
          {title}
          {badge ? (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11.5px] font-medium text-neutral-600">
              {badge}
            </span>
          ) : null}
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
    </>
  );
  if (disabled) {
    return (
      <div aria-disabled className={`${CARD_CLASS} cursor-not-allowed opacity-60 hover:border-neutral-200/80 hover:shadow-none`}>
        {body}
      </div>
    );
  }
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
