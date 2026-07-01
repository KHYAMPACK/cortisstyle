import { useRef } from 'react'
import { STUDIO_BTN_SECONDARY } from '../../lib/studioUiTokens'

interface ImportImageControlProps {
  onImportFile: (file: File) => void
}

export function ImportImageControl({ onImportFile }: ImportImageControlProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onImportFile(file)
          event.target.value = ''
        }}
      />
      <button
        type="button"
        className={STUDIO_BTN_SECONDARY}
        onClick={() => inputRef.current?.click()}
      >
        Import File
      </button>
    </>
  )
}
