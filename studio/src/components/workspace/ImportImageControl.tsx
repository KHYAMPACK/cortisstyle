import { useRef } from 'react'

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
        className="border border-white/[0.1] px-3 py-1.5 font-sans text-[11px] font-medium tracking-[0.04em] text-zinc-300 transition-all duration-300 hover:border-white/25 hover:bg-white hover:text-black"
        onClick={() => inputRef.current?.click()}
      >
        Import File
      </button>
    </>
  )
}
