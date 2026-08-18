"use client";

import Image from "next/image";

/** SVG logos skip the Next optimizer (blocked unless dangerouslyAllowSVG). */
export function TrPanelBoutiqueLogo({
  src,
  size,
  className,
}: {
  src: string;
  size: number;
  className: string;
}) {
  const svg = src.toLowerCase().includes(".svg");
  if (svg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" width={size} height={size} className={className} />
    );
  }
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className={className}
    />
  );
}
