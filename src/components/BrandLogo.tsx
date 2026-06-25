import Image from "next/image";

/** White mark on black tile — uploaded at public/brand/cortisstyle-logo-light.png */
const LOGO_SRC = "/brand/cortisstyle-logo-light.png";

export type BrandLogoVariant = "onLight" | "onDark";

interface BrandLogoProps {
  /** `onLight` = dark mark for light surfaces. `onDark` = light mark for dark surfaces. */
  variant?: BrandLogoVariant;
  className?: string;
  priority?: boolean;
}

export function BrandLogo({
  variant = "onLight",
  className = "h-10 w-auto",
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt="Cortisstyle"
      width={1024}
      height={1024}
      priority={priority}
      unoptimized
      className={`${className} ${variant === "onLight" ? "invert" : ""}`}
    />
  );
}
