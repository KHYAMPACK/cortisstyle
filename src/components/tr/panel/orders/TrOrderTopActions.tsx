"use client";

import { ArrowLeft, ArrowRight, Ellipsis } from "lucide-react";
import { useState } from "react";
import { TrPanelEditorActions } from "@/components/tr/panel/TrPanelEditor";
import { TrPanelConfirmPopover } from "@/components/tr/panel/TrPanelConfirmPopover";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { TrPanelPopover } from "@/components/tr/panel/TrPanelPopover";
import { trPanelOrderPath } from "@/lib/tr/paths";

const navButtonClass =
  "inline-flex h-9 items-center gap-2 rounded-lg border border-white/15 px-2.5 text-[13px] font-medium text-white/85 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 sm:px-3 motion-reduce:transition-none";

function NeighbourButton({
  direction,
  orderId,
}: {
  direction: "previous" | "next";
  orderId: string | null;
}) {
  const label = direction === "previous" ? "Önceki" : "Sonraki";
  const Icon = direction === "previous" ? ArrowLeft : ArrowRight;
  const content = (
    <>
      {direction === "previous" ? (
        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      ) : null}
      <span className="hidden sm:inline">{label}</span>
      {direction === "next" ? (
        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      ) : null}
    </>
  );

  if (!orderId) {
    return (
      <span
        role="link"
        aria-disabled="true"
        aria-label={`${label} sipariş yok`}
        className={`${navButtonClass} pointer-events-none opacity-40`}
      >
        {content}
      </span>
    );
  }
  return (
    <Link
      href={trPanelOrderPath(orderId)}
      aria-label={`${label} sipariş`}
      className={navButtonClass}
    >
      {content}
    </Link>
  );
}

/**
 * Right-hand end of the order page's top bar: Önceki / Sonraki (the list's
 * neighbours) and the ⋯ menu. Cancelling is destructive, so it asks first.
 */
export function TrOrderTopActions({
  previousId,
  nextId,
  closeHref,
  cancellable,
  cancelling,
  cancelMessage,
  onCancel,
}: {
  previousId: string | null;
  nextId: string | null;
  /**
   * Set when the order was opened from another page (a customer, the dashboard):
   * Önceki / Sonraki walk the order list, so they give way to Kapat, which returns there.
   */
  closeHref: string | null;
  cancellable: boolean;
  cancelling: boolean;
  cancelMessage: string;
  onCancel: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <TrPanelEditorActions>
      {closeHref ? null : (
        <>
          <NeighbourButton direction="previous" orderId={previousId} />
          <NeighbourButton direction="next" orderId={nextId} />
        </>
      )}
      {cancellable ? (
        <TrPanelConfirmPopover
          open={confirmOpen}
          side="bottom"
          align="end"
          message={cancelMessage}
          confirmLabel="Evet, iptal et"
          cancelLabel="Vazgeç"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            onCancel();
          }}
        >
          <TrPanelPopover
            label="Diğer işlemler"
            align="end"
            panelClassName="min-w-[160px]"
            trigger={({ open, ...trigger }) => (
              <button
                type="button"
                {...trigger}
                disabled={cancelling}
                aria-label="Diğer işlemler"
                className={`grid h-9 w-9 place-items-center rounded-lg border border-white/15 transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70 disabled:opacity-50 motion-reduce:transition-none ${
                  open ? "bg-white/10 text-white" : "text-white/85"
                }`}
              >
                <Ellipsis className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
              </button>
            )}
          >
            {(close) => (
              <button
                type="button"
                onClick={() => {
                  close();
                  setConfirmOpen(true);
                }}
                className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-[13.5px] font-medium text-red-600 transition-colors duration-150 hover:bg-red-50"
              >
                İptal Et
              </button>
            )}
          </TrPanelPopover>
        </TrPanelConfirmPopover>
      ) : null}
      {closeHref ? (
        <Link href={closeHref} className={`${navButtonClass} sm:px-4`}>
          Kapat
        </Link>
      ) : null}
    </TrPanelEditorActions>
  );
}
