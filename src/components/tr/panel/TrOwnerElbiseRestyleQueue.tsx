"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  constructionGateErrorCopy,
  constructionGateRequiredCopy,
  emptyElbiseGateChips,
  elbiseGateReady,
  TrOwnerElbiseConstructionGateFields,
  type ElbiseGateChipState,
} from "@/components/tr/panel/TrOwnerElbiseConstructionGate";
import { TrOwnerAiModelPicker } from "@/components/tr/panel/TrOwnerAiModelPicker";
import { useRegisterLeaveBusy } from "@/components/tr/panel/TrOwnerLeaveGuard";
import { useScheduleAiJob } from "@/components/tr/panel/TrOwnerAiJobQueue";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";
import {
  TrOwnerCreditsCostLine,
  TrOwnerCreditsMoreInfoLink,
} from "@/components/tr/panel/TrOwnerCreditsInfo";
import {
  panelHintClass,
  panelPrimaryBtnClass,
  panelSecondaryBtnClass,
} from "@/components/tr/panel/panelUi";
import {
  estimateElbiseRestyleCredits,
  isSameIstanbulDay,
} from "@/lib/tr/fashion/aiCatalog/elbiseRestyle";
import {
  commitElbiseCatalogRestyle,
  prepareElbiseCatalogRestyle,
  type ElbiseCatalogPrepareResult,
  type ElbiseRestyleProgressPhase,
} from "@/lib/tr/fashion/aiCatalog/runElbiseCatalogPipeline";
import {
  chipsFromProductFeatures,
  elbiseModelShotCount,
} from "@/lib/tr/aiModel/elbiseTryOn";
import {
  getAiModelOptionById,
  resolveReadyAiModelId,
} from "@/lib/tr/aiModel/registry";
import { constructionCatalogFamily } from "@/lib/tr/catalog/garmentUploadTypes";
import { getPanelProductCover } from "@/lib/tr/productImages";
import type { TrProduct } from "@/types/tr-marketplace";

type QueueStage = "setup" | "prepare" | "gate" | "run" | "itemError" | "done";

interface ItemResult {
  id: string;
  ok: boolean;
  error?: string;
}

type RestyleBusyStepId = ElbiseRestyleProgressPhase;

const RESTYLE_BUSY_STEPS: Array<{
  id: RestyleBusyStepId;
  label: string;
}> = [
  { id: "prepare", label: "Analiz" },
  { id: "packshot", label: "Packshot" },
  { id: "tryon", label: "Model" },
];

interface TrOwnerElbiseRestyleQueueProps {
  sessionId: number;
  sheetOpen: boolean;
  boutiqueId: string;
  boutiqueSlug?: string | null;
  products: TrProduct[];
  initiallyCheckedIds?: string[];
  /** Honor the editor/list picker; do not silently fall back to the house model. */
  initialModelId?: string | null;
  onMinimize: () => void;
  onExpand: () => void;
  onEnd: () => void;
  onProductSaved: (product: TrProduct) => void;
  onModelLocked?: (modelId: string) => void;
}

