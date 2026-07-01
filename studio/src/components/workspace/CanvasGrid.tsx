interface CanvasGridProps {
  panX: number
  panY: number
  zoom: number
}

const GRID_SIZE = 64

export function CanvasGrid({ panX, panY, zoom }: CanvasGridProps) {
  const cell = GRID_SIZE * zoom
  const offsetX = panX % cell
  const offsetY = panY % cell

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundColor: '#0D0D0D',
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
          `,
          backgroundSize: `${cell}px ${cell}px`,
          backgroundPosition: `${offsetX}px ${offsetY}px`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 85% 75% at 50% 45%, transparent 0%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </>
  )
}
