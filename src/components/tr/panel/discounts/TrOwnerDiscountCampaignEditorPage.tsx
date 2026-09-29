"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { TrDiscountCampaignEditor } from "@/components/tr/panel/discounts/TrDiscountCampaignEditor";
import { TrPanelEditor } from "@/components/tr/panel/TrPanelEditor";
import { TrPanelFadeIn, TrPanelLoading } from "@/components/tr/panel/TrPanelMotion";
import { panelErrorClass } from "@/components/tr/panel/panelUi";
import type { TrDiscountCampaign } from "@/lib/tr/discounts/types";
import { fetchOwnerDiscountCampaign } from "@/lib/tr/ownerClient";
import { trPanelCampaignsPath, trPanelEditCampaignPath } from "@/lib/tr/paths";

/** Create (no `campaignId`) or edit a discount campaign in the editor layout. */
export function TrOwnerDiscountCampaignEditorPage({
  campaignId,
}: {
  campaignId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialKind = searchParams.get("kind") === "code" ? "code" : "automatic";
  const [state, setState] = useState<{
    id: string;
    campaign: TrDiscountCampaign | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (!campaignId) return;
    let cancelled = false;
    fetchOwnerDiscountCampaign(campaignId)
      .then((campaign) => {
        if (!cancelled) setState({ id: campaignId, campaign, error: null });
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setState({
            id: campaignId,
            campaign: null,
            error: loadError instanceof Error ? loadError.message : "Kampanya yüklenemedi.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  const loaded = campaignId && state?.id === campaignId ? state : null;

  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <TrPanelEditor
          backHref={trPanelCampaignsPath()}
          parentLabel="Kampanyalar"
          title={
            campaignId
              ? "Kampanyayı düzenle"
              : initialKind === "code"
                ? "İndirim kodu ekle"
                : "Kampanya ekle"
          }
          subject={loaded?.campaign?.title}
        >
          {campaignId && !loaded ? (
            <TrPanelLoading key="campaign-loading" label="Kampanya yükleniyor…" />
          ) : loaded?.error ? (
            <p className={`${panelErrorClass} mt-4`}>{loaded.error}</p>
          ) : (
            <TrPanelFadeIn shift={false}>
              <TrDiscountCampaignEditor
                key={loaded?.campaign?.id ?? "new"}
                boutiqueId={activeBoutique.id}
                campaign={loaded?.campaign ?? undefined}
                initialKind={initialKind}
                onCreated={(created) =>
                  router.replace(trPanelEditCampaignPath(created.id))
                }
                onSaved={(saved) => setState({ id: saved.id, campaign: saved, error: null })}
                onDeleted={() => router.push(trPanelCampaignsPath())}
              />
            </TrPanelFadeIn>
          )}
        </TrPanelEditor>
      )}
    </TrOwnerPanelGate>
  );
}
