"use client";

interface WardrobeBuilderSlotZoneProps {
  label: string;
  isEmpty: boolean;
  onClick: () => void;
}

export function WardrobeBuilderSlotZone({
  label,
  isEmpty,
  onClick,
}: WardrobeBuilderSlotZoneProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pointer-events-auto h-full w-full bg-transparent transition-colors hover:bg-neutral-50/30"
      aria-label={
        isEmpty ? `Assign item to ${label}` : `Swap item in ${label}`
      }
    />
  );
}
