"use client";

import { MessageCircle } from "lucide-react";
import { useTrBoutiqueCommerceScope } from "@/components/tr/boutique/TrBoutiqueCommerceScope";

/** Floating help assistant entry — opens the boutique help panel. */
export function TrBoutiqueEditorialHelpFab() {
  const { openPanel, activePanel, boutiqueName } = useTrBoutiqueCommerceScope();

  if (activePanel === "help") return null;

  return (
    <button
      type="button"
      onClick={() => openPanel("help")}
      className="fixed right-4 bottom-4 z-40 flex items-center gap-2 bg-neutral-900 px-3.5 py-3 text-white shadow-lg transition-opacity hover:opacity-90 md:right-6 md:bottom-6"
      aria-label={`${boutiqueName} yardım asistanı`}
    >
      <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
      <span className="text-[11px] tracking-[0.08em] uppercase">
        Bize yazın
      </span>
    </button>
  );
}
