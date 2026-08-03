"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthPopup } from "@/components/AuthPopup";
import { useAuth } from "@/context/AuthContext";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { resolveBoutiqueLogoUrl } from "@/lib/tr/boutiqueBrand";
import { trBoutiqueLegalPath, trBoutiquePath } from "@/lib/tr/paths";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

interface TrBoutiqueAuthPageContentProps {
  boutique: TrBoutiquePublic;
}

async function recordRegistrationSource(boutiqueSlug: string) {
  try {
    const supabase = getSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    await fetch("/api/tr/customer/registration-source", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        boutiqueSlug,
        host: typeof window !== "undefined" ? window.location.host : null,
      }),
    });
  } catch {
    // Attribution is best-effort
  }
}

export function TrBoutiqueAuthPageContent({
  boutique,
}: TrBoutiqueAuthPageContentProps) {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const accent = boutique.themeAccent?.trim() || "#111111";
  const logoUrl = resolveBoutiqueLogoUrl(boutique);

  useEffect(() => {
    if (!user) return;
    void recordRegistrationSource(boutique.slug);
  }, [user, boutique.slug]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-5 py-12">
      <Link
        href={trBoutiquePath(boutique.slug)}
        className="mb-10 flex flex-col items-center gap-3"
      >
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={boutique.name}
            width={200}
            height={80}
            className="h-16 w-auto object-contain"
            unoptimized
            priority
          />
        ) : (
          <span className="font-serif text-2xl tracking-[0.18em] uppercase">
            {boutique.name}
          </span>
        )}
      </Link>

      <h1 className="text-center font-serif text-2xl tracking-tight text-neutral-950">
        {user ? "Hesabınız" : "Giriş / Üyelik"}
      </h1>
      <p className="mt-3 text-center text-[14px] leading-relaxed text-neutral-600">
        {user
          ? `Merhaba — ${boutique.name} hesabınızla Cortisstyle ekosistemindeki diğer butiklerde de aynı e-posta ile giriş yapabilirsiniz.`
          : `${boutique.name} üyeliği Cortisstyle altyapısı üzerindedir. Aynı e-posta ile ileride diğer butiklerde de kolayca giriş yapabilirsiniz.`}
      </p>

      {user ? (
        <p className="mt-6 text-center text-[13px] text-neutral-700">
          Oturum: {user.email}
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setAuthOpen(true)}
          className="mt-8 w-full px-5 py-3.5 text-[11px] tracking-[0.18em] text-white uppercase transition-opacity hover:opacity-90"
          style={{ backgroundColor: accent }}
        >
          Devam et
        </button>
      )}

      <p className="mt-6 text-center text-[12px] leading-relaxed text-neutral-500">
        Devam ederek{" "}
        <Link
          href={trBoutiqueLegalPath(boutique.slug, "uyelik")}
          className="underline underline-offset-2"
        >
          üyelik şartlarını
        </Link>{" "}
        ve{" "}
        <Link
          href={trBoutiqueLegalPath(boutique.slug, "kvkk")}
          className="underline underline-offset-2"
        >
          KVKK aydınlatmasını
        </Link>{" "}
        kabul etmiş olursunuz.
      </p>

      <AuthPopup
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthSuccess={() => {
          setAuthOpen(false);
          void recordRegistrationSource(boutique.slug);
        }}
        description={`${boutique.name} hesabınıza giriş yapın veya oluşturun.`}
      />
    </div>
  );
}
