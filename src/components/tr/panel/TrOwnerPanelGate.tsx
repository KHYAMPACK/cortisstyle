"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { AuthPopup } from "@/components/AuthPopup";
import { TrOwnerElbiseRestyleProvider } from "@/components/tr/fashion/panel/TrOwnerElbiseRestyleSession";
import {
  TrOwnerLeaveGuardProvider,
  useRequestBusyLeave,
} from "@/components/tr/panel/TrOwnerLeaveGuard";
import { TrPanelDesktopSidebar } from "@/components/tr/panel/TrPanelDesktopSidebar";
import {
  TrPanelMobileChrome,
  TrPanelMobileTabBar,
} from "@/components/tr/panel/TrPanelMobileChrome";
import {
  TrPanelListSkeleton,
  TrPanelPageTransition,
  TrPanelSidebarSkeleton,
} from "@/components/tr/panel/TrPanelMotion";
import { useOwnerOrderAlerts } from "@/hooks/useOwnerOrderAlerts";
import { useAuth } from "@/context/AuthContext";
import {
  fetchOwnerBoutiques,
  type TrOwnerBoutiqueSummary,
} from "@/lib/tr/ownerClient";
import {
  panelAccentCssVars,
  syncPanelAccentVarsToDocument,
} from "@/lib/tr/panelTheme";
import { trPanelPath } from "@/lib/tr/paths";

interface TrOwnerPanelGateProps {
  children: (context: {
    boutiques: TrOwnerBoutiqueSummary[];
    activeBoutique: TrOwnerBoutiqueSummary;
    setActiveBoutiqueId: (id: string) => void;
    isStaff: boolean;
  }) => React.ReactNode;
}

const STORAGE_KEY = "tr-panel-boutique-id";

export function TrOwnerPanelGate({ children }: TrOwnerPanelGateProps) {
  return (
    <TrOwnerLeaveGuardProvider>
      <TrOwnerElbiseRestyleProvider>
        <TrOwnerPanelGateBody>{children}</TrOwnerPanelGateBody>
      </TrOwnerElbiseRestyleProvider>
    </TrOwnerLeaveGuardProvider>
  );
}

function TrOwnerPanelGateBody({ children }: TrOwnerPanelGateProps) {
  const pathname = usePathname();
  const requestLeave = useRequestBusyLeave();
  const { isAuthenticated, isInitializing, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boutiques, setBoutiques] = useState<TrOwnerBoutiqueSummary[]>([]);
  const [isStaff, setIsStaff] = useState(false);
  const [activeBoutiqueId, setActiveBoutiqueId] = useState<string | null>(null);

  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated) {
      setLoading(false);
      setBoutiques([]);
      setIsStaff(false);
      setShowAuth(true);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchOwnerBoutiques();
        if (cancelled) return;
        setBoutiques(result.boutiques);
        setIsStaff(result.isStaff);

        const stored =
          typeof window !== "undefined"
            ? window.localStorage.getItem(STORAGE_KEY)
            : null;
        const preferred =
          result.boutiques.find((entry) => entry.id === stored)?.id ??
          result.boutiques[0]?.id ??
          null;
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
    activeBoutique?.offersIyzicoCheckout,
  );

  const accentStyle = panelAccentCssVars(
    activeBoutique?.themeAccent,
  ) as CSSProperties;

  useEffect(() => {
    return syncPanelAccentVarsToDocument(activeBoutique?.themeAccent);
  }, [activeBoutique?.themeAccent]);

  const signOutGuarded = () => {
    if (requestLeave) {
      requestLeave({ kind: "action", run: () => void signOut() });
      return;
    }
    void signOut();
  };

  const booting = isInitializing || loading;
  const showDesktopSidebar =
    isAuthenticated &&
    Boolean(activeBoutique) &&
    !booting &&
    !error &&
    boutiques.length > 0;
  const showSidebarSkeleton = isAuthenticated && booting;

  return (
    <div
      style={accentStyle}
      className="lg:flex lg:min-h-dvh"
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

      {showDesktopSidebar && activeBoutique ? (
        <div className="hidden lg:block">
          <div className="sticky top-0">
            <TrPanelDesktopSidebar
              boutiques={boutiques}
              activeBoutique={activeBoutique}
              setActiveBoutiqueId={setActiveBoutiqueId}
              hasNewOrders={hasNewOrders}
              onSignOut={signOutGuarded}
            />
          </div>
        </div>
      ) : showSidebarSkeleton ? (
        <div className="hidden lg:block">
          <div className="sticky top-0">
            <TrPanelSidebarSkeleton />
          </div>
        </div>
      ) : null}

      <div
        className={`flex min-w-0 flex-1 flex-col ${
          showDesktopSidebar || booting ? "" : "mx-auto w-full max-w-5xl"
        }`}
      >
        <div className="lg:hidden">
          <TrPanelMobileChrome
            boutiques={boutiques}
            activeBoutique={activeBoutique}
            setActiveBoutiqueId={setActiveBoutiqueId}
            hasNewOrders={hasNewOrders}
            isAuthenticated={isAuthenticated}
            onSignOut={signOutGuarded}
            onSignIn={() => setShowAuth(true)}
          />
        </div>

        {/* Desktop chrome only when ready but no sidebar (auth / empty boutique) — not while booting */}
        {!showDesktopSidebar &&
        !booting &&
        (!isAuthenticated || boutiques.length === 0 || error) ? (
          <div className="hidden lg:block">
            <TrPanelMobileChrome
              boutiques={boutiques}
              activeBoutique={activeBoutique}
              setActiveBoutiqueId={setActiveBoutiqueId}
              hasNewOrders={hasNewOrders}
              isAuthenticated={isAuthenticated}
              onSignOut={signOutGuarded}
              onSignIn={() => setShowAuth(true)}
            />
          </div>
        ) : null}

        <div
          className={`min-w-0 flex-1 px-4 py-4 sm:px-5 lg:px-6 lg:py-5 ${
            isAuthenticated && activeBoutique
              ? "pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-5"
              : "pb-5"
          }`}
        >

          <AnimatePresence>
            {booting ? (
              <TrPanelPageTransition key="panel-boot">
                <TrPanelListSkeleton rows={4} label="Yükleniyor" />
              </TrPanelPageTransition>
            ) : !isAuthenticated ? (
              <TrPanelPageTransition
                key="auth-required"
                pathname="auth-required"
              >
                <div className="space-y-4 rounded-xl border border-neutral-200/80 bg-white px-5 py-8 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                  <p className="text-[15px] leading-relaxed text-neutral-700">
                    Panele girmek için oturum açın.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAuth(true)}
                    className="inline-flex min-h-11 items-center rounded-lg bg-[color:var(--panel-accent)] px-5 py-2.5 text-[15px] font-semibold text-white hover:bg-[color:var(--panel-accent-hover)]"
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
                <div className="rounded-xl border border-neutral-200/80 bg-white px-5 py-8 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                  <p className="text-[15px] leading-relaxed text-neutral-700">
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
                  isStaff,
                })}
              </TrPanelPageTransition>
            ) : null}
          </AnimatePresence>
        </div>
        {isAuthenticated && activeBoutique ? (
          <TrPanelMobileTabBar
            boutiqueId={activeBoutique.id}
            catalogProfile={activeBoutique.catalogProfile ?? "fashion"}
            hasNewOrders={hasNewOrders}
          />
        ) : null}
      </div>
    </div>
  );
}
