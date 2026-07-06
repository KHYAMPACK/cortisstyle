interface TrCheckoutComingSoonProps {
  className?: string;
}

export function TrCheckoutComingSoon({ className = "" }: TrCheckoutComingSoonProps) {
  return (
    <div
      className={`border border-black/10 bg-white/60 px-4 py-4 text-[12px] leading-relaxed text-neutral-600 ${className}`}
      role="status"
    >
      Online ödeme yakında açılacak. Sipariş için butiğin iletişim kanallarını
      kullanın.
    </div>
  );
}
