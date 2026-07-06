interface TrSectionHeaderProps {
  kicker: string;
  title: string;
  description?: string;
}

export function TrSectionHeader({ kicker, title, description }: TrSectionHeaderProps) {
  return (
    <div className="border-b border-blueprint-border px-5 py-8 md:px-10 md:py-10">
      <p className="text-meta text-[9px] tracking-[0.5em] uppercase">{kicker}</p>
      <h2 className="mt-3 font-serif text-2xl leading-none tracking-[-0.02em] text-neutral-950 md:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="text-meta mt-3 max-w-2xl text-[11px] leading-relaxed tracking-[0.08em]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
