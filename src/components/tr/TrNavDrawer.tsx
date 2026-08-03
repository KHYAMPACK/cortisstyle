"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { TrSoftNavLink } from "@/components/tr/TrSoftNavLink";
import { TR_LOOKS_SECTION_ID } from "@/lib/tr/looks";
import {
  trBoutiquesPath,
  trFavoritesPath,
  trHomePath,
  trProductsPath,
} from "@/lib/tr/paths";

const NAV_ITEMS = [
  {
    href: `${trHomePath()}#${TR_LOOKS_SECTION_ID}`,
    label: "Kombinler",
  },
  { href: trProductsPath(), label: "Ürünler" },
  { href: trBoutiquesPath(), label: "Butikler" },
  { href: trFavoritesPath(), label: "Favoriler" },
  { href: "/contact", label: "Yardım" },
] as const;

interface TrNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

/** Full-bleed nav overlay — close via chrome X / Escape (no internal close control). */
export function TrNavDrawer({ open, onClose }: TrNavDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Ana menü"
          className="fixed inset-0 z-[105] flex flex-col bg-ice-floor"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <nav className="flex flex-1 overflow-y-auto px-5 pt-24 pb-16 md:px-10 md:pt-28">
            <ul className="w-full max-w-md space-y-0">
              {NAV_ITEMS.map((item, index) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.05 + index * 0.04,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <TrSoftNavLink
                    href={item.href}
                    onNavigate={onClose}
                    className="block border-b border-blueprint-border py-5 font-serif text-2xl tracking-[-0.02em] text-neutral-950 uppercase transition-colors hover:text-brand-primary md:text-3xl"
                  >
                    {item.label}
                  </TrSoftNavLink>
                </motion.li>
              ))}
            </ul>
          </nav>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
