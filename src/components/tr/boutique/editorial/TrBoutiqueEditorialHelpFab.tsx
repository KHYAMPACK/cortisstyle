"use client";

import { MessageCircle } from "lucide-react";
import { useTrBoutiqueCommerceScope } from "@/components/tr/boutique/TrBoutiqueCommerceScope";
import { isMinimoraBoutique } from "@/lib/tr/boutique/minimora/isMinimoraBoutique";

/** Floating help assistant entry — opens the boutique help panel. */
export function TrBoutiqueEditorialHelpFab() {
  const { openPanel, activePanel, boutiqueName, boutiqueSlug } =
    useTrBoutiqueCommerceScope();
  const minimora = isMinimoraBoutique(boutiqueSlug);

  if (activePanel === "help") return null;

  return (
    <button
      type="button"
      data-atelier-chrome=""
      onClick={() => openPanel("help")}
      data-atelier-help-fab=""
      className={
        minimora
          ? "fixed right-4 z-40 flex items-center gap-2 rounded-full bg-[#3B71D8] px-4 py-3 text-white shadow-lg transition-colors hover:bg-[#2F5FB8] md:right-6"
          : "fixed right-4 z-40 flex items-center gap-2 bg-neutral-900 px-3.5 py-3 text-white shadow-lg transition-opacity hover:opacity-90 md:right-6"
      }
      aria-label={`${boutiqueName} yardım asistanı`}
    >
      <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
      <span
        className={
          minimora
            ? "text-[13px] font-semibold"
            : "text-[11px] tracking-[0.08em] uppercase"
        }
      >
        {minimora ? "Bize Yazın" : "Bize yazın"}
      </span>
    </button>
  );
}
