import { forwardRef } from 'react'
import s from './CanvasLayer.module.css'

interface CanvasLayerProps {
  className?: string
}

export const CanvasLayer = forwardRef<HTMLCanvasElement, CanvasLayerProps>(
  ({ className }, ref) => (
    <canvas ref={ref} className={`${s.root} ${className ?? ''}`} />
  )
)

CanvasLayer.displayName = 'CanvasLayer'
