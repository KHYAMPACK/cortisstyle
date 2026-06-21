"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef } from "react";

export const LOOKBOOK_COLLECTION_ID = "lookbook-collection";

const HERO_VIDEO_SRC = "/videos/raw-analog-distortion.mp4";
/** Fallback if the upload kept its original filename. */
const HERO_VIDEO_FALLBACK_SRC =
  "/videos/omega%20experimental%20-%20CRT%20by%20andrea%20chapo.mp4";

export function HomeHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.setAttribute("muted", "");

    const attemptPlay = () => {
      void video.play().catch(() => {
        // Autoplay can be blocked until user gesture; retry once intro overlay clears.
      });
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      attemptPlay();
    } else {
      video.addEventListener("loadeddata", attemptPlay, { once: true });
    }

    const onIntroDone = () => attemptPlay();
    window.addEventListener("intro-loader-complete", onIntroDone);

    return () => {
      video.removeEventListener("loadeddata", attemptPlay);
      window.removeEventListener("intro-loader-complete", onIntroDone);
    };
  }, []);

  const scrollToCollection = () => {
    document.getElementById(LOOKBOOK_COLLECTION_ID)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section
      aria-label="Cortis Style editorial hero"
      className="relative flex h-[100dvh] min-h-[100dvh] w-screen max-w-none flex-col justify-between overflow-hidden bg-[#0D0D0D]"
    >
      <div aria-hidden className="absolute inset-0 z-0 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="pointer-events-none absolute top-1/2 left-1/2 z-0 h-auto w-auto min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 opacity-70 object-cover"
        >
          <source src={HERO_VIDEO_SRC} type="video/mp4" />
          <source src={HERO_VIDEO_FALLBACK_SRC} type="video/mp4" />
        </video>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/30 via-transparent to-[#F4F6F8]"
      />

      <div aria-hidden className="hero-film-grain pointer-events-none absolute inset-0 z-[11]" />

      <div className="relative z-20 flex flex-1 flex-col justify-end px-5 pb-36 pt-28 md:px-10 md:pb-40 md:pt-32">
        <div className="max-w-5xl">
          <p className="font-mono text-[10px] tracking-[0.45em] text-white/75 uppercase md:text-[11px]">
            SS26 Collection // Talent Personified
          </p>
          <h1 className="mt-5 font-serif text-[clamp(3.25rem,12vw,8rem)] leading-[0.9] font-light tracking-[-0.04em] text-white uppercase">
            Cortis
            <span className="block font-normal">Style</span>
          </h1>
        </div>
      </div>

      <div className="absolute right-0 bottom-0 left-0 z-20 flex justify-center pb-8 md:pb-10">
        <button
          type="button"
          onClick={scrollToCollection}
          aria-label="Scroll to lookbook collection"
          className="animate-bounce cursor-pointer rounded-full p-2 text-white/70 transition-colors hover:text-white"
        >
          <ChevronDown strokeWidth={1.25} className="h-7 w-7" aria-hidden />
        </button>
      </div>
    </section>
  );
}
