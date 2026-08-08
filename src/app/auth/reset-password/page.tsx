"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/context/AuthContext";
import {
  resolveBoutiqueBrandLabel,
  resolveBoutiqueLogoUrl,
  resolveBoutiqueThemeAccentBySlug,
} from "@/lib/tr/boutiqueBrand";

const monoInputClass =
  "w-full border border-neutral-900 bg-white px-4 py-4 text-center font-mono text-[11px] tracking-[0.12em] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 disabled:opacity-60";

const primaryButtonClass =
  "mt-6 w-full border border-neutral-900 bg-neutral-900 px-5 py-4 text-center font-mono text-[10px] tracking-[0.32em] text-white uppercase transition-opacity hover:opacity-90 disabled:opacity-60";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/wardrobe";
  }
  return raw;
}

function boutiqueSlugFromNext(path: string): string | null {
  const match = path.match(/^\/tr\/([^/]+)\/giris\/?$/i);
  return match?.[1] ? decodeURIComponent(match[1]).toLowerCase() : null;
}

function isBoutiqueReturnPath(path: string): boolean {
  return (
    path === "/giris" ||
    path === "/hesap" ||
    /^\/tr\/[^/]+\/giris\/?$/.test(path)
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeNextPath(searchParams.get("next"));
  const boutiqueSlug = useMemo(() => {
    const fromQuery = searchParams.get("boutique")?.trim().toLowerCase();
    if (fromQuery) return fromQuery;
    return boutiqueSlugFromNext(returnTo);
  }, [searchParams, returnTo]);
  const boutiqueFlow = useMemo(
    () => Boolean(boutiqueSlug) || isBoutiqueReturnPath(returnTo),
    [boutiqueSlug, returnTo],
  );
  const brandTitle = boutiqueSlug
    ? resolveBoutiqueBrandLabel(boutiqueSlug)
    : null;
  const logoUrl = boutiqueSlug
    ? resolveBoutiqueLogoUrl({ slug: boutiqueSlug, logoUrl: null })
    : null;
  const accentColor = boutiqueSlug
    ? resolveBoutiqueThemeAccentBySlug(boutiqueSlug)
    : null;

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
        router.replace(returnTo);
      }, 1200);
    } catch {
      // Error handled in context.
    }
  };

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8] px-4">
        <p className="text-center font-mono text-[10px] tracking-[0.35em] text-neutral-500 uppercase">
          {boutiqueFlow ? "Oturum hazırlanıyor…" : "Loading archive session..."}
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8] px-4">
        <div className="w-full max-w-md border border-black/10 bg-white p-8 text-center shadow-sm">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={brandTitle ?? ""}
              width={120}
              height={120}
              className="mx-auto mb-5 h-16 w-auto object-contain"
              unoptimized
            />
          ) : null}
          <h1 className="font-serif text-2xl text-neutral-950">
            {boutiqueFlow ? "Bağlantı süresi doldu" : "Link expired"}
          </h1>
          <p className="mt-4 text-sm text-neutral-600">
            {boutiqueFlow
              ? "Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Giriş ekranından yeniden talep edin."
              : "This password reset link is invalid or has expired. Request a new one from the sign-in screen."}
          </p>
          <button
            type="button"
            onClick={() => router.push(boutiqueFlow ? returnTo : "/")}
            className={`${primaryButtonClass} mt-8`}
            style={
              accentColor
                ? { backgroundColor: accentColor, borderColor: accentColor }
                : undefined
            }
          >
            {boutiqueFlow ? "Girişe dön" : "Back to lookbook"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF8]">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md border border-black/10 bg-white p-8 shadow-sm md:p-10">
          <div className="mb-6 flex flex-col items-center">
            {boutiqueFlow && logoUrl ? (
              <>
                <Image
                  src={logoUrl}
                  alt={brandTitle ?? ""}
                  width={160}
                  height={160}
                  className="h-20 w-auto object-contain"
                  unoptimized
                  priority
                />
                {brandTitle ? (
                  <p className="mt-4 font-serif text-[1.35rem] tracking-[0.04em] text-neutral-950">
                    {brandTitle}
                  </p>
                ) : null}
              </>
            ) : (
              <BrandLogo variant="onLight" className="h-20 w-auto" />
            )}
          </div>

          <p className="mb-3 text-center text-[9px] tracking-[0.4em] text-neutral-500 uppercase">
            {boutiqueFlow ? "Hesap güvenliği" : "Archive Security"}
          </p>

          <h1 className="text-center font-serif text-2xl text-neutral-950">
            {isComplete
              ? boutiqueFlow
                ? "Şifre güncellendi"
                : "Password updated"
              : boutiqueFlow
                ? "Yeni şifre belirleyin"
                : "Set a new password"}
          </h1>

          <p className="mt-4 text-center text-sm leading-relaxed text-neutral-600">
            {isComplete
              ? boutiqueFlow
                ? `${brandTitle ?? "Mağaza"} girişine yönlendiriliyorsunuz…`
                : "Redirecting you to your wardrobe archive..."
              : boutiqueFlow
                ? "Yeni şifreniz bu platformdaki tüm mağazalarda geçerlidir."
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
                placeholder={boutiqueFlow ? "YENİ ŞİFRE…" : "NEW PASSWORD..."}
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
                placeholder={
                  boutiqueFlow ? "ŞİFREYİ TEKRARLA…" : "CONFIRM PASSWORD..."
                }
              />

              {password.length >= 6 &&
              confirmPassword.length >= 6 &&
              password !== confirmPassword ? (
                <p className="text-center text-[11px] text-red-600">
                  {boutiqueFlow
                    ? "Şifreler eşleşmiyor."
                    : "Passwords do not match."}
                </p>
              ) : null}

              {authError ? (
                <p className="text-center text-[11px] text-red-600">
                  {authError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={
                  isAuthenticating ||
                  password.length < 6 ||
                  password !== confirmPassword
                }
                className={primaryButtonClass}
                style={
                  accentColor
                    ? { backgroundColor: accentColor, borderColor: accentColor }
                    : undefined
                }
              >
                {isAuthenticating
                  ? boutiqueFlow
                    ? "KAYDEDİLİYOR…"
                    : "SAVING..."
                  : boutiqueFlow
                    ? "ŞİFREYİ GÜNCELLE"
                    : "UPDATE PASSWORD"}
              </button>
            </form>
          ) : null}
        </div>
      </div>
      {boutiqueFlow ? (
        <p className="pb-8 text-center text-[11px] tracking-[0.08em] text-neutral-400">
          {brandTitle ?? "Butik"}
        </p>
      ) : (
        <SiteFooter />
      )}
    </div>
  );
}
