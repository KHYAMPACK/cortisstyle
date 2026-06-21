"use client";

import { FormEvent, useState } from "react";
import type { FunnelNotifySource } from "@/lib/funnelNotifyDb";

type NotifyStatus = "idle" | "loading" | "success" | "error";

interface FunnelEmailCaptureProps {
  source: FunnelNotifySource;
  lookId?: string;
  label: string;
  submitLabel?: string;
  placeholder?: string;
  tone?: "dark" | "light";
  className?: string;
}

export function FunnelEmailCapture({
  source,
  lookId,
  label,
  submitLabel = "Notify Me",
  placeholder = "curator@archive.com",
  tone = "dark",
  className = "",
}: FunnelEmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<NotifyStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const isDark = tone === "dark";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    try {
      const response = await fetch("/api/funnel-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source, lookId }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setMessage(
        data.message ?? "You are on the list. We will notify you when ready.",
      );
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div className={className}>
      <p
        className={`font-mono text-[9px] tracking-[0.35em] uppercase ${
          isDark ? "text-neutral-500" : "text-meta"
        }`}
      >
        {label}
      </p>

      <form
        onSubmit={handleSubmit}
        className={`mt-4 flex items-end gap-4 border-b pb-2 focus-within:border-jet-black ${
          isDark
            ? "border-neutral-700 focus-within:border-white"
            : "border-blueprint-border"
        }`}
      >
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={placeholder}
          disabled={status === "loading" || status === "success"}
          className={`w-full flex-1 bg-transparent font-mono text-xs focus:outline-none disabled:opacity-50 ${
            isDark
              ? "text-white placeholder:text-neutral-600"
              : "text-jet-black placeholder:text-neutral-400"
          }`}
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className={`shrink-0 font-mono text-[10px] tracking-[0.3em] uppercase transition-opacity hover:opacity-60 disabled:opacity-40 ${
            isDark ? "text-white" : "text-jet-black"
          }`}
        >
          {status === "loading" ? "Sending" : submitLabel}
        </button>
      </form>

      {message ? (
        <p
          className={`mt-3 font-mono text-[10px] tracking-[0.12em] ${
            status === "error"
              ? "text-red-400"
              : isDark
                ? "text-neutral-400"
                : "text-meta"
          }`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
