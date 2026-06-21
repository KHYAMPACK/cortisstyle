"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Lookbook" },
  { href: "/wardrobe", label: "Digital Wardrobe" },
];

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
      ? "h-[18px] w-[18px] text-white"
      : "h-[18px] w-[18px] text-neutral-900";

  return (
    <>
      <button
        type="button"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-60"
      >
        {isOpen ? (
          <X strokeWidth={1.5} className={iconClassName} />
        ) : (
          <Menu strokeWidth={1.5} className={iconClassName} />
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
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            />

            <motion.nav
              aria-label="Site navigation"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="fixed top-20 bottom-0 left-0 z-40 w-[min(18rem,80vw)] border-r border-blueprint-border surface-blueprint px-6 py-8"
            >
              <p className="text-meta mb-6 text-[9px] tracking-[0.45em] uppercase">
                Navigation
              </p>
              <ul className="space-y-4">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="font-serif text-xl tracking-[0.08em] text-neutral-900 uppercase transition-opacity hover:opacity-60"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
