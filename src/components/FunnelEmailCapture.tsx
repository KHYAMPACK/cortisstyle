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

      {isDark ? (
        <form
          onSubmit={handleSubmit}
          className="my-6 mx-auto flex w-full max-w-[420px] items-stretch border border-white bg-white transition-all duration-300 focus-within:ring-2 focus-within:ring-neutral-400"
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
            className="w-full flex-grow bg-transparent px-4 py-3 font-mono text-xs text-[#0D0D0D] outline-none placeholder:text-neutral-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="h-full shrink-0 bg-[#0D0D0D] px-6 py-3 font-mono text-[10px] tracking-widest text-white uppercase transition-colors duration-200 hover:bg-neutral-800 disabled:opacity-40"
          >
            {status === "loading" ? "Sending" : submitLabel}
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="my-6 mx-auto flex w-full max-w-[420px] items-stretch border border-jet-black bg-white transition-all duration-300 focus-within:ring-2 focus-within:ring-neutral-400"
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
            className="w-full flex-grow bg-transparent px-4 py-3 font-mono text-xs text-[#0D0D0D] outline-none placeholder:text-neutral-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="h-full shrink-0 bg-[#0D0D0D] px-6 py-3 font-mono text-[10px] tracking-widest text-white uppercase transition-colors duration-200 hover:bg-neutral-800 disabled:opacity-40"
          >
            {status === "loading" ? "Sending" : submitLabel}
          </button>
        </form>
      )}

      {message ? (
        <p
          className={`font-mono text-[10px] tracking-[0.12em] ${
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
