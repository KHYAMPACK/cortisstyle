"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HeaderIconNav } from "@/components/HeaderIconNav";
import { NavMenuDrawer } from "@/components/NavMenuDrawer";
import { useScrollDirection } from "@/hooks/useScrollDirection";

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const showBrand = useScrollDirection();
  const [heroOverlay, setHeroOverlay] = useState(isHome);

  useEffect(() => {
    if (!isHome) {
      setHeroOverlay(false);
      return;
    }

    const syncHeroOverlay = () => {
      setHeroOverlay(window.scrollY < window.innerHeight * 0.72);
    };

    syncHeroOverlay();
    window.addEventListener("scroll", syncHeroOverlay, { passive: true });
    window.addEventListener("resize", syncHeroOverlay);

    return () => {
      window.removeEventListener("scroll", syncHeroOverlay);
      window.removeEventListener("resize", syncHeroOverlay);
    };
  }, [isHome]);

  const inverse = isHome && heroOverlay;

  return (
    <header
      className={`fixed top-0 left-0 z-50 w-full overflow-visible transition-colors duration-500 ${
        inverse
          ? "border-b border-white/10 bg-black/20 backdrop-blur-md"
          : "border-b border-blueprint-border bg-ice-floor/90 backdrop-blur-md"
      }`}
    >
      <div className="grid h-20 w-full grid-cols-[1fr_auto_1fr] items-center px-5 md:px-10">
        <div className="justify-self-start">
          <NavMenuDrawer tone={inverse ? "inverse" : "default"} />
        </div>

        <div className="pointer-events-none justify-self-center overflow-hidden">
          <motion.div
            className="pointer-events-auto"
            initial={false}
            animate={{
              y: showBrand ? "0%" : "-100%",
              opacity: showBrand ? 1 : 0,
            }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <Link
              href="/"
              className={`block whitespace-nowrap font-serif text-[13px] tracking-[0.42em] uppercase md:text-sm ${
                inverse ? "text-white" : "text-neutral-950"
              }`}
            >
              Cortis Style
            </Link>
          </motion.div>
        </div>

        <div className="justify-self-end overflow-visible">
          <HeaderIconNav tone={inverse ? "inverse" : "default"} />
        </div>
      </div>
    </header>
  );
}
