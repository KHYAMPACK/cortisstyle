"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AuthPopup } from "@/components/AuthPopup";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/context/AuthContext";
import type { Look } from "@/types/look";

interface PremiumArchivePaywallModalProps {
  isOpen: boolean;
  look: Look | null;
  onClose: () => void;
}

export function PremiumArchivePaywallModal({
  isOpen,
  look,
  onClose,
}: PremiumArchivePaywallModalProps) {
  const { isAuthenticated, isInitializing } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isMounted) return null;

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {isOpen ? (
            <motion.div
              key="premium-paywall"
              role="dialog"
              aria-modal="true"
              aria-labelledby="premium-paywall-title"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
              onClick={onClose}
            >
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-lg border border-neutral-800 bg-[#0D0D0D] px-6 py-10 text-white shadow-2xl sm:max-h-[90dvh] sm:overflow-y-auto md:px-10 md:py-12"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close premium access panel"
                  className="absolute top-4 right-4 font-mono text-[10px] tracking-[0.3em] text-neutral-500 uppercase transition-colors hover:text-white"
                >
                  Close
                </button>

                <BrandLogo variant="onDark" className="mx-auto mb-6 h-24 w-auto md:h-28" />

                <p className="font-mono text-[10px] tracking-[0.45em] text-neutral-500 uppercase">
                  Premium Matrix // Access Gate
                </p>

                <h2
                  id="premium-paywall-title"
                  className="mt-4 font-serif text-[clamp(1.5rem,5vw,2.25rem)] leading-none tracking-[0.14em] uppercase"
                >
                  ARCHIVE SUBSCRIBER ACCESS
                </h2>

                <p className="mt-5 max-w-md text-sm leading-relaxed text-neutral-400">
                  Archive Subscriber access is en route. This look will unlock the
                  full blueprint matrix — buy links, layout coordinates, and season
                  drops — when membership goes live.
                </p>

                {look ? (
                  <p className="text-meta mt-4 text-[10px] tracking-[0.25em] text-neutral-500 uppercase">
                    Locked look: {look.title}
                  </p>
                ) : null}

                {!isInitializing && !isAuthenticated ? (
                  <div className="mx-auto mt-8 flex w-full max-w-[420px] flex-col items-center">
                    <p className="mb-4 w-full text-center font-mono text-[9px] tracking-[0.35em] text-neutral-500 uppercase">
                      Sign in to join the archive
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAuthPopup(true)}
                      className="w-full border border-white px-6 py-4 font-mono text-[10px] tracking-[0.32em] text-white uppercase transition-colors hover:bg-white hover:text-[#0D0D0D]"
                    >
                      LOG IN
                    </button>
                  </div>
                ) : null}
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}

      <AuthPopup
        isOpen={showAuthPopup}
        onClose={() => setShowAuthPopup(false)}
        onAuthSuccess={() => setShowAuthPopup(false)}
        description="Sign in or create your curator profile to join the archive."
        allowSignUp
      />
    </>
  );
}
