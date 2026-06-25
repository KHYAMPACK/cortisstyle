"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/context/AuthContext";
import { getNotifyDeployPath } from "@/lib/launchGates";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

const fieldTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
};

const monoInputClass =
  "w-full border border-jet-black bg-white px-4 py-4 text-center font-mono text-[11px] tracking-[0.12em] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-jet-black disabled:opacity-60";

const primaryButtonClass =
  "mt-6 w-full border border-jet-black bg-jet-black px-5 py-4 text-center font-mono text-[10px] tracking-[0.32em] text-white uppercase transition-opacity hover:opacity-90 disabled:opacity-60";

interface AuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
  description?: string;
  /** When false, hides sign-up entry (deploy gate). */
  allowSignUp?: boolean;
}

function ResetAnchor({ onReset }: { onReset: () => void }) {
  return (
    <button
      type="button"
      onClick={onReset}
      className="text-meta mt-4 w-full text-[10px] tracking-[0.22em] uppercase transition-colors hover:text-jet-black"
    >
      [ GO BACK // RESET FORM ]
    </button>
  );
}

export function AuthPopup({
  isOpen,
  onClose,
  onAuthSuccess,
  description = "Enter your email to sign in or create your curator archive profile.",
  allowSignUp = true,
}: AuthPopupProps) {
  const router = useRouter();
  const {
    resolveEmailAuthRoute,
    signInWithPassword,
    verifySignUpOtp,
    setAccountPassword,
    isAuthenticating,
    authError,
    clearAuthError,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [isTokenSent, setIsTokenSent] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  const resetForm = () => {
    clearAuthError();
    setPassword("");
    setOtpToken("");
    setNewPassword("");
    setIsLoginMode(false);
    setIsTokenSent(false);
    setIsSettingPassword(false);
  };

  const completeAuth = () => {
    onAuthSuccess?.();
    onClose();
  };

  const enterWardrobe = () => {
    completeAuth();
    router.push("/wardrobe");
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      resetForm();
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, clearAuthError]);

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearAuthError();

    try {
      const route = await resolveEmailAuthRoute(normalizedEmail);

      if (route === "login") {
        setIsLoginMode(true);
        return;
      }

      setIsTokenSent(true);
    } catch {
      // Error state is handled in AuthContext.
    }
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearAuthError();

    try {
      await signInWithPassword(normalizedEmail, password);
      enterWardrobe();
    } catch {
      // Error state is handled in AuthContext.
    }
  };

  const handleOtpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearAuthError();

    try {
      await verifySignUpOtp(normalizedEmail, otpToken.trim());
      setIsSettingPassword(true);
    } catch {
      // Error state is handled in AuthContext.
    }
  };

  const handlePasswordSetupSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearAuthError();

    try {
      await setAccountPassword(newPassword);
      enterWardrobe();
    } catch {
      // Error state is handled in AuthContext.
    }
  };

  const title = isSettingPassword
    ? "Secure Your Archive"
    : isTokenSent
      ? "Verify Identity"
      : isLoginMode
        ? "Welcome Back"
        : "Join the Community";

  const subtitle = isSettingPassword
    ? "Create a permanent password for future sign-ins."
    : isTokenSent
      ? `Enter the 6-digit token we sent to ${normalizedEmail}.`
      : isLoginMode
        ? `Sign in to ${normalizedEmail} with your curator password.`
        : description;

  const activePhase = isSettingPassword
    ? "set-password"
    : isTokenSent
      ? "otp"
      : isLoginMode
        ? "login"
        : "email";

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
                Community Archive
              </p>

              <h2
                id="auth-popup-title"
                className="text-center font-serif text-2xl leading-tight text-neutral-950"
              >
                {title}
              </h2>

              <p className="mt-4 text-center text-sm leading-relaxed text-neutral-600">
                {subtitle}
              </p>

              {allowSignUp ? (
                <AnimatePresence mode="wait">
                  {activePhase === "email" ? (
                    <motion.form
                      key="email-phase"
                      {...fieldTransition}
                      onSubmit={handleEmailSubmit}
                      className="mx-auto mt-8 flex w-full max-w-[420px] flex-col"
                    >
                      <label className="sr-only" htmlFor="community-email">
                        Email address
                      </label>
                      <input
                        id="community-email"
                        type="email"
                        required
                        autoComplete="email"
                        spellCheck={false}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        disabled={isAuthenticating}
                        className={monoInputClass}
                        placeholder="Enter your email..."
                      />

                      <button
                        type="submit"
                        disabled={isAuthenticating}
                        className={primaryButtonClass}
                      >
                        {isAuthenticating ? "CHECKING..." : "CONTINUE"}
                      </button>
                    </motion.form>
                  ) : null}

                  {activePhase === "login" ? (
                    <motion.form
                      key="login-phase"
                      {...fieldTransition}
                      onSubmit={handleLoginSubmit}
                      className="mx-auto mt-8 flex w-full max-w-[420px] flex-col"
                    >
                      <label className="sr-only" htmlFor="community-password">
                        Password
                      </label>
                      <input
                        id="community-password"
                        type="password"
                        required
                        minLength={6}
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        disabled={isAuthenticating}
                        className={monoInputClass}
                        placeholder="ENTER YOUR PASSWORD..."
                      />

                      <button
                        type="submit"
                        disabled={isAuthenticating || password.length < 6}
                        className={primaryButtonClass}
                      >
                        {isAuthenticating ? "SIGNING IN..." : "SIGN IN"}
                      </button>

                      <ResetAnchor
                        onReset={() => {
                          resetForm();
                          setEmail("");
                        }}
                      />
                    </motion.form>
                  ) : null}

                  {activePhase === "otp" ? (
                    <motion.form
                      key="otp-phase"
                      {...fieldTransition}
                      onSubmit={handleOtpSubmit}
                      className="mx-auto mt-8 flex w-full max-w-[420px] flex-col"
                    >
                      <motion.p
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 text-center font-mono text-[10px] leading-relaxed tracking-[0.22em] text-neutral-800 uppercase"
                      >
                        [ 6-DIGIT ACCESS TOKEN DISPATCHED TO YOUR INBOX ]
                      </motion.p>

                      <label className="sr-only" htmlFor="community-otp">
                        Six digit access token
                      </label>
                      <input
                        id="community-otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        required
                        value={otpToken}
                        onChange={(event) =>
                          setOtpToken(
                            event.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                        disabled={isAuthenticating}
                        className="w-full border border-jet-black bg-white px-4 py-5 text-center font-mono text-[clamp(1.1rem,5vw,1.45rem)] tracking-[0.55em] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 placeholder:tracking-[0.22em] focus:border-jet-black disabled:opacity-60"
                        placeholder="ENTER 6-DIGIT TOKEN..."
                      />

                      <button
                        type="submit"
                        disabled={isAuthenticating || otpToken.length !== 6}
                        className={primaryButtonClass}
                      >
                        {isAuthenticating ? "VERIFYING..." : "VERIFY IDENTITY ACCESS"}
                      </button>

                      <ResetAnchor
                        onReset={() => {
                          resetForm();
                          setEmail("");
                        }}
                      />
                    </motion.form>
                  ) : null}

                  {activePhase === "set-password" ? (
                    <motion.form
                      key="set-password-phase"
                      {...fieldTransition}
                      onSubmit={handlePasswordSetupSubmit}
                      className="mx-auto mt-8 flex w-full max-w-[420px] flex-col"
                    >
                      <label className="sr-only" htmlFor="community-new-password">
                        Curator password
                      </label>
                      <input
                        id="community-new-password"
                        type="password"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        disabled={isAuthenticating}
                        className={monoInputClass}
                        placeholder="CREATE YOUR CURATOR PASSWORD..."
                      />

                      <button
                        type="submit"
                        disabled={isAuthenticating || newPassword.length < 6}
                        className={primaryButtonClass}
                      >
                        {isAuthenticating ? "SAVING..." : "CONFIRM PROFILE"}
                      </button>

                      <ResetAnchor
                        onReset={() => {
                          resetForm();
                          setEmail("");
                        }}
                      />
                    </motion.form>
                  ) : null}
                </AnimatePresence>
              ) : (
                <Link
                  href={getNotifyDeployPath()}
                  onClick={onClose}
                  className="text-meta mt-8 block w-full text-center text-[10px] tracking-[0.25em] uppercase transition-colors hover:text-jet-black"
                >
                  Get notified when accounts open →
                </Link>
              )}

              {authError ? (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-center text-[11px] leading-relaxed text-red-600"
                >
                  {authError}
                </motion.p>
              ) : null}

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
