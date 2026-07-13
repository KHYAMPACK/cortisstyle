"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { trHomePath } from "@/lib/tr/paths";

type Role = "top" | "bottom";

interface Lists {
  tops: string[];
  bottoms: string[];
}

function filenameFromSrc(src: string): string {
  return src.split("/").pop() ?? src;
}

async function fetchLists(): Promise<Lists> {
  const res = await fetch("/api/tr/dev/hero-import");
  const data = (await res.json()) as Lists & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Failed to load lists");
  return { tops: data.tops ?? [], bottoms: data.bottoms ?? [] };
}

export function TrHeroImportPanel() {
  const [lists, setLists] = useState<Lists>({ tops: [], bottoms: [] });
  const [skipBg, setSkipBg] = useState(false);
  const [busyRole, setBusyRole] = useState<Role | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Role | null>(null);

  const topInputRef = useRef<HTMLInputElement>(null);
  const bottomInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const next = await fetchLists();
    setLists(next);
  }, []);

  useEffect(() => {
    void refresh().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Load failed");
    });
  }, [refresh]);

  const importFiles = async (role: Role, files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;

    setError(null);
    setBusyRole(role);

    try {
      for (const file of list) {
        setStatus(
          `${role}: ${skipBg ? "normalizing" : "Photoroom → normalize"} ${file.name}…`,
        );
        const form = new FormData();
        form.append("file", file);
        form.append("role", role);
        if (skipBg) form.append("skipBg", "1");

        const res = await fetch("/api/tr/dev/hero-import", {
          method: "POST",
          body: form,
        });
        const data = (await res.json()) as Lists & {
          error?: string;
          src?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "Import failed");
        setLists({ tops: data.tops ?? [], bottoms: data.bottoms ?? [] });
      }
      setStatus(`Done — ${list.length} file(s) for ${role}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setStatus(null);
    } finally {
      setBusyRole(null);
    }
  };

  const onDelete = async (role: Role, src: string) => {
    setError(null);
    try {
      const res = await fetch("/api/tr/dev/hero-import", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, src }),
      });
      const data = (await res.json()) as Lists & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setLists({ tops: data.tops ?? [], bottoms: data.bottoms ?? [] });
      setStatus(`Removed ${filenameFromSrc(src)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const zone = (role: Role) => {
    const items = role === "top" ? lists.tops : lists.bottoms;
    const inputRef = role === "top" ? topInputRef : bottomInputRef;
    const busy = busyRole === role;

    return (
      <section
        className={`flex flex-col rounded-sm border border-neutral-300 bg-white/80 ${
          dragOver === role ? "ring-2 ring-neutral-900" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(role);
        }}
        onDragLeave={() => setDragOver((current) => (current === role ? null : current))}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(null);
          if (e.dataTransfer.files?.length) {
            void importFiles(role, e.dataTransfer.files);
          }
        }}
      >
        <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-neutral-500 uppercase">
              {role}
            </p>
            <p className="mt-0.5 text-sm text-neutral-800">
              {role === "top" ? "Tee / long sleeve (hem → waist)" : "Pants / shorts (waistband → waist)"}
            </p>
          </div>
          <button
            type="button"
            disabled={Boolean(busyRole)}
            onClick={() => inputRef.current?.click()}
            className="border border-neutral-900 bg-neutral-900 px-3 py-1.5 font-mono text-[10px] tracking-[0.14em] text-white uppercase transition hover:bg-neutral-700 disabled:opacity-40"
          >
            {busy ? "Working…" : "Choose"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                void importFiles(role, e.target.files);
                e.target.value = "";
              }
            }}
          />
        </header>

        <div className="flex min-h-[140px] flex-1 flex-col items-center justify-center border-b border-dashed border-neutral-200 px-4 py-8 text-center">
          <p className="font-mono text-[11px] tracking-[0.12em] text-neutral-500 uppercase">
            Drop images here
          </p>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-neutral-500">
            Same Photoroom path as studio, then waist-anchored normalize into{" "}
            <code className="text-[10px]">public/images/tr/hero/{role}</code>
          </p>
        </div>

        <ul className="grid max-h-[320px] grid-cols-3 gap-2 overflow-y-auto p-3 sm:grid-cols-4">
          {items.map((src) => (
            <li key={src} className="group relative aspect-[2/3] bg-[#f3f1ec]">
              <Image
                src={src}
                alt=""
                fill
                unoptimized
                className="object-contain p-1"
                sizes="120px"
              />
              <button
                type="button"
                onClick={() => void onDelete(role, src)}
                className="absolute top-1 right-1 bg-neutral-900/80 px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-white uppercase opacity-0 transition group-hover:opacity-100"
              >
                Del
              </button>
            </li>
          ))}
          {items.length === 0 ? (
            <li className="col-span-full py-6 text-center font-mono text-[10px] tracking-[0.14em] text-neutral-400 uppercase">
              Empty
            </li>
          ) : null}
        </ul>
      </section>
    );
  };

  const previewTop = lists.tops[0];
  const previewBottom = lists.bottoms[0];

  return (
    <div className="min-h-dvh bg-[#f3f1ec] text-neutral-900">
      <header className="border-b border-neutral-200 bg-white/70 px-5 py-4 md:px-8">
        <p className="font-mono text-[10px] tracking-[0.22em] text-neutral-500 uppercase">
          Local only · localhost · development
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl tracking-tight md:text-3xl">
              Hero slot import
            </h1>
            <p className="mt-1 max-w-xl text-sm text-neutral-600">
              Drag photos in — Photoroom cutout, then waist-anchored frame for the{" "}
              <Link href={trHomePath()} className="underline underline-offset-2">
                /tr
              </Link>{" "}
              outfit mixer. Boutique scoop comes later; this writes local files.
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 font-mono text-[10px] tracking-[0.12em] text-neutral-600 uppercase">
            <input
              type="checkbox"
              checked={skipBg}
              onChange={(e) => setSkipBg(e.target.checked)}
              className="rounded-none"
            />
            Already a cutout (skip Photoroom)
          </label>
        </div>
        {(status || error) && (
          <p
            className={`mt-3 font-mono text-[11px] ${
              error ? "text-red-700" : "text-neutral-600"
            }`}
            role="status"
          >
            {error ?? status}
          </p>
        )}
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 px-5 py-6 md:grid-cols-[1fr_1fr_220px] md:px-8">
        {zone("top")}
        {zone("bottom")}

        <aside className="rounded-sm border border-neutral-300 bg-white/80 p-3">
          <p className="font-mono text-[10px] tracking-[0.2em] text-neutral-500 uppercase">
            Preview
          </p>
          <p className="mt-1 text-xs text-neutral-500">First top + first bottom</p>
          <div className="relative mt-3 aspect-[2/3] bg-[#f3f1ec]">
            {previewBottom ? (
              <Image
                src={previewBottom}
                alt=""
                fill
                unoptimized
                className="object-contain"
                sizes="200px"
              />
            ) : null}
            {previewTop ? (
              <Image
                src={previewTop}
                alt=""
                fill
                unoptimized
                className="object-contain"
                sizes="200px"
              />
            ) : null}
            {!previewTop && !previewBottom ? (
              <p className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-neutral-400 uppercase">
                No pieces
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
