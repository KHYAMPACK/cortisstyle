"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Tag } from "lucide-react";
import { TrDashboardDelta } from "@/components/tr/panel/dashboard/TrDashboardDelta";
import { formatCount } from "@/components/tr/panel/dashboard/dashboardFormat";
import { useOwnerCategoryName } from "@/components/tr/panel/useOwnerCategories";
import { panelCardClass } from "@/components/tr/panel/panelUi";
import {
  TrPanelStagger,
  trPanelEase,
  trPanelStaggerItem,
} from "@/components/tr/panel/TrPanelMotion";
import {
  computeDelta,
  type TrOwnerDashboard,
} from "@/lib/tr/panel/dashboardMetrics";
import { formatTryFromKurus } from "@/types/tr-marketplace";

type Grouping = "products" | "categories";

interface Row {
  key: string;
  title: string;
  subtitle: string;
  image: string | null;
  revenueKurus: number;
  previousRevenueKurus: number;
}

function RevenueBar({ share }: { share: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <div
      className="mt-1.5 h-1 overflow-hidden rounded-full bg-neutral-100"
      role="presentation"
    >
      <motion.div
        className="h-full rounded-full bg-[color:var(--panel-accent)]"
        initial={reduceMotion ? false : { width: 0 }}
        animate={{ width: `${Math.max(3, Math.round(share * 100))}%` }}
        transition={{ duration: 0.6, ease: trPanelEase }}
      />
    </div>
  );
}

function Thumb({ image, title }: { image: string | null; title: string }) {
  return (
    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[color:var(--panel-accent-soft)]">
      {image ? (
        <Image
          src={image}
          alt=""
          fill
          className="object-cover"
          sizes="44px"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[13px] font-semibold text-neutral-500">
          {title.slice(0, 1)}
        </span>
      )}
    </span>
  );
}

/** Best sellers by revenue, switchable between products and categories. */
export function TrDashboardTopSellers({
  boutiqueId,
  dashboard,
  compare,
}: {
  boutiqueId: string;
  dashboard: TrOwnerDashboard;
  compare: boolean;
}) {
  const [grouping, setGrouping] = useState<Grouping>("products");
  const categoryName = useOwnerCategoryName(boutiqueId);

  const rows: Row[] =
    grouping === "products"
      ? dashboard.topProducts.map((product, index) => ({
          key: `${product.productId ?? "deleted"}-${index}`,
          title: product.title,
          subtitle: `${formatCount(product.quantity)} adet${
            categoryName(product.category)
              ? ` · ${categoryName(product.category)}`
              : ""
          }`,
          image: product.image,
          revenueKurus: product.revenueKurus,
          previousRevenueKurus: product.previousRevenueKurus,
        }))
      : dashboard.topCategories.map((entry) => ({
          key: entry.category ?? "uncategorised",
          title: entry.category
            ? (categoryName(entry.category) ?? entry.category)
            : "Kategorisiz",
          subtitle: `${formatCount(entry.quantity)} adet`,
          image: null,
          revenueKurus: entry.revenueKurus,
          previousRevenueKurus: entry.previousRevenueKurus,
        }));

  const top = rows.reduce((max, row) => Math.max(max, row.revenueKurus), 0);

  return (
    <section className={panelCardClass}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[14px] font-semibold text-neutral-900">
          En Çok Satanlar
        </h2>
        <label className="relative">
          <span className="sr-only">Gruplama</span>
          <select
            value={grouping}
            onChange={(event) => setGrouping(event.target.value as Grouping)}
            className="min-h-9 cursor-pointer appearance-none rounded-lg border border-neutral-200 bg-white py-1.5 pr-8 pl-3 text-[13px] font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--panel-accent-deep)]"
          >
            <option value="products">Ürünler</option>
            <option value="categories">Kategoriler</option>
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-neutral-500"
            strokeWidth={1.75}
            aria-hidden
          />
        </label>
      </div>

      {rows.length === 0 ? (
        <p className="py-10 text-center text-[13.5px] text-neutral-500">
          Bu dönemde satış yok.
        </p>
      ) : (
        <TrPanelStagger
          key={grouping}
          className="mt-3 divide-y divide-neutral-100"
        >
          {rows.map((row, index) => (
            <motion.div
              key={row.key}
              variants={trPanelStaggerItem}
              className="flex items-center gap-3 py-3"
            >
              <span className="w-4 shrink-0 text-center text-[12px] font-medium tabular-nums text-neutral-400">
                {index + 1}
              </span>
              {grouping === "products" ? (
                <Thumb image={row.image} title={row.title} />
              ) : (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[color:var(--panel-accent-soft)] text-[color:var(--panel-accent-deep)]">
                  <Tag className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium text-neutral-900">
                  {row.title}
                </p>
                <p className="truncate text-[12.5px] text-neutral-500">
                  {row.subtitle}
                </p>
                <RevenueBar share={top === 0 ? 0 : row.revenueKurus / top} />
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <p className="text-[13.5px] font-semibold tabular-nums text-neutral-900">
                  {formatTryFromKurus(row.revenueKurus)}
                </p>
                {compare ? (
                  <TrDashboardDelta
                    delta={computeDelta(
                      row.revenueKurus,
                      row.previousRevenueKurus,
                    )}
                  />
                ) : null}
              </div>
            </motion.div>
          ))}
        </TrPanelStagger>
      )}
    </section>
  );
}
