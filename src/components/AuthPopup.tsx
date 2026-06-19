"use client";

import { AnimatePresence, motion } from "framer-motion";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

interface AuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthPopup({ isOpen, onClose }: AuthPopupProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close sign in prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-popup-title"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={spring}
            className="fixed top-1/2 left-1/2 z-[60] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 border border-neutral-200 bg-white p-8 shadow-2xl"
          >
            <p className="mb-3 text-[9px] tracking-[0.4em] text-neutral-400 uppercase">
              Members Only
            </p>
            <h2
              id="auth-popup-title"
              className="font-serif text-2xl leading-tight text-neutral-950"
            >
              Join Cortis Style
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600">
              Please create an account or sign in to save your favorite look
              archives.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="flex-1 border border-neutral-900 bg-neutral-900 px-5 py-3 text-[10px] tracking-[0.3em] text-white uppercase transition-colors hover:bg-white hover:text-neutral-900"
              >
                Sign In
              </button>
              <button
                type="button"
                className="flex-1 border border-neutral-900 bg-white px-5 py-3 text-[10px] tracking-[0.3em] text-neutral-900 uppercase transition-colors hover:bg-neutral-900 hover:text-white"
              >
                Sign Up
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full text-[10px] tracking-[0.3em] text-neutral-400 uppercase transition-colors hover:text-neutral-900"
            >
              Close
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