export function TrOwnerElbiseRestyleQueue({
  sessionId,
  sheetOpen,
  boutiqueId,
  boutiqueSlug = null,
  products,
  initiallyCheckedIds,
  initialModelId = null,
  onMinimize,
  onExpand,
  onEnd,
  onProductSaved,
  onModelLocked,
}: TrOwnerElbiseRestyleQueueProps) {
  const scheduleAiJob = useScheduleAiJob();
  const [portalReady, setPortalReady] = useState(false);
  const [stage, setStage] = useState<QueueStage>("setup");
  const [modelId, setModelId] = useState<string | null>(null);
  const [runModelId, setRunModelId] = useState<string | null>(null);
  const lockedModelIdRef = useRef<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<TrProduct[]>([]);
  const [cursor, setCursor] = useState(0);
  const [prepare, setPrepare] = useState<ElbiseCatalogPrepareResult | null>(
    null,
  );
  const [chips, setChips] = useState<ElbiseGateChipState>(emptyElbiseGateChips());
  const [progressLabel, setProgressLabel] = useState("");
  const [progressPhase, setProgressPhase] =
    useState<ElbiseRestyleProgressPhase>("prepare");
  const [progressPct, setProgressPct] = useState(0);
  const [progressTarget, setProgressTarget] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [itemError, setItemError] = useState<string | null>(null);
  const [results, setResults] = useState<ItemResult[]>([]);

  const busy = stage === "prepare" || stage === "run";
  const leaveBusy =
    busy || stage === "gate" || stage === "itemError";
  useRegisterLeaveBusy("elbise-restyle-queue", leaveBusy);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!busy) return;
    const step =
      progressPhase === "tryon" ? 0.28 : progressPhase === "packshot" ? 0.42 : 0.7;
    const timer = window.setInterval(() => {
      setProgressPct((current) => {
        if (current >= progressTarget) return current;
        return Math.min(progressTarget, current + step);
      });
    }, 140);
    return () => window.clearInterval(timer);
  }, [busy, progressPhase, progressTarget]);

  useEffect(() => {
    if (!busy) {
      setElapsedSec(0);
      return;
    }
    setElapsedSec(0);
    const started = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [busy, cursor]);

  useEffect(() => {
    lockedModelIdRef.current = null;
    setRunModelId(null);
    setModelId(resolveReadyAiModelId(boutiqueSlug, initialModelId));
    setStage("setup");
    setPrepare(null);
    setItemError(null);
    setResults([]);
    setCursor(0);
    setQueue([]);
    setProgressLabel("");
    setProgressPhase("prepare");
    setProgressPct(0);
    setProgressTarget(0);
    setElapsedSec(0);
    const allowed = new Set(products.map((product) => product.id));
    const prechecked = new Set(
      (initiallyCheckedIds ?? []).filter((id) => allowed.has(id)),
    );
    if (prechecked.size === 0) {
      for (const product of products) {
        if (isSameIstanbulDay(product.createdAt)) prechecked.add(product.id);
      }
    }
    if (prechecked.size === 0) {
      for (const product of products) prechecked.add(product.id);
    }
    setCheckedIds(prechecked);
    // Snapshot once per session — saved products must not reset the queue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    if (stage !== "gate" && stage !== "itemError" && stage !== "done") return;
    onExpand();
  }, [stage, onExpand]);

  useEffect(() => {
    if (!sheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sheetOpen]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (busy) onMinimize();
      else if (stage === "setup" || stage === "done") onEnd();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen, busy, stage, onMinimize, onEnd]);

  const selected = useMemo(
    () => products.filter((product) => checkedIds.has(product.id)),
    [products, checkedIds],
  );

  const credits = useMemo(() => {
    if (!modelId) return 0;
    return selected.reduce(
      (sum, product) => sum + estimateElbiseRestyleCredits(product, modelId),
      0,
    );
  }, [modelId, selected]);

  const current = queue[cursor] ?? null;
  const activeModelId = lockedModelIdRef.current ?? runModelId ?? modelId;
  const activeModelLabel = activeModelId
    ? getAiModelOptionById(activeModelId, boutiqueSlug)?.label ?? activeModelId
    : null;
  const todayCount = products.filter((product) =>
    isSameIstanbulDay(product.createdAt),
  ).length;

  function toggleChecked(id: string) {
    setCheckedIds((currentIds) => {
      const next = new Set(currentIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectToday() {
    setCheckedIds(
      new Set(
        products
          .filter((product) => isSameIstanbulDay(product.createdAt))
          .map((product) => product.id),
      ),
    );
  }

  function applyProgress(
    phase: ElbiseRestyleProgressPhase,
    label: string,
    reset = false,
  ) {
    setProgressPhase(phase);
    setProgressLabel(label);
    const target = phase === "prepare" ? 22 : phase === "packshot" ? 55 : 92;
    const floor = phase === "prepare" ? 6 : phase === "packshot" ? 24 : 58;
    if (reset) {
      setProgressTarget(target);
      setProgressPct(floor);
      return;
    }
    setProgressTarget((current) => Math.max(current, target));
    setProgressPct((current) => Math.max(current, floor));
  }

  async function startQueue() {
    if (!modelId || selected.length === 0) return;
    lockedModelIdRef.current = modelId;
    onModelLocked?.(modelId);
    setRunModelId(modelId);
    setQueue(selected);
    setCursor(0);
    setResults([]);
    await beginItem(selected[0]!, 0, selected, []);
  }

  async function beginItem(
    product: TrProduct,
    index: number,
    list: TrProduct[],
    soFar: ItemResult[],
  ) {
    setCursor(index);
    setQueue(list);
    setResults(soFar);
    setItemError(null);
    setStage("prepare");
    applyProgress("prepare", "Elbise fotoğrafları okunuyor…", true);
    try {
      const prepared = await prepareElbiseCatalogRestyle({
        boutiqueId,
        product,
      });
      setPrepare(prepared);
      setChips(
        emptyElbiseGateChips(prepared.proposed, {
          hasDetailPhoto: Boolean(prepared.detailUrl?.trim()),
        }),
      );
      setStage("gate");
    } catch (error) {
      setItemError(
        error instanceof Error ? error.message : "Analiz başarısız.",
      );
      setStage("itemError");
    }
  }

  async function confirmCurrent() {
    const commitModelId =
      lockedModelIdRef.current ?? runModelId ?? modelId;
    if (!current || !prepare || !commitModelId) return;
    const family =
      constructionCatalogFamily(undefined, current.category) ?? "elbise";
    if (!elbiseGateReady(chips, family, current.category)) {
      setItemError(constructionGateErrorCopy(family, current.category));
      return;
    }
    setItemError(null);
    setStage("run");
    applyProgress("packshot", "Ön packshot üretiliyor…", true);
    try {
      const saved = await commitElbiseCatalogRestyle({
        boutiqueId,
        product: current,
        modelId: commitModelId,
        chips,
        prepared: prepare,
        scheduleAiJob,
        onProgress: (phase, label) => applyProgress(phase, label),
      });
      onProductSaved(saved);
      const nextResults = [...results, { id: current.id, ok: true }];
      await advance(nextResults);
    } catch (error) {
      setItemError(
        error instanceof Error ? error.message : "Üretim başarısız.",
      );
      setStage("itemError");
    }
  }

  async function skipCurrent() {
    if (!current) return;
    const nextResults = [
      ...results,
      { id: current.id, ok: false, error: "Atlandı" },
    ];
    await advance(nextResults);
  }

  async function retryCurrent() {
    if (!current) return;
    await beginItem(current, cursor, queue, results);
  }

  async function advance(nextResults: ItemResult[]) {
    setResults(nextResults);
    const nextIndex = cursor + 1;
    const nextProduct = queue[nextIndex];
    if (!nextProduct) {
      setStage("done");
      setPrepare(null);
      return;
    }
    await beginItem(nextProduct, nextIndex, queue, nextResults);
  }

  if (!portalReady) return null;

  const okCount = results.filter((entry) => entry.ok).length;
  const failCount = results.filter((entry) => !entry.ok).length;
  const canDismissSheet = busy || stage === "setup" || stage === "done";
  const coverUrl = current
    ? getPanelProductCover(current) ?? current.images[0] ?? null
    : null;

  return createPortal(
    <>
      <AnimatePresence>
        {busy && !sheetOpen ? (
          <RestyleStickyChip
            key="restyle-sticky"
            title={current?.title ?? "Packshot + model"}
            coverUrl={coverUrl}
            itemIndex={cursor}
            itemCount={queue.length}
            phase={progressPhase}
            stage={stage}
            progressPct={progressPct}
            elapsedSec={elapsedSec}
            onExpand={onExpand}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {sheetOpen ? (
      <motion.div
        key="restyle-sheet"
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => {
          if (busy) onMinimize();
          else if (stage === "setup" || stage === "done") onEnd();
        }}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="elbise-restyle-title"
          className="flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[color:var(--panel-accent-border)] bg-white shadow-xl sm:rounded-2xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.28, ease: trPanelEase }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start gap-3 border-b border-neutral-100 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p
                id="elbise-restyle-title"
                className="text-[18px] font-semibold text-neutral-900"
              >
                Packshot + model
              </p>
              <p className={`mt-1 ${panelHintClass}`}>
                Mevcut ön/arka mankenle bugünkü pipeline: chip onayı, ön
                packshot, sonra model kareleri.
              </p>
            </div>
            {canDismissSheet ? (
              <button
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                aria-label={busy ? "Arka plana al" : "Kapat"}
                onClick={() => {
                  if (busy) onMinimize();
                  else onEnd();
                }}
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {stage === "setup" ? (
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={panelSecondaryBtnClass}
                    onClick={selectToday}
                    disabled={todayCount === 0}
                  >
                    Bugünün ürünleri ({todayCount})
                  </button>
                  <button
                    type="button"
                    className={panelSecondaryBtnClass}
                    onClick={() =>
                      setCheckedIds(new Set(products.map((product) => product.id)))
                    }
                  >
                    Tümünü seç
                  </button>
                </div>

                <ul className="space-y-2">
                  {products.map((product) => {
                    const cover =
                      getPanelProductCover(product) ??
                      product.images[0] ??
                      null;
                    const checked = checkedIds.has(product.id);
                    return (
                      <li key={product.id}>
                        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2">
                          <input
                            type="checkbox"
                            className="h-5 w-5 shrink-0 accent-[color:var(--panel-accent)]"
                            checked={checked}
                            onChange={() => toggleChecked(product.id)}
                          />
                          <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                            {cover ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={cover}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[15px] font-medium text-neutral-900">
                              {product.title}
                            </span>
                            {isSameIstanbulDay(product.createdAt) ? (
                              <span className="text-[12px] text-neutral-500">
                                Bugün yüklendi
                              </span>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>

                {modelId ? (
                  <TrOwnerAiModelPicker
                    boutiqueSlug={boutiqueSlug}
                    value={modelId}
                    onChange={setModelId}
                    hidePhotographyStyle
                    variant="sheet"
                    allowDeselect={false}
                    autoSelectDefault={false}
                  />
                ) : null}

                <TrOwnerCreditsCostLine
                  boutiqueId={boutiqueId}
                  credits={credits}
                  prefix={`${selected.length} ürün · packshot + model`}
                />
                <TrOwnerCreditsMoreInfoLink boutiqueId={boutiqueId} />
              </div>
            ) : null}

            {stage === "prepare" || stage === "run" ? (
              <RestyleBusyPanel
                title={current?.title ?? "Ürün"}
                coverUrl={
                  current
                    ? getPanelProductCover(current) ?? current.images[0] ?? null
                    : null
                }
                itemIndex={cursor}
                itemCount={queue.length}
                modelLabel={activeModelLabel}
                stage={stage}
                phase={progressPhase}
                progressPct={progressPct}
                progressLabel={progressLabel}
                elapsedSec={elapsedSec}
                shotCount={
                  current
                    ? elbiseModelShotCount(
                        stage === "run"
                          ? chips
                          : chipsFromProductFeatures(
                              current.features,
                              constructionCatalogFamily(
                                undefined,
                                current.category,
                              ),
                            ),
                        activeModelId,
                        current.images[2],
                        constructionCatalogFamily(undefined, current.category),
                      )
                    : 2
                }
              />
            ) : null}

            {stage === "gate" && current ? (
              <div className="space-y-4">
                <p className="text-[16px] font-semibold text-neutral-900">
                  {current.title}
                </p>
                <p className={panelHintClass}>
                  {cursor + 1} / {queue.length} ·{" "}
                  {constructionGateRequiredCopy(
                    constructionCatalogFamily(undefined, current.category) ??
                      "elbise",
                    current.category,
                  )}{" "}
                  doğru mu?
                  Packshot buna kilitlenir.
                  {activeModelLabel ? ` Model: ${activeModelLabel}.` : ""}
                </p>
                <TrOwnerElbiseConstructionGateFields
                  chips={chips}
                  onChange={setChips}
                  family={
                    constructionCatalogFamily(undefined, current.category) ??
                    "elbise"
                  }
                  shopCategory={current.category}
                  hasDetailPhoto={Boolean(current.images[2]?.trim())}
                />
                {itemError ? (
                  <p className="text-[14px] text-red-700">{itemError}</p>
                ) : null}
                <TrOwnerCreditsCostLine
                  boutiqueId={boutiqueId}
                  credits={
                    current && activeModelId
                      ? estimateElbiseRestyleCredits(current, activeModelId)
                      : null
                  }
                  prefix="Bu ürün"
                />
              </div>
            ) : null}

            {stage === "itemError" && current ? (
              <div className="space-y-3 py-4">
                <p className="text-[16px] font-semibold text-neutral-900">
                  {current.title}
                </p>
                <p className="text-[14px] text-red-700">
                  {itemError ?? "İşlem başarısız."}
                </p>
              </div>
            ) : null}

            {stage === "done" ? (
              <div className="space-y-2 py-4">
                <p className="text-[16px] font-semibold text-neutral-900">
                  Bitti
                </p>
                <p className={panelHintClass}>
                  {okCount} ürün güncellendi
                  {failCount > 0 ? ` · ${failCount} atlandı veya hata` : ""}.
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-neutral-100 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {stage === "setup" ? (
              <>
                <button
                  type="button"
                  className={`${panelPrimaryBtnClass} flex-1`}
                  disabled={!modelId || selected.length === 0}
                  onClick={() => void startQueue()}
                >
                  Başlat ({selected.length})
                </button>
                <button
                  type="button"
                  className={panelSecondaryBtnClass}
                  onClick={onEnd}
                >
                  Vazgeç
                </button>
              </>
            ) : null}
            {stage === "gate" ? (
              <>
                <button
                  type="button"
                  className={`${panelPrimaryBtnClass} flex-1`}
                  disabled={
                    !elbiseGateReady(
                      chips,
                      constructionCatalogFamily(undefined, current?.category) ??
                        "elbise",
                      current?.category,
                    )
                  }
                  onClick={() => void confirmCurrent()}
                >
                  Onayla ve üret
                </button>
                <button
                  type="button"
                  className={panelSecondaryBtnClass}
                  onClick={() => void skipCurrent()}
                >
                  Atla
                </button>
              </>
            ) : null}
            {stage === "itemError" ? (
              <>
                <button
                  type="button"
                  className={`${panelPrimaryBtnClass} flex-1`}
                  onClick={() => void retryCurrent()}
                >
                  Tekrar dene
                </button>
                <button
                  type="button"
                  className={panelSecondaryBtnClass}
                  onClick={() => void skipCurrent()}
                >
                  Atla
                </button>
              </>
            ) : null}
            {stage === "done" ? (
              <button
                type="button"
                className={`${panelPrimaryBtnClass} w-full`}
                onClick={onEnd}
              >
                Kapat
              </button>
            ) : null}
            {stage === "prepare" || stage === "run" ? (
              <button
                type="button"
                className={`${panelSecondaryBtnClass} w-full`}
                onClick={onMinimize}
              >
                Arka planda devam et
              </button>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
        ) : null}
      </AnimatePresence>
    </>,
    document.body,
  );
}

function formatElapsed(sec: number): string {
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function RestyleStickyChip({
  title,
  coverUrl,
  itemIndex,
  itemCount,
  phase,
  stage,
  progressPct,
  elapsedSec,
  onExpand,
}: {
  title: string;
  coverUrl: string | null;
  itemIndex: number;
  itemCount: number;
  phase: ElbiseRestyleProgressPhase;
  stage: QueueStage;
  progressPct: number;
  elapsedSec: number;
  onExpand: () => void;
}) {
  const currentStep = restyleVisualStep(stage, phase);
  const roundedPct = Math.round(progressPct);
  const stepLabel =
    currentStep === "prepare"
      ? "Analiz"
      : currentStep === "packshot"
        ? "Packshot"
        : "Model";

  return (
    <motion.button
      type="button"
      onClick={onExpand}
      aria-label={`${title} — ${stepLabel} ${roundedPct}%. Aç.`}
      className="fixed right-3 left-3 z-40 overflow-hidden rounded-xl border border-[color:var(--panel-accent-border)] bg-white text-left shadow-lg lg:right-6 lg:left-auto lg:w-[22rem] bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.28, ease: trPanelEase }}
    >
      <span className="flex items-center gap-3 px-3 py-3">
        <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-neutral-100">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold text-neutral-900">
            {title}
          </span>
          <span className="mt-0.5 block text-[12px] text-neutral-500">
            {stepLabel}
            {itemCount > 0 ? ` · ${itemIndex + 1}/${itemCount}` : ""}
            {" · "}
            {formatElapsed(elapsedSec)} · {roundedPct}%
          </span>
        </span>
        <span className="shrink-0 text-[12px] font-semibold text-[color:var(--panel-accent-deep)]">
          Aç
        </span>
      </span>
      <span
        className="relative block h-1 bg-[color:var(--panel-accent-soft)]"
        aria-hidden
      >
        <motion.span
          className="absolute inset-y-0 left-0 bg-[color:var(--panel-accent)]"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.35, ease: trPanelEase }}
        />
      </span>
    </motion.button>
  );
}

function restyleVisualStep(
  stage: QueueStage,
  phase: ElbiseRestyleProgressPhase,
): RestyleBusyStepId {
  if (stage === "prepare") return "prepare";
  if (phase === "tryon") return "tryon";
  return "packshot";
}

function restyleWaitCopy(input: {
  step: RestyleBusyStepId;
  modelLabel: string | null;
  shotCount: number;
}): string {
  if (input.step === "prepare") {
    return "Fotoğraflar okunuyor; boy, yaka ve kol önerisi hazırlanacak. 15–30 saniye sürebilir.";
  }
  if (input.step === "packshot") {
    return "Beyaz stüdyo katalog görseli üretiliyor. 30–60 saniye normaldir — bekleyin.";
  }
  const who = input.modelLabel ?? "Seçili model";
  return `${who} üzerine ${input.shotCount} kare giydiriliyor. Her kare yaklaşık 1 dakika sürebilir.`;
}

function RestyleBusyPanel({
  title,
  coverUrl,
  itemIndex,
  itemCount,
  modelLabel,
  stage,
  phase,
  progressPct,
  progressLabel,
  elapsedSec,
  shotCount,
}: {
  title: string;
  coverUrl: string | null;
  itemIndex: number;
  itemCount: number;
  modelLabel: string | null;
  stage: QueueStage;
  phase: ElbiseRestyleProgressPhase;
  progressPct: number;
  progressLabel: string;
  elapsedSec: number;
  shotCount: number;
}) {
  const currentStep = restyleVisualStep(stage, phase);
  const stepIndex = RESTYLE_BUSY_STEPS.findIndex((step) => step.id === currentStep);
  const roundedPct = Math.round(progressPct);
  const waitCopy = restyleWaitCopy({
    step: currentStep,
    modelLabel,
    shotCount,
  });
  const headline =
    currentStep === "prepare"
      ? "Elbise analiz ediliyor"
      : currentStep === "packshot"
        ? "Ön packshot üretiliyor"
        : "Model kareleri üretiliyor";

  return (
    <div className="space-y-5" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-3">
        <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-neutral-100">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold text-neutral-900">
            {title}
          </p>
          <p className={panelHintClass}>
            Ürün {itemIndex + 1} / {itemCount}
            {modelLabel ? ` · ${modelLabel}` : ""}
          </p>
        </div>
      </div>

      <ol className="grid grid-cols-3 gap-1.5">
        {RESTYLE_BUSY_STEPS.map((step, index) => {
          const done = index < stepIndex;
          const active = index === stepIndex;
          return (
            <li
              key={step.id}
              className={[
                "rounded-lg border px-2 py-2 text-center",
                active
                  ? "border-[color:var(--panel-accent)] bg-[color:var(--panel-accent-softer)]"
                  : done
                    ? "border-neutral-200 bg-neutral-50"
                    : "border-neutral-100 bg-white",
              ].join(" ")}
            >
              <p
                className={`text-[13px] font-semibold ${
                  active
                    ? "text-[color:var(--panel-accent-deep)]"
                    : done
                      ? "text-neutral-700"
                      : "text-neutral-400"
                }`}
              >
                {step.label}
              </p>
              <p
                className={`mt-0.5 text-[12px] ${
                  active
                    ? "font-medium text-neutral-800"
                    : "text-neutral-500"
                }`}
              >
                {done ? "Bitti" : active ? "Şimdi" : "Sırada"}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="space-y-2">
        <p className="text-[16px] font-semibold text-neutral-900">{headline}</p>
        {progressLabel ? (
          <p className="text-[14px] leading-snug text-neutral-700">
            {progressLabel}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[13px] font-medium text-neutral-600">İlerleme</p>
          <p className="shrink-0 text-[13px] font-semibold tabular-nums text-neutral-800">
            {formatElapsed(elapsedSec)} · {roundedPct}%
          </p>
        </div>
        <div
          className="relative h-2 overflow-hidden rounded-sm bg-[color:var(--panel-accent-soft)]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={roundedPct}
          aria-label={headline}
        >
          <motion.div
            className="h-full rounded-sm"
            style={{ background: "var(--panel-accent)" }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.35, ease: trPanelEase }}
          />
          <motion.div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <p className="text-[13px] leading-snug text-neutral-500">{waitCopy}</p>
      </div>
    </div>
  );
}
