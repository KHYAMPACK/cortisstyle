"use client";

import { MessageCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TrOwnerPanelGate } from "@/components/tr/panel/TrOwnerPanelGate";
import {
  panelEmptyClass,
  panelErrorClass,
  panelFieldClass,
  panelPrimaryBtnClass,
} from "@/components/tr/panel/panelUi";
import {
  TrPanelDataTable,
  TrPanelDataTableCell,
  TrPanelDataTableRow,
} from "@/components/tr/panel/TrPanelDataTable";
import {
  PANEL_PAGE_SIZES,
  TrPanelListPager,
} from "@/components/tr/panel/TrPanelListPager";
import { TrPanelLink as Link } from "@/components/tr/panel/TrPanelLink";
import { TrPanelFadeIn, TrPanelListSkeleton } from "@/components/tr/panel/TrPanelMotion";
import { TrPanelSortHeader } from "@/components/tr/panel/TrPanelSortHeader";
import { orderDraftReference, type TrOrderDraft } from "@/lib/tr/orders/orderDraft";
import {
  filterDrafts,
  sortDrafts,
  type DraftSortDirection,
  type DraftSortKey,
} from "@/lib/tr/panel/draftList";
import { orderListDate } from "@/lib/tr/panel/orderList";
import {
  fetchOwnerOrderDrafts,
  peekOwnerOrderDrafts,
} from "@/lib/tr/panel/ownerClient";
import { trPanelDraftPath, trPanelNewOrderPath } from "@/lib/tr/paths";
import { formatTryFromKurus } from "@/types/tr-marketplace";

function DraftsList({
  boutiqueId,
  canCreate,
}: {
  boutiqueId: string;
  /** Custom-art boutiques can't create orders by hand. */
  canCreate: boolean;
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<TrOrderDraft[] | null>(
    () => peekOwnerOrderDrafts(boutiqueId) ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: DraftSortKey; direction: DraftSortDirection }>({
    key: "date",
    direction: "desc",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PANEL_PAGE_SIZES[0]);
  // "Bugün" / "Dün" are relative to when the page was opened.
  const [nowMs] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    fetchOwnerOrderDrafts(boutiqueId).then(
      (result) => {
        if (!cancelled) setDrafts(result);
      },
      (loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Taslaklar yüklenemedi.");
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [boutiqueId]);

  const visible = useMemo(
    () => sortDrafts(filterDrafts(drafts ?? [], query), sort.key, sort.direction),
    [drafts, query, sort],
  );
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function changeSort(key: DraftSortKey) {
    setSort((current) => ({
      key,
      direction:
        current.key === key ? (current.direction === "desc" ? "asc" : "desc") : key === "reference" ? "asc" : "desc",
    }));
    setPage(1);
  }

  const header = (label: string, key: DraftSortKey) => (
    <TrPanelSortHeader
      key={key}
      label={label}
      active={sort.key === key}
      direction={sort.direction}
      onSort={() => changeSort(key)}
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[1.25rem] font-semibold tracking-tight text-neutral-900 sm:text-[1.375rem]">
          Taslak Siparişler
        </h2>
        {canCreate ? (
          <Link href={trPanelNewOrderPath()} className={panelPrimaryBtnClass}>
            Sipariş Oluştur
          </Link>
        ) : null}
      </div>

      {error && !drafts ? (
        <p className={panelErrorClass}>{error}</p>
      ) : drafts === null ? (
        <TrPanelListSkeleton rows={4} label="Taslaklar yükleniyor" />
      ) : (
        <TrPanelFadeIn key="drafts-ready" className="space-y-4" shift={false}>
          {drafts.length > 0 ? (
            <div className="relative min-w-0 max-w-sm">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
                strokeWidth={1.75}
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Tabloda arama yapın"
                aria-label="Taslaklarda ara"
                className={`${panelFieldClass} pl-9`}
              />
            </div>
          ) : null}

          {drafts.length === 0 ? (
            <p className={panelEmptyClass}>
              Henüz taslak yok.
              <br />
              Bir siparişi tamamlamadan bırakmak için “Taslak olarak kaydet”i kullanın.
            </p>
          ) : visible.length === 0 ? (
            <p className={panelEmptyClass}>Aramanıza uyan taslak yok.</p>
          ) : (
            <TrPanelDataTable
              contained={false}
              headers={[
                header("Sipariş", "reference"),
                header("Tarih", "date"),
                "Müşteri",
                "Sipariş Durumu",
                header("Toplam Tutar", "total"),
              ]}
              footer={
                <TrPanelListPager
                  page={currentPage}
                  pageCount={pageCount}
                  pageSize={pageSize}
                  total={visible.length}
                  noun="Sipariş"
                  onPage={setPage}
                  onPageSize={(value) => {
                    setPageSize(value);
                    setPage(1);
                  }}
                />
              }
            >
              {pageItems.map((draft) => {
                const href = trPanelDraftPath(draft.id);
                const when = orderListDate(draft.updatedAt, nowMs);
                return (
                  <TrPanelDataTableRow
                    key={draft.id}
                    onActivate={() => router.push(href)}
                    onPointerEnter={() => router.prefetch(href)}
                  >
                    <TrPanelDataTableCell>
                      <span className="flex items-center gap-2">
                        <Link
                          href={href}
                          className="font-semibold text-neutral-900 hover:underline"
                        >
                          {orderDraftReference(draft.id)}
                        </Link>
                        {draft.order.customerNote ? (
                          <span
                            title={draft.order.customerNote}
                            className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[color:var(--panel-accent-soft)] text-[color:var(--panel-accent-deep)]"
                          >
                            <MessageCircle
                              className="h-3.5 w-3.5"
                              strokeWidth={1.75}
                              aria-label="Notu var"
                            />
                          </span>
                        ) : null}
                      </span>
                    </TrPanelDataTableCell>
                    <TrPanelDataTableCell>
                      {when.day}, {when.time}
                    </TrPanelDataTableCell>
                    <TrPanelDataTableCell>
                      {draft.customerName ?? <span className="text-neutral-400">—</span>}
                    </TrPanelDataTableCell>
                    <TrPanelDataTableCell>
                      <span className="inline-flex rounded border border-neutral-200 bg-white px-2 py-0.5 text-[12px] text-neutral-700">
                        Taslak
                      </span>
                    </TrPanelDataTableCell>
                    <TrPanelDataTableCell className="tabular-nums">
                      {formatTryFromKurus(draft.totalKurus)}
                    </TrPanelDataTableCell>
                  </TrPanelDataTableRow>
                );
              })}
            </TrPanelDataTable>
          )}
        </TrPanelFadeIn>
      )}
    </div>
  );
}

export function TrOwnerOrderDraftsPage() {
  return (
    <TrOwnerPanelGate>
      {({ activeBoutique }) => (
        <DraftsList
          key={activeBoutique.id}
          boutiqueId={activeBoutique.id}
          canCreate={activeBoutique.catalogProfile !== "custom_art"}
        />
      )}
    </TrOwnerPanelGate>
  );
}
