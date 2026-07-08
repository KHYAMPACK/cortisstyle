"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthPopup } from "@/components/AuthPopup";
import { useAuth } from "@/context/AuthContext";
import {
  fetchOwnerBoutiques,
  type TrOwnerBoutiqueSummary,
} from "@/lib/tr/ownerClient";
import { trPanelPath } from "@/lib/tr/paths";

interface TrOwnerPanelGateProps {
  children: (context: {
    boutiques: TrOwnerBoutiqueSummary[];
    activeBoutique: TrOwnerBoutiqueSummary;
    setActiveBoutiqueId: (id: string) => void;
  }) => React.ReactNode;
}

const STORAGE_KEY = "tr-panel-boutique-id";

export function TrOwnerPanelGate({ children }: TrOwnerPanelGateProps) {
  const { isAuthenticated, isInitializing, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boutiques, setBoutiques] = useState<TrOwnerBoutiqueSummary[]>([]);
  const [activeBoutiqueId, setActiveBoutiqueId] = useState<string | null>(null);

  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated) {
      setLoading(false);
      setBoutiques([]);
      setShowAuth(true);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchOwnerBoutiques();
        if (cancelled) return;
        setBoutiques(list);

        const stored =
          typeof window !== "undefined"
            ? window.localStorage.getItem(STORAGE_KEY)
            : null;
        const preferred =
          list.find((entry) => entry.id === stored)?.id ?? list[0]?.id ?? null;
        setActiveBoutiqueId(preferred);
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Butikler yüklenemedi.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isInitializing]);

  useEffect(() => {
    if (activeBoutiqueId && typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, activeBoutiqueId);
    }
  }, [activeBoutiqueId]);

  const activeBoutique =
    boutiques.find((entry) => entry.id === activeBoutiqueId) ?? boutiques[0];

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 md:px-8 md:py-10">
      <AuthPopup
        isOpen={showAuth && !isAuthenticated}
        onClose={() => setShowAuth(false)}
        onAuthSuccess={() => setShowAuth(false)}
        description="Butik panelinize giriş yapmak için e-posta adresinizi girin."
      />

      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-6">
        <div>
          <p className="text-[10px] tracking-[0.2em] text-neutral-500 uppercase">
            Butik paneli
          </p>
          <h1 className="mt-1 font-serif text-2xl tracking-tight text-neutral-950">
            Ürün yönetimi
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={trPanelPath()}
            className="border border-black/10 bg-white px-3 py-2 text-[10px] tracking-[0.12em] uppercase"
          >
            Liste
          </Link>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => void signOut()}
              className="border border-black/10 bg-white px-3 py-2 text-[10px] tracking-[0.12em] uppercase"
            >
              Çıkış
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowAuth(true)}
              className="border border-jet-black bg-jet-black px-3 py-2 text-[10px] tracking-[0.12em] text-white uppercase"
            >
              Giriş yap
            </button>
          )}
        </div>
      </header>

      {isInitializing || loading ? (
        <p className="text-[13px] text-neutral-600">Yükleniyor…</p>
      ) : null}

      {!isInitializing && !loading && !isAuthenticated ? (
        <div className="space-y-4 border border-black/10 bg-white px-5 py-8">
          <p className="text-[14px] text-neutral-800">
            Ürün eklemek için giriş yapın.
          </p>
          <button
            type="button"
            onClick={() => setShowAuth(true)}
            className="btn-primary inline-flex px-6 py-3 text-[11px] tracking-[0.16em]"
          >
            Giriş / Kayıt
          </button>
        </div>
      ) : null}

      {!isInitializing && !loading && isAuthenticated && error ? (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          {error}
        </p>
      ) : null}

      {!isInitializing &&
      !loading &&
      isAuthenticated &&
      !error &&
      boutiques.length === 0 ? (
        <div className="border border-black/10 bg-white px-5 py-8">
          <p className="text-[14px] leading-relaxed text-neutral-800">
            Hesabınız henüz bir butiğe bağlanmadı. Cortisstyle ekibi hesabınızı
            butiğinize bağladıktan sonra ürün ekleyebilirsiniz.
          </p>
        </div>
      ) : null}

      {!isInitializing && !loading && isAuthenticated && activeBoutique ? (
        <div className="space-y-6">
          {boutiques.length > 1 ? (
            <label className="block text-[11px] tracking-[0.12em] text-neutral-600 uppercase">
              Butik
              <select
                className="mt-2 w-full border border-black/10 bg-white px-3 py-3 text-[13px] text-neutral-900"
                value={activeBoutique.id}
                onChange={(event) => setActiveBoutiqueId(event.target.value)}
              >
                {boutiques.map((boutique) => (
                  <option key={boutique.id} value={boutique.id}>
                    {boutique.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="flex items-center gap-3">
              {activeBoutique.logoUrl ? (
                <Image
                  src={activeBoutique.logoUrl}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                  unoptimized
                />
              ) : null}
              <p className="text-[13px] font-medium text-neutral-900">
                {activeBoutique.name}
              </p>
            </div>
          )}

          {children({
            boutiques,
            activeBoutique,
            setActiveBoutiqueId: (id) => setActiveBoutiqueId(id),
          })}
        </div>
      ) : null}
    </div>
  );
}
