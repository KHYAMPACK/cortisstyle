import { LookParametersPanel } from './LookParametersPanel'
import { ExportLookPackageDock } from './ExportLookPackageDock'

export function PropertiesPanel() {
  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-white/[0.06] bg-[#0F0F10]/95 backdrop-blur-md">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <p className="font-sans text-[11px] uppercase tracking-[0.12em] text-zinc-400">
          Submit Look
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <LookParametersPanel />
      </div>

      <div className="border-t border-white/[0.06] px-5 py-4">
        <ExportLookPackageDock />
      </div>
    </aside>
  )
}
