"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/context/AuthContext";

const monoInputClass =
  "w-full border border-jet-black bg-white px-4 py-4 text-center font-mono text-[11px] tracking-[0.12em] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-jet-black disabled:opacity-60";

const primaryButtonClass =
  "mt-6 w-full border border-jet-black bg-jet-black px-5 py-4 text-center font-mono text-[10px] tracking-[0.32em] text-white uppercase transition-opacity hover:opacity-90 disabled:opacity-60";

export default function ResetPasswordPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    isInitializing,
    setAccountPassword,
    isAuthenticating,
    authError,
    clearAuthError,
  } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    clearAuthError();
  }, [clearAuthError]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearAuthError();

    if (password !== confirmPassword) {
      return;
    }

    try {
      await setAccountPassword(password);
      setIsComplete(true);
      window.setTimeout(() => {
        router.replace("/wardrobe");
      }, 1200);
    } catch {
      // Error handled in context.
    }
  };

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ice-floor px-4">
        <p className="text-meta font-mono text-[10px] tracking-[0.35em] uppercase">
          Loading archive session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ice-floor px-4">
        <div className="w-full max-w-md border border-blueprint-border bg-white p-8 text-center shadow-2xl">
          <h1 className="font-serif text-2xl text-neutral-950">Link expired</h1>
          <p className="mt-4 text-sm text-neutral-600">
            This password reset link is invalid or has expired. Request a new
            one from the sign-in screen.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className={`${primaryButtonClass} mt-8`}
          >
            Back to lookbook
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ice-floor px-4 py-10">
      <div className="w-full max-w-md border border-blueprint-border bg-white p-8 shadow-2xl md:p-10">
        <div className="mb-6 flex justify-center">
          <BrandLogo variant="onLight" className="h-20 w-auto" />
        </div>

        <p className="text-meta mb-3 text-center text-[9px] tracking-[0.4em] uppercase">
          Archive Security
        </p>

        <h1 className="text-center font-serif text-2xl text-neutral-950">
          {isComplete ? "Password updated" : "Set a new password"}
        </h1>

        <p className="mt-4 text-center text-sm leading-relaxed text-neutral-600">
          {isComplete
            ? "Redirecting you to your wardrobe archive..."
            : "Choose a new curator password for your archive profile."}
        </p>

        {!isComplete ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isAuthenticating}
              className={monoInputClass}
              placeholder="NEW PASSWORD..."
            />
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={isAuthenticating}
              className={monoInputClass}
              placeholder="CONFIRM PASSWORD..."
            />

            {password.length >= 6 &&
            confirmPassword.length >= 6 &&
            password !== confirmPassword ? (
              <p className="text-center text-[11px] text-red-600">
                Passwords do not match.
              </p>
            ) : null}

            {authError ? (
              <p className="text-center text-[11px] text-red-600">{authError}</p>
            ) : null}

            <button
              type="submit"
              disabled={
                isAuthenticating ||
                password.length < 6 ||
                password !== confirmPassword
              }
              className={primaryButtonClass}
            >
              {isAuthenticating ? "SAVING..." : "UPDATE PASSWORD"}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
