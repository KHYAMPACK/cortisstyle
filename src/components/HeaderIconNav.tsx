"use client";

import { Search } from "lucide-react";
import { ProfileButton } from "@/components/ProfileButton";

interface HeaderIconNavProps {
  className?: string;
  tone?: "default" | "inverse";
}

export function HeaderIconNav({
  className = "",
  tone = "default",
}: HeaderIconNavProps) {
  const iconClassName =
    tone === "inverse"
      ? "h-[18px] w-[18px] text-white"
      : "h-[18px] w-[18px] text-neutral-900";
  const iconProps = {
    strokeWidth: 1.5,
    className: iconClassName,
  };

  return (
    <nav
      aria-label="Global navigation"
      className={`flex items-center gap-5 md:gap-6 ${className}`}
    >
      <button
        type="button"
        aria-label="Search"
        className="transition-opacity hover:opacity-60"
      >
        <Search {...iconProps} />
      </button>

      <ProfileButton tone={tone} />
    </nav>
  );
}
