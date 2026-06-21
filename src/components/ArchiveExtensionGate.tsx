import { FunnelEmailCapture } from "@/components/FunnelEmailCapture";

export function ArchiveExtensionGate() {
  return (
    <article className="col-span-1 sm:col-span-2 md:col-span-3">
      <div className="border border-jet-black bg-[#0D0D0D] px-6 py-10 text-white md:px-10 md:py-14">
        <p className="font-mono text-[10px] tracking-[0.45em] text-neutral-400 uppercase">
          [ ARCHIVE EXTENSION // DEPLOYING SOON ]
        </p>

        <FunnelEmailCapture
          source="archive-extension"
          label="Enter your email to unlock the full archive stream when ready"
          submitLabel="Unlock Stream"
          tone="dark"
          className="mt-8 max-w-xl"
        />
      </div>
    </article>
  );
}
