"use client";

import Image from "next/image";
import { useState } from "react";

const PLACEHOLDER_TONES = [
  "from-[#E8E4DC] to-[#D4CEC4]",
  "from-[#DCE8F4] to-[#B8D4EC]",
  "from-[#F0E6DC] to-[#E0D0C0]",
  "from-[#E4E8DC] to-[#D0D8C4]",
] as const;

interface MinimoraMediaProps {
  src: string;
  alt: string;
  className?: string;
  tone?: number;
  label?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  fit?: "cover" | "contain";
}

export function MinimoraMedia({
  src,
  alt,
  className = "",
  tone = 0,
  label,
  priority = false,
  fill = true,
  sizes = "(max-width: 768px) 100vw, 50vw",
  fit = "cover",
}: MinimoraMediaProps) {
  const [failed, setFailed] = useState(false);
  const gradient =
    PLACEHOLDER_TONES[tone % PLACEHOLDER_TONES.length] ??
    PLACEHOLDER_TONES[0];

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br ${gradient} ${className}`}
        aria-label={alt}
      >
        {label ? (
          <span className="px-4 text-center text-[11px] font-medium tracking-wide text-[#6B7280] uppercase">
            {label}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="relative h-full min-h-full w-full">
        <Image
          src={src}
          alt={alt}
          fill={fill}
          className={fit === "contain" ? "object-contain" : "object-cover"}
          sizes={sizes}
          priority={priority}
          onError={() => setFailed(true)}
        />
      </div>
    </div>
  );
}
