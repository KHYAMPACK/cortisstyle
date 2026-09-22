import { Magnet, ShieldCheck, Truck } from "lucide-react";

/**
 * Trust badge strip — structural match for PopSockets' "MagSafe
 * Compatible · Licensed Grips · 290+ million sold" row. Claims kept
 * honest for a new tenant (no fabricated sales numbers).
 */
const BADGES = [
  { icon: Magnet, label: "MagSafe Uyumlu" },
  { icon: Truck, label: "Hızlı Kargo" },
  { icon: ShieldCheck, label: "Güvenli Ödeme" },
] as const;

export function TrNewTenantTrustBadges() {
  return (
    <section className="border-b border-[#E5E5E5] bg-[#0A0A0A]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-5 py-6 md:px-8">
        {BADGES.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-white">
            <Icon className="h-4 w-4 text-[#B8FF3D]" strokeWidth={2} />
            <span className="text-[13px] font-semibold">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
