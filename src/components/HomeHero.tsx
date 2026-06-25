"use client";

import { ChevronDown } from "lucide-react";
import { SocialMediaLinks } from "@/components/SocialMediaLinks";

export const LOOKBOOK_COLLECTION_ID = "lookbook-collection";

export function HomeHero() {
  const scrollToCollection = () => {
    document.getElementById(LOOKBOOK_COLLECTION_ID)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section
      aria-label="Cortisstyle editorial hero"
      className="hero-editorial-gradient relative flex h-[100dvh] min-h-[100dvh] w-screen max-w-none flex-col justify-between overflow-hidden"
    >
      {/* Top-left social strip — mobile: flush under safe area; desktop: upper-left below header */}
      <SocialMediaLinks
        tone="hero"
        className="absolute top-[max(1.35rem,env(safe-area-inset-top))] left-[4.25rem] z-20 md:top-24 md:left-10"
      />

      <div className="relative z-20 flex flex-1 flex-col justify-end px-5 pb-36 pt-28 md:px-10 md:pb-40 md:pt-32">
        <div className="max-w-5xl">
          <p className="font-mono text-[10px] tracking-[0.45em] text-white/75 uppercase md:text-[11px]">
            SS26 Collection // Talent Personified
          </p>

          <h1 className="mt-5 font-serif text-[clamp(3rem,11vw,7.5rem)] leading-[0.88] font-light tracking-[0.06em] text-white uppercase md:mt-6">
            <span className="block">Cortis</span>
            <span className="block font-normal">Style</span>
          </h1>
        </div>
      </div>

      <div className="absolute right-0 bottom-0 left-0 z-20 flex justify-center pb-8 md:pb-10">
        <button
          type="button"
          onClick={scrollToCollection}
          aria-label="Scroll to lookbook collection"
          className="text-meta animate-bounce cursor-pointer rounded-full p-2 transition-colors hover:text-jet-black"
        >
          <ChevronDown strokeWidth={1.25} className="h-7 w-7" aria-hidden />
        </button>
      </div>
    </section>
  );
}
