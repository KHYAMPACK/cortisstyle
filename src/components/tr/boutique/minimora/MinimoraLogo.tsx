import Image from "next/image";

const MINIMORA_LOGO_SRC = "/tr/boutiques/minimora/logo.png?v=3";

interface MinimoraLogoProps {
  className?: string;
  priority?: boolean;
}

/** Client lockup — girl + pencil over lowercase wordmark on black. */
export function MinimoraLogo({
  className = "h-12 w-auto md:h-14",
  priority = false,
}: MinimoraLogoProps) {
  return (
    <Image
      src={MINIMORA_LOGO_SRC}
      alt="minimora"
      width={200}
      height={200}
      className={`w-auto object-contain ${className}`}
      unoptimized
      priority={priority}
    />
  );
}
