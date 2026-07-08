"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthPopup } from "@/components/AuthPopup";
import {
  TrPanelLoading,
  TrPanelPageTransition,
} from "@/components/tr/panel/TrPanelMotion";
import { useAuth } from "@/context/AuthContext";
import {
  fetchOwnerBoutiques,
  type TrOwnerBoutiqueSummary,
} from "@/lib/tr/ownerClient";
import { isTrPanelNavActive, TR_PANEL_NAV } from "@/lib/tr/panelNav";
import { trBoutiquePath, trPanelPath } from "@/lib/tr/paths";

interface TrOwnerPanelGateProps {
  children: (context: {
    boutiques: TrOwnerBoutiqueSummary[];
    activeBoutique: TrOwnerBoutiqueSummary;
    setActiveBoutiqueId: (id: string) => void;
  }) => React.ReactNode;
}

const STORAGE_KEY = "tr-panel-boutique-id";

export function TrOwnerPanelGate({ children }: TrOwnerPanelGateProps) {
  const pathname = usePathname();
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
    <div className="mx-auto max-w-4xl px-5 py-6 md:px-8 md:py-8">
      <AuthPopup
        isOpen={showAuth && !isAuthenticated}
        onClose={() => setShowAuth(false)}
        onAuthSuccess={() => setShowAuth(false)}
        description="Butik panelinize giriş yapmak için e-posta adresinizi girin."
      />

      <header className="mb-6 border-b border-black/10 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={trPanelPath()}
              className="text-[10px] tracking-[0.2em] text-neutral-500 uppercase"
            >
              Butik paneli
            </Link>
            {activeBoutique ? (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {activeBoutique.logoUrl ? (
                  <Image
                    src={activeBoutique.logoUrl}
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9 object-contain"
                    unoptimized
                  />
                ) : null}
                {boutiques.length > 1 ? (
                  <select
                    className="border border-black/10 bg-white px-3 py-2 text-[13px] text-neutral-900"
                    value={activeBoutique.id}
                    onChange={(event) => setActiveBoutiqueId(event.target.value)}
                  >
                    {boutiques.map((boutique) => (
                      <option key={boutique.id} value={boutique.id}>
                        {boutique.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="truncate text-[15px] font-medium text-neutral-900">
                    {activeBoutique.name}
                  </p>
                )}
              </div>
            ) : (
              <h1 className="mt-1 font-serif text-2xl tracking-tight text-neutral-950">
                Yönetim
              </h1>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeBoutique ? (
              <Link
                href={trBoutiquePath(activeBoutique.slug)}
                className="border border-black/10 bg-white px-3 py-2 text-[10px] tracking-[0.12em] uppercase"
              >
                Mağaza
              </Link>
            ) : null}
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
        </div>

        {isAuthenticated && activeBoutique ? (
          <nav
            aria-label="Panel menüsü"
            className="mt-4 flex gap-0 overflow-x-auto border-t border-black/10 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {TR_PANEL_NAV.map((item) => {
              const active = isTrPanelNavActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 border-b-2 px-3 py-3 text-[11px] tracking-[0.08em] uppercase transition-colors ${
                    active
                      ? "border-jet-black text-jet-black"
                      : "border-transparent text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </header>

      <AnimatePresence mode="wait">
        {isInitializing || loading ? (
          <TrPanelLoading key="panel-boot" label="Yükleniyor…" />
        ) : !isAuthenticated ? (
          <TrPanelPageTransition key="auth-required" pathname="auth-required">
            <div className="space-y-4 border border-black/10 bg-white px-5 py-8">
              <p className="text-[14px] text-neutral-800">
                Panele girmek için oturum açın.
              </p>
              <button
                type="button"
                onClick={() => setShowAuth(true)}
                className="btn-primary inline-flex px-6 py-3 text-[11px] tracking-[0.16em]"
              >
                Giriş / Kayıt
              </button>
            </div>
          </TrPanelPageTransition>
        ) : error ? (
          <TrPanelPageTransition key="panel-error" pathname="panel-error">
            <p className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
              {error}
            </p>
          </TrPanelPageTransition>
        ) : boutiques.length === 0 ? (
          <TrPanelPageTransition key="no-boutique" pathname="no-boutique">
            <div className="border border-black/10 bg-white px-5 py-8">
              <p className="text-[14px] leading-relaxed text-neutral-800">
                Hesabınız henüz bir butiğe bağlanmadı. Cortisstyle ekibi
                hesabınızı butiğinize bağladıktan sonra ürün ekleyebilirsiniz.
              </p>
            </div>
          </TrPanelPageTransition>
        ) : activeBoutique ? (
          <TrPanelPageTransition key={pathname} pathname={pathname}>
            {children({
              boutiques,
              activeBoutique,
              setActiveBoutiqueId: (id) => setActiveBoutiqueId(id),
            })}
          </TrPanelPageTransition>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
