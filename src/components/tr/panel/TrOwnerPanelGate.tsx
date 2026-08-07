"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AuthPopup } from "@/components/AuthPopup";
import {
  TrPanelLoading,
  TrPanelPageTransition,
} from "@/components/tr/panel/TrPanelMotion";
import { useOwnerOrderAlerts } from "@/hooks/useOwnerOrderAlerts";
import { useAuth } from "@/context/AuthContext";
import {
  fetchOwnerBoutiques,
  type TrOwnerBoutiqueSummary,
} from "@/lib/tr/ownerClient";
import { isTrPanelNavActive, TR_PANEL_NAV } from "@/lib/tr/panelNav";
import { panelAccentCssVars } from "@/lib/tr/panelTheme";
import { trBoutiquePath, trPanelOrdersPath, trPanelPath } from "@/lib/tr/paths";

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

  const { hasNewOrders } = useOwnerOrderAlerts(
    isAuthenticated && activeBoutique ? activeBoutique.id : null,
  );

  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      el.scrollLeft += event.deltaY;
      event.preventDefault();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [isAuthenticated, activeBoutique?.id]);

  const accentStyle = panelAccentCssVars(
    activeBoutique?.themeAccent,
  ) as CSSProperties;

  return (
    <div
      className="mx-auto max-w-5xl px-4 py-5 sm:px-6 md:px-8 md:py-8"
      style={accentStyle}
    >
      <AuthPopup
        isOpen={showAuth && !isAuthenticated}
        onClose={() => setShowAuth(false)}
        onAuthSuccess={() => setShowAuth(false)}
        description="Butik panelinize giriş yapmak için e-posta adresinizi girin."
        brand={{
          locale: "tr",
          successHref: pathname?.startsWith("/tr/panel")
            ? pathname
            : trPanelPath(),
        }}
      />

      <header className="mb-6 overflow-hidden rounded-2xl border border-[color:var(--panel-accent-border)] bg-white shadow-sm">
        <div
          className="px-5 py-4 text-white sm:px-6"
          style={{
            background: `linear-gradient(90deg, var(--panel-accent-deep), var(--panel-accent))`,
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <Link
                href={trPanelPath()}
                className="text-[15px] font-semibold tracking-wide"
              >
                Butik Paneli
              </Link>
              {activeBoutique ? (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {activeBoutique.logoUrl ? (
                    <Image
                      src={activeBoutique.logoUrl}
                      alt=""
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full bg-white/95 object-contain p-1"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg font-semibold">
                      {activeBoutique.name.slice(0, 1)}
                    </span>
                  )}
                  {boutiques.length > 1 ? (
                    <select
                      className="max-w-full rounded-xl border-0 bg-white px-4 py-3 text-[17px] font-medium text-neutral-900"
                      value={activeBoutique.id}
                      onChange={(event) =>
                        setActiveBoutiqueId(event.target.value)
                      }
                    >
                      {boutiques.map((boutique) => (
                        <option key={boutique.id} value={boutique.id}>
                          {boutique.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="truncate text-[20px] font-semibold leading-tight">
                      {activeBoutique.name}
                    </p>
                  )}
                </div>
              ) : (
                <h1 className="mt-1 text-[22px] font-semibold">Yönetim</h1>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {activeBoutique ? (
                <Link
                  href={trBoutiquePath(activeBoutique.slug)}
                  className="inline-flex min-h-12 items-center rounded-xl bg-white px-5 py-3 text-[16px] font-semibold shadow-sm"
                  style={{ color: "var(--panel-accent)" }}
                >
                  Mağazayı aç
                </Link>
              ) : null}
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="inline-flex min-h-12 items-center rounded-xl border-2 border-white/70 bg-transparent px-5 py-3 text-[16px] font-semibold text-white"
                >
                  Çıkış
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAuth(true)}
                  className="inline-flex min-h-12 items-center rounded-xl bg-white px-5 py-3 text-[16px] font-semibold"
                  style={{ color: "var(--panel-accent)" }}
                >
                  Giriş yap
                </button>
              )}
            </div>
          </div>
        </div>

        {isAuthenticated && activeBoutique ? (
          <nav
            ref={navRef}
            aria-label="Panel menüsü"
            className="flex gap-2 overflow-x-auto overscroll-x-contain p-3 pb-2 [scrollbar-gutter:stable] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[color:var(--panel-accent-border)] [&::-webkit-scrollbar-track]:bg-transparent"
            style={{ backgroundColor: "var(--panel-accent-softer)" }}
          >
            {TR_PANEL_NAV.map((item) => {
              const active = isTrPanelNavActive(pathname, item);
              const showOrderDot =
                item.href === trPanelOrdersPath() && hasNewOrders;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative shrink-0 rounded-full px-4 py-3 text-[15px] font-semibold transition-colors ${
                    active
                      ? "text-white shadow-sm"
                      : "bg-white text-neutral-700 ring-1 ring-[color:var(--panel-accent-border)] hover:bg-[color:var(--panel-accent-soft)]"
                  }`}
                  style={
                    active
                      ? { backgroundColor: "var(--panel-accent)" }
                      : undefined
                  }
                  aria-label={
                    showOrderDot
                      ? `${item.label} — yeni sipariş var`
                      : item.label
                  }
                >
                  {item.label}
                  {showOrderDot ? (
                    <span
                      className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white"
                      aria-hidden
                    />
                  ) : null}
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
            <div className="space-y-5 rounded-2xl border border-[color:var(--panel-accent-border)] bg-white px-6 py-10 shadow-sm">
              <p className="text-[18px] leading-relaxed text-neutral-800">
                Panele girmek için oturum açın.
              </p>
              <button
                type="button"
                onClick={() => setShowAuth(true)}
                className="inline-flex min-h-14 items-center rounded-xl px-8 py-4 text-[17px] font-semibold text-white"
                style={{ backgroundColor: "var(--panel-accent)" }}
              >
                Giriş / Kayıt
              </button>
            </div>
          </TrPanelPageTransition>
        ) : error ? (
          <TrPanelPageTransition key="panel-error" pathname="panel-error">
            <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-[16px] text-red-800">
              {error}
            </p>
          </TrPanelPageTransition>
        ) : boutiques.length === 0 ? (
          <TrPanelPageTransition key="no-boutique" pathname="no-boutique">
            <div className="rounded-2xl border border-[color:var(--panel-accent-border)] bg-white px-6 py-10 shadow-sm">
              <p className="text-[18px] leading-relaxed text-neutral-800">
                Hesabınız henüz bir butiğe bağlanmadı. Destek ekibi hesabınızı
                butiğinize bağladıktan sonra ürün ekleyebilirsiniz.
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
