"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
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
  TrPanelSidebarSkeleton,
} from "@/components/tr/panel/TrPanelMotion";
import { usePanelSidebarCollapsed } from "@/components/tr/panel/panelSidebarState";
import {
  PANEL_SIDEBAR_COLLAPSED_WIDTH,
  PANEL_SIDEBAR_WIDTH,
} from "@/components/tr/panel/panelUi";
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
import { isPanelEditorRoute } from "@/lib/tr/panel/panelNav";
import { trPanelPath } from "@/lib/tr/paths";

/** What a panel page receives once the shell is ready. */
export interface TrOwnerPanelContext {
  boutiques: TrOwnerBoutiqueSummary[];
  activeBoutique: TrOwnerBoutiqueSummary;
  setActiveBoutiqueId: (id: string) => void;
  isStaff: boolean;
}

const TrOwnerPanelReactContext = createContext<TrOwnerPanelContext | null>(null);

export function useTrOwnerPanel(): TrOwnerPanelContext {
  const context = useContext(TrOwnerPanelReactContext);
  if (!context) {
    throw new Error(
      "Panel pages must render inside the panel layout (TrPanelShell).",
    );
  }
  return context;
}

const STORAGE_KEY = "tr-panel-boutique-id";

/**
 * The panel chrome — sign-in, boutique list, sidebar, mobile bars, order alerts.
 *
 * It lives in `app/tr/panel/layout.tsx`, so it mounts ONCE and stays mounted while
 * the user moves between panel pages. Only the page below it changes. Mounting it
 * per page (as it used to be) tore the sidebar down and re-fetched the boutique
 * list on every click, which is what made navigation feel slow.
 */
export function TrPanelShell({ children }: { children: ReactNode }) {
  return (
    <TrOwnerLeaveGuardProvider>
      <TrOwnerElbiseRestyleProvider>
        <TrPanelShellBody>{children}</TrPanelShellBody>
      </TrOwnerElbiseRestyleProvider>
    </TrOwnerLeaveGuardProvider>
  );
}

function TrPanelShellBody({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const requestLeave = useRequestBusyLeave();
  const { user, isAuthenticated, isInitializing, signOut } = useAuth();
  const [collapsed, setCollapsed] = usePanelSidebarCollapsed();
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

  const selectBoutique = useCallback((id: string) => setActiveBoutiqueId(id), []);

  const pageContext = useMemo<TrOwnerPanelContext | null>(
    () =>
      activeBoutique
        ? {
            boutiques,
            activeBoutique,
            setActiveBoutiqueId: selectBoutique,
            isStaff,
          }
        : null,
    [activeBoutique, boutiques, isStaff, selectBoutique],
  );

  const booting = isInitializing || loading;
  const showDesktopSidebar =
    isAuthenticated &&
    Boolean(activeBoutique) &&
    !booting &&
    !error &&
    boutiques.length > 0;
  const showSidebarSkeleton = isAuthenticated && booting;

  // Editor pages own the whole screen. The chrome stays mounted (just hidden) so
  // going back to the list brings it straight back, and only once the panel is
  // ready — a signed-out visitor on an editor URL still gets the sign-in card.
  const editorMode = showDesktopSidebar && isPanelEditorRoute(pathname ?? "");

  const shellVars = {
    ...accentStyle,
    "--panel-sidebar-w": `${
      editorMode
        ? 0
        : collapsed
          ? PANEL_SIDEBAR_COLLAPSED_WIDTH
          : PANEL_SIDEBAR_WIDTH
    }px`,
    "--panel-tabbar-h": editorMode ? "0px" : "3.5rem",
  } as CSSProperties;

  return (
    <div style={shellVars} className="lg:flex lg:min-h-dvh">
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
        <div className={editorMode ? "hidden" : "hidden lg:block"}>
          <div className="sticky top-0">
            <TrPanelDesktopSidebar
              boutiques={boutiques}
              activeBoutique={activeBoutique}
              setActiveBoutiqueId={selectBoutique}
              hasNewOrders={hasNewOrders}
              onSignOut={signOutGuarded}
              collapsed={collapsed}
              onToggleCollapsed={() => setCollapsed(!collapsed)}
              accountLabel={user?.email ?? null}
            />
          </div>
        </div>
      ) : showSidebarSkeleton ? (
        <div className="hidden lg:block">
          <div className="sticky top-0">
            <TrPanelSidebarSkeleton collapsed={collapsed} />
          </div>
        </div>
      ) : null}

      <div
        className={`flex min-w-0 flex-1 flex-col ${
          showDesktopSidebar || booting ? "" : "mx-auto w-full max-w-5xl"
        }`}
      >
        <div className={editorMode ? "hidden" : "lg:hidden"}>
          <TrPanelMobileChrome
            boutiques={boutiques}
            activeBoutique={activeBoutique}
            setActiveBoutiqueId={selectBoutique}
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
              setActiveBoutiqueId={selectBoutique}
              hasNewOrders={hasNewOrders}
              isAuthenticated={isAuthenticated}
              onSignOut={signOutGuarded}
              onSignIn={() => setShowAuth(true)}
            />
          </div>
        ) : null}

        <div
          className={
            editorMode
              ? "min-w-0 flex-1"
              : `min-w-0 flex-1 px-4 py-4 sm:px-5 lg:px-6 lg:py-5 ${
                  isAuthenticated && activeBoutique
                    ? "pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-5"
                    : "pb-5"
                }`
          }
        >
          {booting ? (
            <div className="tr-panel-enter">
              <TrPanelListSkeleton rows={4} label="Yükleniyor" />
            </div>
          ) : !isAuthenticated ? (
            <div className="tr-panel-enter space-y-4 rounded-xl border border-neutral-200/80 bg-white px-5 py-8 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
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
          ) : error ? (
            <p className="tr-panel-enter rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-[16px] text-red-800">
              {error}
            </p>
          ) : boutiques.length === 0 ? (
            <div className="tr-panel-enter rounded-xl border border-neutral-200/80 bg-white px-5 py-8 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <p className="text-[15px] leading-relaxed text-neutral-700">
                Hesabınız henüz bir butiğe bağlanmadı. Destek ekibi hesabınızı
                butiğinize bağladıktan sonra ürün ekleyebilirsiniz.
              </p>
            </div>
          ) : pageContext ? (
            <TrOwnerPanelReactContext.Provider value={pageContext}>
              {children}
            </TrOwnerPanelReactContext.Provider>
          ) : null}
        </div>
        {isAuthenticated && activeBoutique && !editorMode ? (
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
