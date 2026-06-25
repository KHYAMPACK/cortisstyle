import Image from "next/image";

const LOGO_PATHS = {
  light: "/brand/cortisstyle-logo-light.png",
  dark: "/brand/cortisstyle-logo-dark.png",
} as const;

export type BrandLogoVariant = keyof typeof LOGO_PATHS;

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  className?: string;
  priority?: boolean;
}

export function BrandLogo({
  variant = "light",
  className = "h-9 w-auto",
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src={LOGO_PATHS[variant]}
      alt="Cortisstyle"
      width={512}
      height={512}
      priority={priority}
      className={className}
    />
  );
}
