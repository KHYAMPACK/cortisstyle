"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { MOOD_IMAGE_LIBRARY } from "@/data/moodImageLibrary";

type MoodInputMode = "library" | "upload" | "camera";

const MODE_OPTIONS: { id: MoodInputMode; label: string }[] = [
  { id: "library", label: "Select from Library" },
  { id: "upload", label: "Upload File" },
  { id: "camera", label: "Take Photo" },
];

interface MoodImageInputMatrixProps {
  moodImageUrl: string | null;
  isProcessing: boolean;
  error: string | null;
  onSelectLibraryAsset: (url: string) => void;
  onUploadFile: (file: File) => Promise<void>;
  onClear: () => void;
}

export function MoodImageInputMatrix({
  moodImageUrl,
  isProcessing,
  error,
  onSelectLibraryAsset,
  onUploadFile,
  onClear,
}: MoodImageInputMatrixProps) {
  const [mode, setMode] = useState<MoodInputMode>("library");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await onUploadFile(file);
    event.target.value = "";
  };

  const handleDrop = async (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await onUploadFile(file);
  };

  return (
    <div className="min-w-0">
      <span className="text-meta mb-2 block font-mono text-[9px] tracking-[0.25em] uppercase sm:tracking-[0.35em]">
        Mood Image Overlay
      </span>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-0 sm:border sm:border-blueprint-border">
        {MODE_OPTIONS.map((option) => {
          const isActive = mode === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setMode(option.id)}
              className={`border border-blueprint-border px-2 py-2 font-mono text-[8px] leading-snug tracking-[0.1em] uppercase transition-colors sm:border-0 sm:border-r sm:px-2 sm:text-[7px] sm:tracking-[0.12em] sm:last:border-r-0 ${
                isActive
                  ? "bg-blueprint-selected text-jet-black"
                  : "bg-canvas-paper text-neutral-500 hover:bg-blueprint-surface"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="min-w-0 border border-blueprint-border border-t-0 bg-blueprint-surface/30 px-3 py-3 sm:border-t-0">
        {mode === "library" ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {MOOD_IMAGE_LIBRARY.map((asset) => {
              const isSelected = moodImageUrl === asset.url;

              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => onSelectLibraryAsset(asset.url)}
                  className={`relative h-[72px] w-[54px] shrink-0 overflow-hidden border transition-colors ${
                    isSelected
                      ? "border-jet-black"
                      : "border-blueprint-border hover:border-blueprint-accent"
                  }`}
                  title={asset.label}
                >
                  <Image
                    src={asset.url}
                    alt={asset.label}
                    fill
                    sizes="54px"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
        ) : null}

        {mode === "upload" ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex w-full flex-col items-center justify-center gap-2 border border-dashed px-3 py-4 transition-colors ${
              isDragging
                ? "border-blueprint-accent bg-blueprint-selected"
                : "border-blueprint-border bg-canvas-paper hover:border-blueprint-accent"
            }`}
          >
            {moodImageUrl ? (
              <div className="relative aspect-[3/4] w-[64px] overflow-hidden border border-neutral-100">
                <Image
                  src={moodImageUrl}
                  alt="Mood preview"
                  fill
                  unoptimized
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            ) : null}
            <span className="font-mono text-[8px] tracking-[0.18em] text-neutral-400 uppercase">
              {isProcessing
                ? "Processing..."
                : moodImageUrl
                  ? "Replace File"
                  : "Drag & Drop or Click to Upload"}
            </span>
          </button>
        ) : null}

        {mode === "camera" ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <label
              htmlFor="camera-capture-input"
              className="w-full cursor-pointer border border-jet-black bg-jet-black px-3 py-2.5 text-center font-mono text-[8px] tracking-[0.22em] text-white uppercase transition-colors hover:bg-neutral-800"
            >
              // Trigger Camera Interfaces
            </label>
            <span className="font-mono text-[7px] tracking-[0.14em] text-neutral-400 uppercase">
              Mobile capture // environment lens
            </span>
          </div>
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isProcessing}
        />
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          id="camera-capture-input"
          onChange={handleFileChange}
          disabled={isProcessing}
        />
      </div>

      {error ? (
        <p className="mt-2 font-mono text-[10px] tracking-[0.12em] text-red-600 uppercase">
          {error}
        </p>
      ) : null}

      {moodImageUrl ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-2 font-mono text-[9px] tracking-[0.2em] text-neutral-400 uppercase transition-colors hover:text-neutral-900"
        >
          Remove Mood Image
        </button>
      ) : null}
    </div>
  );
}
