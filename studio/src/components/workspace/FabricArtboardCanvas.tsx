import { useRef } from 'react'
import { useFabricArtboard } from '../../hooks/useFabricArtboard'

export function FabricArtboardCanvas() {
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  useFabricArtboard(canvasElRef)

  // Dimensions owned by Fabric (logical 420×630 + retina backing store)
  return (
    <canvas
      ref={canvasElRef}
      className="block touch-none"
      onPointerDown={(event) => event.stopPropagation()}
    />
  )
}
