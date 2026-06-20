"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { HeaderIconNav } from "@/components/HeaderIconNav";
import { NavMenuDrawer } from "@/components/NavMenuDrawer";
import { useScrollDirection } from "@/hooks/useScrollDirection";

export function SiteHeader() {
  const showBrand = useScrollDirection();

  return (
    <header className="fixed top-0 left-0 z-50 w-full overflow-visible border-b border-neutral-100 bg-white/90 backdrop-blur-md">
      <div className="grid h-20 w-full grid-cols-[1fr_auto_1fr] items-center px-5 md:px-10">
        <div className="justify-self-start">
          <NavMenuDrawer />
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
              className="block whitespace-nowrap font-serif text-[13px] tracking-[0.42em] text-neutral-950 uppercase md:text-sm"
            >
              Cortis Style
            </Link>
          </motion.div>
        </div>

        <div className="justify-self-end overflow-visible">
          <HeaderIconNav />
        </div>
      </div>
    </header>
  );
}
