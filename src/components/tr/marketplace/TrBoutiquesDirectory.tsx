"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { TrBoutiqueCard } from "@/components/tr/TrBoutiqueCard";
import { trBoutiquesPath } from "@/lib/tr/paths";
import { trPanelFadeTransition } from "@/components/tr/panel/TrPanelMotion";
import type { TrBoutiquePublic } from "@/types/tr-marketplace";

export interface TrBoutiqueDirectoryEntry {
  boutique: TrBoutiquePublic;
  productCount?: number;
  coverImage?: string | null;
}

interface TrBoutiquesDirectoryProps {
  entries: TrBoutiqueDirectoryEntry[];
  initialQ?: string;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("tr");
}

export function TrBoutiquesDirectory({
  entries,
  initialQ = "",
}: TrBoutiquesDirectoryProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(initialQ);

  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

  const syncUrl = (nextQ: string) => {
    startTransition(() => {
      router.replace(trBoutiquesPath({ q: nextQ || undefined }), {
        scroll: false,
      });
    });
  };

  const filtered = useMemo(() => {
    const query = normalize(q);
    if (!query) return entries;
    return entries.filter((entry) =>
      normalize(entry.boutique.name).includes(query),
    );
  }, [entries, q]);

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    syncUrl(q);
  };

  return (
    <div>
      <div className="border-b border-black/10 px-5 py-5 md:px-10">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col gap-4 md:flex-row md:items-center"
        >
          <label className="relative block flex-1">
            <span className="sr-only">Butik ara</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
              strokeWidth={1.5}
            />
            <input
              type="search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              onBlur={() => syncUrl(q)}
              placeholder="Butik adı ara…"
              className="w-full border border-black/15 bg-white py-3 pr-4 pl-10 font-cadde-nav text-[13px] tracking-[0.06em] text-jet-black outline-none transition-colors placeholder:text-neutral-400 focus:border-jet-black"
            />
          </label>
          <button
            type="submit"
            className="shrink-0 border border-jet-black bg-jet-black px-6 py-3 font-cadde-nav text-[10px] tracking-[0.22em] text-white uppercase transition-opacity hover:opacity-80"
          >
            Ara
          </button>
        </form>
      </div>

      <motion.div
        key={`${q}|${filtered.length}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: isPending ? 0.7 : 1, y: 0 }}
        transition={trPanelFadeTransition}
        className="px-5 py-10 md:px-10"
      >
        <p className="mb-6 font-cadde-nav text-[10px] tracking-[0.22em] text-neutral-500 uppercase">
          {filtered.length} butik
        </p>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((entry) => (
              <TrBoutiqueCard
                key={entry.boutique.id}
                boutique={entry.boutique}
                productCount={entry.productCount}
                coverImage={entry.coverImage}
              />
            ))}
          </div>
        ) : (
          <p className="py-8 text-[13px] text-neutral-600">
            Bu aramayla butik bulunamadı.
          </p>
        )}
      </motion.div>
    </div>
  );
}
