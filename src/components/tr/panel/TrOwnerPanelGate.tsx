"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { AuthPopup } from "@/components/AuthPopup";
import { TrPanelDesktopSidebar } from "@/components/tr/panel/TrPanelDesktopSidebar";
import { TrPanelMobileChrome } from "@/components/tr/panel/TrPanelMobileChrome";
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
import { panelAccentCssVars } from "@/lib/tr/panelTheme";
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

  const accentStyle = panelAccentCssVars(
    activeBoutique?.themeAccent,
  ) as CSSProperties;

  const showDesktopSidebar =
    isAuthenticated &&
    Boolean(activeBoutique) &&
    !loading &&
    !isInitializing &&
    !error &&
    boutiques.length > 0;

  return (
    <div style={accentStyle} className="lg:flex lg:min-h-dvh">
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

      {showDesktopSidebar && activeBoutique ? (
        <div className="hidden lg:block">
          <div className="sticky top-0">
            <TrPanelDesktopSidebar
              boutiques={boutiques}
              activeBoutique={activeBoutique}
              setActiveBoutiqueId={setActiveBoutiqueId}
              hasNewOrders={hasNewOrders}
              onSignOut={() => void signOut()}
            />
          </div>
        </div>
      ) : null}

      <div
        className={`min-w-0 flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-8 ${
          showDesktopSidebar || isInitializing || loading
            ? "lg:px-8 lg:py-8"
            : "mx-auto max-w-5xl lg:mx-auto lg:max-w-5xl"
        }`}
      >
        <div
          className={
            showDesktopSidebar || isInitializing || loading
              ? "mx-auto max-w-[1400px]"
              : undefined
          }
        >
          <div className="lg:hidden">
            <TrPanelMobileChrome
              boutiques={boutiques}
              activeBoutique={activeBoutique}
              setActiveBoutiqueId={setActiveBoutiqueId}
              hasNewOrders={hasNewOrders}
              isAuthenticated={isAuthenticated}
              onSignOut={() => void signOut()}
              onSignIn={() => setShowAuth(true)}
            />
          </div>

          {/* Desktop chrome only when ready but no sidebar (auth / empty boutique) — not while booting */}
          {!showDesktopSidebar &&
          !isInitializing &&
          !loading &&
          (!isAuthenticated || boutiques.length === 0 || error) ? (
            <div className="mb-6 hidden lg:block">
              <TrPanelMobileChrome
                boutiques={boutiques}
                activeBoutique={activeBoutique}
                setActiveBoutiqueId={setActiveBoutiqueId}
                hasNewOrders={hasNewOrders}
                isAuthenticated={isAuthenticated}
                onSignOut={() => void signOut()}
                onSignIn={() => setShowAuth(true)}
              />
            </div>
          ) : null}

          <AnimatePresence mode="wait">
            {isInitializing || loading ? (
              <TrPanelLoading key="panel-boot" label="Yükleniyor…" />
            ) : !isAuthenticated ? (
              <TrPanelPageTransition
                key="auth-required"
                pathname="auth-required"
              >
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
                    Hesabınız henüz bir butiğe bağlanmadı. Destek ekibi
                    hesabınızı butiğinize bağladıktan sonra ürün
                    ekleyebilirsiniz.
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
      </div>
    </div>
  );
}
