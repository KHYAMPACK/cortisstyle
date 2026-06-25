"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/context/AuthContext";
import { getNotifyDeployPath } from "@/lib/launchGates";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

interface AuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
  description?: string;
  /** When false, hides magic-link entry (deploy gate). */
  allowSignUp?: boolean;
}

export function AuthPopup({
  isOpen,
  onClose,
  description = "Enter your curator email to receive a secure studio access link.",
  allowSignUp = true,
}: AuthPopupProps) {
  const { signInWithMagicLink, isAuthenticating, authError, clearAuthError } =
    useAuth();

  const [email, setEmail] = useState("");
  const [linkDispatched, setLinkDispatched] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setLinkDispatched(false);
      clearAuthError();
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, clearAuthError]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearAuthError();

    try {
      await signInWithMagicLink(email.trim());
      setLinkDispatched(true);
    } catch {
      // Error state is handled in AuthContext.
    }
  };

  if (!isMounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            key="auth-popup-backdrop"
            type="button"
            aria-label="Close sign in prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          />

          <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              key="auth-popup-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-popup-title"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={spring}
              className="pointer-events-auto w-[min(92vw,440px)] border border-blueprint-border bg-white p-8 shadow-2xl md:p-10"
            >
              <div className="mb-6 flex justify-center">
                <BrandLogo variant="onLight" className="h-20 w-auto md:h-24" />
              </div>

              <p className="text-meta mb-3 text-center text-[9px] tracking-[0.4em] uppercase">
                Premium Workspace Entry
              </p>

              <h2
                id="auth-popup-title"
                className="text-center font-serif text-2xl leading-tight text-neutral-950"
              >
                Request Studio Access
              </h2>

              <p className="mt-4 text-center text-sm leading-relaxed text-neutral-600">
                {description}
              </p>

              {allowSignUp ? (
                <form
                  onSubmit={handleSubmit}
                  className="mx-auto mt-8 flex w-full max-w-[420px] flex-col"
                >
                  <label className="sr-only" htmlFor="curator-email">
                    Curator email
                  </label>
                  <input
                    id="curator-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={linkDispatched || isAuthenticating}
                    className="w-full border border-jet-black bg-white px-4 py-4 text-center font-mono text-[11px] tracking-[0.18em] text-neutral-900 uppercase outline-none transition-colors placeholder:text-neutral-400 focus:border-jet-black disabled:opacity-60"
                    placeholder="ENTER YOUR CURATOR EMAIL..."
                  />

                  {linkDispatched ? (
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-5 text-center font-mono text-[10px] leading-relaxed tracking-[0.22em] text-neutral-800 uppercase"
                    >
                      [ ACCESS LINK SECURELY DISPATCHED TO YOUR INBOX ]
                    </motion.p>
                  ) : null}

                  {authError ? (
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 text-center text-[11px] leading-relaxed text-red-600"
                    >
                      {authError}
                    </motion.p>
                  ) : null}

                  {!linkDispatched ? (
                    <button
                      type="submit"
                      disabled={isAuthenticating}
                      className="mt-6 w-full border border-jet-black bg-jet-black px-5 py-4 text-center font-mono text-[10px] tracking-[0.32em] text-white uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      {isAuthenticating
                        ? "DISPATCHING..."
                        : "REQUEST ENTRY ACCESS"}
                    </button>
                  ) : null}
                </form>
              ) : (
                <Link
                  href={getNotifyDeployPath()}
                  onClick={onClose}
                  className="text-meta mt-8 block w-full text-center text-[10px] tracking-[0.25em] uppercase transition-colors hover:text-jet-black"
                >
                  Get notified when accounts open →
                </Link>
              )}

              <button
                type="button"
                onClick={onClose}
                className="text-meta mt-6 w-full text-[10px] tracking-[0.3em] uppercase transition-colors hover:text-jet-black"
              >
                Close
              </button>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
