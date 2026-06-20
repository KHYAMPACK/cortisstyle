import Image from "next/image";
import {
  resolveGuideAssetInnerSize,
} from "@/lib/guideAssetScale";

interface GuideAssetPreviewBoxProps {
  imageSrc?: string;
  alt: string;
  scaleFactor: number;
  frameSize: number;
  blurred?: boolean;
}

export function GuideAssetPreviewBox({
  imageSrc,
  alt,
  scaleFactor,
  frameSize,
  blurred = false,
}: GuideAssetPreviewBoxProps) {
  const innerSize = resolveGuideAssetInnerSize(frameSize, scaleFactor);
  const imageBlur = blurred ? "blur-[2px] opacity-70" : "";

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden border border-neutral-800 bg-[#111111]"
      style={{ width: frameSize, height: frameSize }}
    >
      {imageSrc ? (
        <div
          className="relative max-h-full max-w-full"
          style={{ width: innerSize, height: innerSize }}
        >
          <Image
            src={imageSrc}
            alt={alt}
            fill
            unoptimized
            sizes={`${frameSize}px`}
            className={`max-h-full max-w-full object-contain ${imageBlur}`}
          />
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[4px] tracking-[0.2em] text-neutral-600 uppercase">
          Asset
        </div>
      )}
    </div>
  );
}
