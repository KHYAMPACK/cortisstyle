"use client";

import { useEffect, useState } from "react";
import { TrDashboardActionPill } from "@/components/tr/panel/dashboard/TrDashboardActionPill";
import {
  TrDashboardBreakdown,
  TrDashboardGrowth,
} from "@/components/tr/panel/dashboard/TrDashboardBreakdown";
import { TrDashboardRecentOrders } from "@/components/tr/panel/dashboard/TrDashboardRecentOrders";
import { TrDashboardSkeleton } from "@/components/tr/panel/dashboard/TrDashboardSkeleton";
import { TrDashboardToolbar } from "@/components/tr/panel/dashboard/TrDashboardToolbar";
import { TrDashboardTopSellers } from "@/components/tr/panel/dashboard/TrDashboardTopSellers";
import { TrDashboardTrendCard } from "@/components/tr/panel/dashboard/TrDashboardTrendCard";
import type { TrDashboardMetricId } from "@/components/tr/panel/dashboard/dashboardFormat";
import { TrOwnerCreditsUsageCard } from "@/components/tr/panel/TrOwnerCreditsInfo";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { panelErrorClass, panelSecondaryBtnClass } from "@/components/tr/panel/panelUi";
import { usePanelStoredFlag } from "@/components/tr/panel/panelStoredFlag";
import { TrPanelFadeIn } from "@/components/tr/panel/TrPanelMotion";
import { isCustomArtCatalogProfile } from "@/lib/tr/catalogProfiles";
import type { TrCatalogProfileId } from "@/lib/tr/panelNav";
import { DEFAULT_DASHBOARD_RANGE } from "@/lib/tr/panel/dashboardRange";
import {
  fetchOwnerDashboard,
  peekOwnerDashboard,
  type TrOwnerDashboard,
  type TrOwnerDashboardQuery,
} from "@/lib/tr/ownerClient";
import { trBoutiquePath } from "@/lib/tr/paths";

function HomeDashboard({
  boutiqueId,
  boutiqueSlug,
  catalogProfile,
  offersIyzicoCheckout,
}: {
  boutiqueId: string;
  boutiqueSlug: string;
  catalogProfile: TrCatalogProfileId;
  offersIyzicoCheckout: boolean;
}) {
  const printOnDemand = isCustomArtCatalogProfile({ catalogProfile });
  const [query, setQuery] = useState<TrOwnerDashboardQuery>({
    range: DEFAULT_DASHBOARD_RANGE,
  });
  const [metricId, setMetricId] = useState<TrDashboardMetricId>("revenue");
  const [compare, setCompare] = usePanelStoredFlag(
    "tr-panel-dashboard-compare",
    true,
  );
  const [retry, setRetry] = useState(0);
  const [loaded, setLoaded] = useState<{
    key: string;
    dashboard: TrOwnerDashboard;
  } | null>(null);
  const [failure, setFailure] = useState<{
    key: string;
    message: string;
  } | null>(null);

  const queryKey = `${query.range}|${query.from ?? ""}|${query.to ?? ""}`;

  useEffect(() => {
    let cancelled = false;
    fetchOwnerDashboard(boutiqueId, query).then(
      (dashboard) => {
        if (!cancelled) setLoaded({ key: queryKey, dashboard });
      },
      (error: unknown) => {
        if (cancelled) return;
        setFailure({
          key: queryKey,
          message: error instanceof Error ? error.message : "Özet yüklenemedi.",
        });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [boutiqueId, query, queryKey, retry]);

  // The freshest data for this range: a completed load, or the client cache.
  // While a new range loads, the previous range's numbers stay on screen (dimmed).
  const fresh =
    loaded?.key === queryKey ? loaded.dashboard : peekOwnerDashboard(boutiqueId, query);
  const dashboard = fresh ?? loaded?.dashboard ?? null;
  const refreshing = !fresh;
  const error = failure?.key === queryKey && !fresh ? failure.message : null;

  function retryLoad() {
    setFailure(null);
    setRetry((count) => count + 1);
  }

  return (
    <div className="space-y-4">
      <TrDashboardToolbar
        query={query}
        onQueryChange={setQuery}
        compare={compare}
        onCompareChange={setCompare}
        storeHref={trBoutiquePath(boutiqueSlug)}
      />

      {error ? (
        <div className={`${panelErrorClass} flex flex-wrap items-center justify-between gap-3`}>
          <p>{error}</p>
          <button type="button" onClick={retryLoad} className={panelSecondaryBtnClass}>
            Tekrar dene
          </button>
        </div>
      ) : !dashboard ? (
        <TrDashboardSkeleton />
      ) : (
        <div
          className={`space-y-4 transition-opacity duration-200 ${
            refreshing ? "opacity-60" : "opacity-100"
          }`}
          aria-busy={refreshing}
        >
          <TrPanelFadeIn>
            <TrDashboardTrendCard
              dashboard={dashboard}
              compare={compare}
              metricId={metricId}
              onMetricChange={setMetricId}
            />
          </TrPanelFadeIn>
          <TrDashboardBreakdown dashboard={dashboard} compare={compare} />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <TrDashboardTopSellers dashboard={dashboard} compare={compare} />
            <TrDashboardGrowth dashboard={dashboard} compare={compare} />
          </div>
          <div
            className={`grid gap-4 ${
              printOnDemand ? "" : "lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
            }`}
          >
            <TrDashboardRecentOrders
              boutiqueId={boutiqueId}
              offersIyzicoCheckout={offersIyzicoCheckout}
            />
            {!printOnDemand ? (
              <TrOwnerCreditsUsageCard boutiqueId={boutiqueId} />
            ) : null}
          </div>
          {/* Keeps the last card clear of the floating action bar. */}
          <div className="h-14" aria-hidden />
        </div>
      )}

      {dashboard ? (
        <TrDashboardActionPill
          actions={dashboard.actions}
          trackStock={!printOnDemand}
        />
      ) : null}
    </div>
  );
}

export function TrOwnerHomePage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <HomeDashboard
          key={activeBoutique.id}
          boutiqueId={activeBoutique.id}
          boutiqueSlug={activeBoutique.slug}
          catalogProfile={activeBoutique.catalogProfile ?? "fashion"}
          offersIyzicoCheckout={Boolean(activeBoutique.offersIyzicoCheckout)}
        />
      )}
    </TrOwnerPanelGate>
  );
}
