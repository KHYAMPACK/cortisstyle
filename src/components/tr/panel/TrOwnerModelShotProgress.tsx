"use client";

import { AnimatePresence, motion } from "framer-motion";
import { trPanelEase } from "@/components/tr/panel/TrPanelMotion";

const ease = trPanelEase;

function ModelBusySpinner({
  className = "",
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "accent";
}) {
  const border =
    tone === "light"
      ? "border-white border-t-transparent"
      : "border-[color:var(--panel-accent)] border-t-transparent";
  return (
    <motion.span
      aria-hidden
      className={`inline-block shrink-0 rounded-full border-2 ${border} ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }}
    />
  );
}

export function TrOwnerModelShotProgress({
  urls,
  shotCount,
  busy,
  regenerating,
  progressPct,
  progressLabel,
  shotLabels,
}: {
  urls: string[];
  shotCount: number;
  busy: boolean;
  regenerating: boolean;
  progressPct: number;
  progressLabel: string;
  shotLabels?: string[];
}) {
  const roundedPct = Math.round(Math.min(100, Math.max(0, progressPct)));
  const tiles = Math.max(shotCount, urls.length, busy ? 1 : 0);
  if (tiles === 0) return null;

  const hasAnyUrl = urls.some((url) => Boolean(url?.trim()));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease }}
      className={tiles > 1 ? "grid grid-cols-2 gap-3" : "sm:max-w-xs"}
      aria-live="polite"
      aria-busy={busy}
    >
      {Array.from({ length: tiles }, (_, index) => {
        const src = urls[index]?.trim() || "";
        const label = shotLabels?.[index] ?? (tiles > 1 ? `Kare ${index + 1}` : "Model");
        const shotBusy = busy && (regenerating || !src);
        const showPending = busy && !src && !regenerating;
        return (
          <div key={`${index}-${src || "pending"}`} className="space-y-2">
            <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-white">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt=""
                  className={`h-full w-full object-cover transition-[filter,opacity,transform] duration-500 ease-out ${
                    shotBusy && regenerating
                      ? "scale-[1.03] opacity-45 blur-[2px]"
                      : "scale-100 opacity-100 blur-0"
                  }`}
                />
              ) : (
                <div className="absolute inset-0 bg-[color:var(--panel-accent-soft)]" />
              )}
              <AnimatePresence>
                {showPending ? (
                  <motion.div
                    key={`pending-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease }}
                    className="absolute inset-0"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
                      <ModelBusySpinner className="h-8 w-8" tone="accent" />
                      <p className="text-[13px] font-semibold text-neutral-800">
                        {tiles > 1
                          ? `Kare ${index + 1}/${tiles}`
                          : "Model oluşturuluyor"}
                      </p>
                      <p className="text-[12px] text-neutral-600">
                        {progressLabel || "Hazırlanıyor…"}
                      </p>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 space-y-1.5 p-4">
                      <div className="flex justify-between text-[11px] font-semibold tabular-nums text-neutral-700">
                        <span>İlerleme</span>
                        <span>{roundedPct}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/70">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: "var(--panel-accent)" }}
                          animate={{ width: `${progressPct}%` }}
                          transition={{ duration: 0.35, ease }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : null}
                {shotBusy && regenerating && src ? (
                  <motion.div
                    key={`regen-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease }}
                    className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-black/70 via-black/35 to-black/10 p-4"
                  >
                    <div className="mb-auto mt-10 flex flex-col items-center gap-3 text-center">
                      <ModelBusySpinner className="h-8 w-8" />
                      <p className="text-[13px] font-semibold tracking-[0.04em] text-white uppercase">
                        Yenileniyor
                      </p>
                    </div>
                    <div className="w-full space-y-2">
                      <div className="flex items-end justify-between gap-2">
                        <p className="min-w-0 text-[12px] leading-snug text-white/90">
                          {progressLabel || "İşleniyor…"}
                        </p>
                        <span className="shrink-0 text-[12px] font-semibold tabular-nums text-white">
                          {roundedPct}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
                        <motion.div
                          className="h-full rounded-full bg-white"
                          animate={{ width: `${progressPct}%` }}
                          transition={{ duration: 0.35, ease }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
            <p className="text-[13px] font-semibold text-neutral-800">
              {label}
            </p>
          </div>
        );
      })}
      {hasAnyUrl && !busy ? (
        <p
          className={`text-[13px] font-medium text-emerald-800 ${
            tiles > 1 ? "col-span-full" : ""
          }`}
        >
          {urls.filter((url) => url.trim()).length > 1
            ? `${urls.filter((url) => url.trim()).length} model karesi hazır.`
            : "Model fotoğrafı hazır."}
        </p>
      ) : null}
    </motion.div>
  );
}
