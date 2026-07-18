import { useRef } from 'react'
import s from './RotationDial.module.css'

interface Props {
  value: number
  onChange: (deg: number) => void
}

const TICKS = [0, 45, 90, 135, 180, 225, 270, 315]
const CX = 29, CY = 29, R = 21

function anglFromEvent(e: React.PointerEvent<SVGSVGElement>): number {
  const rect = e.currentTarget.getBoundingClientRect()
  const dx = e.clientX - rect.left - CX
  const dy = e.clientY - rect.top  - CY
  return Math.round(((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360)
}

export function RotationDial({ value, onChange }: Props) {
  const dragging = useRef(false)

  const rad = (value * Math.PI) / 180
  const hx  = CX + R * Math.sin(rad)
  const hy  = CY - R * Math.cos(rad)

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    onChange(anglFromEvent(e))
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragging.current) return
    onChange(anglFromEvent(e))
  }

  function onPointerUp() {
    dragging.current = false
  }

  return (
    <div className={s.root}>
      <svg
        width="58"
        height="58"
        viewBox="0 0 58 58"
        className={s.svg}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        aria-label={`Rotation: ${value}°`}
      >
        <circle cx={CX} cy={CY} r={23} stroke="var(--border)" strokeWidth="1.5" fill="none" />
        {TICKS.map(t => {
          const tr    = (t * Math.PI) / 180
          const inner = t % 90 === 0 ? 17 : 19
          return (
            <line
              key={t}
              x1={CX + 23 * Math.sin(tr)}
              y1={CY - 23 * Math.cos(tr)}
              x2={CX + inner * Math.sin(tr)}
              y2={CY - inner * Math.cos(tr)}
              stroke="var(--border)"
              strokeWidth="1"
              strokeLinecap="round"
            />
          )
        })}
        {/* Needle */}
        <line
          x1={CX} y1={CY}
          x2={hx} y2={hy}
          stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"
        />
        {/* Centre dot */}
        <circle cx={CX} cy={CY} r={3.5} fill="var(--accent)" />
        {/* Draggable handle */}
        <circle
          cx={hx} cy={hy} r={5}
          fill="var(--accent)"
          stroke="var(--bg-1)"
          strokeWidth="1.5"
          className={s.handle}
        />
      </svg>
      <span className={s.val}>{value}°</span>
    </div>
  )
}
