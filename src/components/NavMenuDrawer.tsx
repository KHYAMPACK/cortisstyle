"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArchiveCommunitySignOff } from "@/components/ArchiveCommunitySignOff";
import { WARDROBE_APP_PATH } from "@/lib/wardrobeGate";

const links = [
  { href: "/", label: "Lookbook" },
  { href: WARDROBE_APP_PATH, label: "Digital Wardrobe" },
];

const HEADER_OFFSET = "5rem";

export function NavMenuDrawer({ tone = "default" }: { tone?: "default" | "inverse" }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const iconClassName =
    tone === "inverse"
      ? "h-6 w-6 text-white"
      : "h-6 w-6 text-neutral-900";

  return (
    <>
      <button
        type="button"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="relative z-[60] -ml-1 flex h-14 w-14 items-center justify-center transition-opacity hover:opacity-60"
      >
        {isOpen ? (
          <X strokeWidth={1.25} className={iconClassName} />
        ) : (
          <Menu strokeWidth={1.25} className={iconClassName} />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsOpen(false)}
              className="fixed top-20 right-0 left-0 z-[38] h-[calc(100dvh-5rem)] bg-black/25 backdrop-blur-[2px]"
            />

            <motion.nav
              aria-label="Site navigation"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              style={{ height: `calc(100dvh - ${HEADER_OFFSET})` }}
              className="fixed top-20 left-0 z-[40] flex h-[calc(100dvh-5rem)] min-h-[calc(100dvh-5rem)] w-[min(22rem,88vw)] flex-col overflow-y-auto border-r border-blueprint-border bg-[#F4F6F8] shadow-2xl"
            >
              <div className="flex min-h-full flex-col">
                <div className="flex h-16 shrink-0 items-center border-b border-blueprint-border px-6 md:px-8">
                  <p className="text-meta text-[9px] tracking-[0.45em] uppercase">
                    Navigation
                  </p>
                </div>

                <div className="flex flex-1 flex-col px-6 py-10 md:px-8 md:py-12">
                  <ul className="space-y-6">
                    {links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className="font-serif text-2xl tracking-[0.08em] text-jet-black uppercase transition-opacity hover:opacity-60 md:text-3xl"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative z-10 shrink-0 border-t border-blueprint-border bg-[#F4F6F8] px-2">
                  <ArchiveCommunitySignOff
                    tone="light"
                    className="mt-0 pb-8 pt-6"
                  />
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
