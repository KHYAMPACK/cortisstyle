import {
  TrDashboardDelta,
  TrDashboardRateDelta,
} from "@/components/tr/panel/dashboard/TrDashboardDelta";
import {
  formatCount,
  formatDecimal,
  formatRate,
} from "@/components/tr/panel/dashboard/dashboardFormat";
import { panelCardClass } from "@/components/tr/panel/panelUi";
import {
  computeDelta,
  type TrOwnerDashboard,
} from "@/lib/tr/panel/dashboardMetrics";
import { formatTryFromKurus } from "@/types/tr-marketplace";

function GrowthRow({
  label,
  hint,
  value,
  delta,
}: {
  label: string;
  hint: string;
  value: string;
  delta: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium text-neutral-900">{label}</p>
        <p className="mt-0.5 text-[12.5px] text-neutral-500">{hint}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="text-[1.05rem] font-semibold tabular-nums text-neutral-900">
          {value}
        </p>
        {delta}
      </div>
    </li>
  );
}

/** How well the store converts, retains and grows its baskets. */
export function TrDashboardGrowth({
  dashboard,
  compare,
}: {
  dashboard: TrOwnerDashboard;
  compare: boolean;
}) {
  const { current, previous, offersCardPayments } = dashboard;

  return (
    <section className={panelCardClass}>
      <h2 className="text-[14px] font-semibold text-neutral-900">
        Büyüme Metrikleri
      </h2>
      <ul className="mt-2 divide-y divide-neutral-100">
        {offersCardPayments ? (
          <GrowthRow
            label="Ödeme Tamamlama Oranı"
            hint={
              current.paymentAttempts === 0
                ? "Bu dönemde kart ödemesi denenmedi"
                : `${formatCount(current.paymentAttempts)} ödeme denemesi üzerinden`
            }
            value={formatRate(current.paymentCompletionRate)}
            delta={
              compare ? (
                <TrDashboardRateDelta
                  current={current.paymentCompletionRate}
                  previous={previous.paymentCompletionRate}
                />
              ) : null
            }
          />
        ) : null}
        <GrowthRow
          label="Tekrar Alışveriş Oranı"
          hint={
            current.customerCount === 0
              ? "Bu dönemde müşteri yok"
              : `${formatCount(current.customerCount)} müşteri üzerinden`
          }
          value={formatRate(current.repeatRate)}
          delta={
            compare ? (
              <TrDashboardRateDelta
                current={current.repeatRate}
                previous={previous.repeatRate}
              />
            ) : null
          }
        />
        <GrowthRow
          label="Ort. Sepet Büyüklüğü"
          hint="Siparişteki ortalama ürün adedi"
          value={
            current.orderCount === 0
              ? "—"
              : `${formatDecimal(current.itemsPerOrder)} ürün`
          }
          delta={
            compare ? (
              <TrDashboardDelta
                delta={computeDelta(current.itemsPerOrder, previous.itemsPerOrder)}
              />
            ) : null
          }
        />
        <GrowthRow
          label="Ort. Ürün Fiyatı"
          hint="Satılan bir ürünün ortalama fiyatı"
          value={
            current.itemCount === 0
              ? "—"
              : formatTryFromKurus(current.averageItemPriceKurus)
          }
          delta={
            compare ? (
              <TrDashboardDelta
                delta={computeDelta(
                  current.averageItemPriceKurus,
                  previous.averageItemPriceKurus,
                )}
              />
            ) : null
          }
        />
      </ul>
    </section>
  );
}
