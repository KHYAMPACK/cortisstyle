export function SiteHeader() {
  return (
    <header className="flex flex-col gap-6 border-b border-neutral-200 px-5 py-10 md:flex-row md:items-end md:justify-between md:px-10 md:py-14">
      <div>
        <p className="mb-3 text-[9px] tracking-[0.5em] text-neutral-400 uppercase">
          SS26 Collection
        </p>
        <h1 className="font-serif text-4xl leading-none tracking-[-0.02em] text-neutral-950 md:text-6xl">
          Cortis
          <span className="font-light text-neutral-300"> Style</span>
        </h1>
      </div>

      <p className="max-w-xs text-[11px] leading-relaxed tracking-[0.08em] text-neutral-500 md:text-right">
        An editorial study in form, silhouette, and restraint.
        Curated looks for the new season.
      </p>
    </header>
  );
}
