"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { MinimoraFadeIn } from "@/components/tr/boutique/minimora/MinimoraMotion";
import { minimoraHomeContent } from "@/components/tr/boutique/minimora/minimoraHomeContent";
import { minimoraDisplay } from "@/components/tr/boutique/minimora/minimoraTheme";

export function MinimoraHowItWorks() {
  const { howItWorks } = minimoraHomeContent;
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section
      id={howItWorks.id}
      className="scroll-mt-24 bg-[#FDFBF7] px-5 py-16 md:px-8 md:py-24"
    >
      <MinimoraFadeIn className="mx-auto max-w-3xl">
        <h2
          className={`${minimoraDisplay} text-center text-2xl font-bold text-[#3D3D3D] md:text-3xl lg:text-4xl`}
        >
          {howItWorks.title}
        </h2>
        <div className="mt-10 divide-y divide-black/10 border-y border-black/10">
          {howItWorks.steps.map((step, index) => {
            const open = openIndex === index;
            return (
              <div key={step.title}>
                <button
                  type="button"
                  className="flex min-h-14 w-full items-center justify-between gap-4 py-5 text-left"
                  aria-expanded={open}
                  onClick={() => setOpenIndex(open ? -1 : index)}
                >
                  <span
                    className={`${minimoraDisplay} text-[16px] font-bold text-[#3D3D3D] md:text-lg`}
                  >
                    {index + 1} · {step.title}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-[#3D3D3D] transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </button>
                {open ? (
                  <p className="pb-5 text-[15px] leading-relaxed text-[#6B7280]">
                    {step.body}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </MinimoraFadeIn>
    </section>
  );
}
