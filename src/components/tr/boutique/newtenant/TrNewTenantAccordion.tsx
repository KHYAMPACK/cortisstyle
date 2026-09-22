"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

/**
 * PDP accordion — structural match for PopSockets' collapsible "How
 * to Use / What is Included / How to Swap / Details and Specs /
 * Compatibility Check" sections. Smooth open/close via the CSS grid
 * 0fr→1fr trick (animates height without measuring the DOM).
 */
interface TrNewTenantAccordionItemProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function TrNewTenantAccordionItem({
  title,
  defaultOpen = false,
  children,
}: TrNewTenantAccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#E5E5E5]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-4 text-left text-[14px] font-bold text-[#171717]"
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-5 text-[13px] leading-relaxed text-[#6B7280]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrNewTenantAccordion({ children }: { children: ReactNode }) {
  return <div className="mt-8">{children}</div>;
}
