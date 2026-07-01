import { LookParametersPanel } from './LookParametersPanel'
import { ExportLookPackageDock } from './ExportLookPackageDock'
import {
  STUDIO_CHROME_BG,
  STUDIO_KICKER,
  STUDIO_RULE,
  STUDIO_SECTION_TITLE,
} from '../../lib/studioUiTokens'

export function PropertiesPanel() {
  return (
    <aside
      className={`flex w-80 shrink-0 flex-col border-l ${STUDIO_RULE} ${STUDIO_CHROME_BG}`}
    >
      <div className={`border-b ${STUDIO_RULE} px-5 py-4`}>
        <p className={STUDIO_KICKER}>Curator Export</p>
        <h2 className={`mt-1 ${STUDIO_SECTION_TITLE}`}>Outfit Package</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <LookParametersPanel />
      </div>

      <div className={`border-t ${STUDIO_RULE} px-5 py-4`}>
        <ExportLookPackageDock />
      </div>
    </aside>
  )
}
