"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthContext";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

interface AuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
  description?: string;
}

type AuthMode = "signin" | "signup";

export function AuthPopup({
  isOpen,
  onClose,
  onAuthSuccess,
  description = "Join Cortis Style to access your private archive.",
}: AuthPopupProps) {
  const {
    signInWithPassword,
    signUpWithPassword,
    isAuthenticating,
    authError,
    clearAuthError,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setMode("signin");
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
      if (mode === "signin") {
        await signInWithPassword(email.trim(), password);
      } else {
        const hasSession = await signUpWithPassword(email.trim(), password);
        if (!hasSession) return;
      }

      onAuthSuccess?.();
      onClose();
    } catch {
      // Error state is handled in AuthContext.
    }
  };

  const toggleMode = () => {
    clearAuthError();
    setMode((current) => (current === "signin" ? "signup" : "signin"));
  };

  if (!isMounted) return null;

  return createPortal(
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

          <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-popup-title"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={spring}
              className="pointer-events-auto w-[min(92vw,420px)] border border-blueprint-border surface-canvas-paper p-8 shadow-2xl"
            >
            <p className="text-meta mb-3 text-[9px] tracking-[0.4em] uppercase">
              Members Only
            </p>
            <h2
              id="auth-popup-title"
              className="font-serif text-2xl leading-tight text-neutral-950"
            >
              {mode === "signin" ? "Welcome Back" : "Join Cortis Style"}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600">
              {description}
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-2 block text-[9px] tracking-[0.35em] text-neutral-400 uppercase">
                  Email
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full border border-blueprint-border bg-canvas-paper px-3 py-3 text-sm text-neutral-900 outline-none transition-colors focus:border-blueprint-accent"
                  placeholder="you@studio.com"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[9px] tracking-[0.35em] text-neutral-400 uppercase">
                  Password
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full border border-blueprint-border bg-canvas-paper px-3 py-3 text-sm text-neutral-900 outline-none transition-colors focus:border-blueprint-accent"
                  placeholder="••••••••"
                />
              </label>

              {authError && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] leading-relaxed text-red-600"
                >
                  {authError}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={isAuthenticating}
                className="btn-primary w-full border border-jet-black px-5 py-3 font-mono text-[10px] tracking-[0.3em] disabled:opacity-60"
              >
                {isAuthenticating
                  ? "Processing…"
                  : mode === "signin"
                    ? "Sign In"
                    : "Create Premium Account"}
              </button>
            </form>

            <button
              type="button"
              onClick={toggleMode}
              className="text-meta mt-5 w-full text-[10px] tracking-[0.25em] uppercase transition-colors hover:text-jet-black"
            >
              {mode === "signin"
                ? "Create Premium Account"
                : "Already have an account? Sign In"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-meta mt-4 w-full text-[10px] tracking-[0.3em] uppercase transition-colors hover:text-jet-black"
            >
              Close
            </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
