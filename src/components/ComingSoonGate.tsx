"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type NotifyStatus = "idle" | "loading" | "success" | "error";

export function ComingSoonGate() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<NotifyStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    try {
      const response = await fetch("/api/wardrobe-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
        data.message ?? "You are on the list. We will notify you at deploy.",
      );
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#0D0D0D] px-6 py-24 text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
        <p className="font-mono text-[10px] tracking-[0.45em] text-neutral-400 uppercase">
          [ STATUS // UNDER DEVELOPMENT FOR SS26 ]
        </p>

        <h1 className="mt-8 font-serif text-[clamp(2.75rem,10vw,5.5rem)] leading-[0.92] font-light tracking-[0.22em] uppercase">
          Wardrobe
          <br />
          Studio
        </h1>

        <div className="mt-14 w-full max-w-md">
          <p className="font-mono text-[9px] tracking-[0.35em] text-neutral-500 uppercase">
            Sign up to get notified when we deploy
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-5 flex items-end gap-4 border-b border-neutral-700 pb-2 focus-within:border-white"
          >
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="curator@archive.com"
              disabled={status === "loading" || status === "success"}
              className="w-full max-w-[320px] flex-1 bg-transparent font-mono text-xs text-white placeholder:text-neutral-600 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className="shrink-0 font-mono text-[10px] tracking-[0.3em] text-white uppercase transition-opacity hover:opacity-60 disabled:opacity-40"
            >
              {status === "loading" ? "Sending" : "Notify Me"}
            </button>
          </form>

          {message ? (
            <p
              className={`mt-4 font-mono text-[10px] tracking-[0.12em] ${
                status === "error" ? "text-red-300" : "text-neutral-400"
              }`}
              role="status"
            >
              {message}
            </p>
          ) : null}
        </div>

        <Link
          href="/"
          className="mt-16 font-mono text-[10px] tracking-[0.35em] text-neutral-500 uppercase transition-colors hover:text-white"
        >
          ← Return to Lookbook
        </Link>
      </div>
    </section>
  );
}
