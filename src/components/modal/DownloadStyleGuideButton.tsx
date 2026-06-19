"use client";

import { useState } from "react";
import { downloadStyleGuidePdf } from "@/lib/downloadStyleGuide";

interface DownloadStyleGuideButtonProps {
  lookId: string;
  buyerName?: string;
  className?: string;
}

export function DownloadStyleGuideButton({
  lookId,
  buyerName = "Archive Curator",
  className = "",
}: DownloadStyleGuideButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      await downloadStyleGuidePdf(lookId, buyerName);
    } catch (downloadError) {
      const message =
        downloadError instanceof Error
          ? downloadError.message
          : "Download failed.";
      setError(message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        className="w-full border border-neutral-300 px-5 py-3 text-[10px] tracking-[0.3em] text-neutral-700 uppercase transition-colors hover:border-neutral-900 hover:text-neutral-900 disabled:cursor-wait disabled:opacity-60"
      >
        {isDownloading ? "Generating PDF…" : "Download Style Guide PDF"}
      </button>
      {error ? (
        <p className="mt-2 text-[10px] tracking-[0.12em] text-red-600 uppercase">
          {error}
        </p>
      ) : null}
    </div>
  );
}
