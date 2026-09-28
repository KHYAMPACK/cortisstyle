"use client";

import { useEffect, useState } from "react";
import { TrManualOrderEditor } from "@/components/tr/panel/orders/manual/TrManualOrderEditor";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import { panelErrorClass } from "@/components/tr/panel/panelUi";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { TrPanelPulse } from "@/components/tr/panel/TrPanelMotion";
import type { TrOrderDraft } from "@/lib/tr/orders/orderDraft";
import {
  fetchOwnerOrderDrafts,
  peekOwnerOrderDrafts,
} from "@/lib/tr/panel/ownerClient";
import { trPanelDraftsPath, trPanelOrdersPath } from "@/lib/tr/paths";

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <p className={panelErrorClass}>{children}</p>
    </div>
  );
}

/** Loads a draft (from the cached list when it is there), then opens the editor on it. */
function DraftLoader({
  boutique,
  draftId,
}: {
  boutique: { id: string; name: string };
  draftId: string;
}) {
  const [draft, setDraft] = useState<TrOrderDraft | null>(
    () => peekOwnerOrderDrafts(boutique.id)?.find((entry) => entry.id === draftId) ?? null,
  );
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    if (draft) return;
    let cancelled = false;
    fetchOwnerOrderDrafts(boutique.id).then(
      (list) => {
        if (cancelled) return;
        const found = list.find((entry) => entry.id === draftId);
        if (found) setDraft(found);
        else setFailure("Taslak bulunamadı.");
      },
      (loadError: unknown) => {
        if (!cancelled) {
          setFailure(loadError instanceof Error ? loadError.message : "Taslak yüklenemedi.");
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [boutique.id, draftId, draft]);

  if (draft) return <TrManualOrderEditor boutique={boutique} draft={draft} />;
  if (failure) {
    return (
      <Notice>
        {failure}{" "}
        <Link href={trPanelDraftsPath()} className="font-semibold underline">
          Taslaklara dön
        </Link>
      </Notice>
    );
  }
  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6" role="status" aria-label="Taslak yükleniyor">
      <TrPanelPulse className="h-12 w-full" />
      <TrPanelPulse className="h-64 w-full" />
    </div>
  );
}

/**
 * The route component of `/siparisler/yeni` (a new order, `draftId` null) and
 * `/taslaklar/[id]` (a draft). A boutique whose orders need the customer's photo
 * (custom art) can't take orders by hand.
 */
export function TrOwnerNewOrderPage({ draftId }: { draftId: string | null }) {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) =>
        activeBoutique.catalogProfile === "custom_art" ? (
          <Notice>
            Bu butik için panelden sipariş oluşturulamaz.{" "}
            <Link href={trPanelOrdersPath()} className="font-semibold underline">
              Siparişlere dön
            </Link>
          </Notice>
        ) : draftId ? (
          <DraftLoader
            key={`${activeBoutique.id}:${draftId}`}
            boutique={activeBoutique}
            draftId={draftId}
          />
        ) : (
          <TrManualOrderEditor
            key={activeBoutique.id}
            boutique={activeBoutique}
            draft={null}
          />
        )
      }
    </TrOwnerPanelGate>
  );
}
