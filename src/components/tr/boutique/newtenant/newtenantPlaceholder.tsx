/**
 * Shared placeholder visual for homepage sections that need product/
 * lifestyle photography we don't have yet (hero slides, promo tiles,
 * banners). Diagonal stripe pattern in the tenant palette + an
 * acid-green label pill, so it reads as an intentional stand-in
 * rather than a broken image. Swap for real photography per section
 * once shot — nothing else about the layout needs to change.
 */
interface TrNewTenantPlaceholderMediaProps {
  label: string;
  className?: string;
  dark?: boolean;
}

export function TrNewTenantPlaceholderMedia({
  label,
  className = "",
  dark = false,
}: TrNewTenantPlaceholderMediaProps) {
  const stripeA = dark ? "#FAFAFA0d" : "#17171712";
  const stripeB = "transparent";
  return (
    <div
      className={`flex items-center justify-center ${dark ? "bg-[#171717]" : "bg-[#F0F0F0]"} ${className}`}
      style={{
        backgroundImage: `repeating-linear-gradient(135deg, ${stripeA} 0px, ${stripeA} 2px, ${stripeB} 2px, ${stripeB} 16px)`,
      }}
    >
      <span className="rounded-full bg-[#B8FF3D] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#0A0A0A]">
        {label}
      </span>
    </div>
  );
}
