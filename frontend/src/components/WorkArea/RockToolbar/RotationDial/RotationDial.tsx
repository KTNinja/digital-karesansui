import s from './RotationDial.module.css'

interface Props {
  value: number
  onChange: (deg: number) => void
}

const TICKS = [0, 45, 90, 135, 180, 225, 270, 315]

export function RotationDial({ value, onChange }: Props) {
  const rad = (value * Math.PI) / 180
  const cx = 29
  const cy = 29
  const r = 21
  const hx = cx + r * Math.sin(rad)
  const hy = cy - r * Math.cos(rad)

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const dx = e.clientX - rect.left - cx
    const dy = e.clientY - rect.top - cy
    const deg = Math.round(((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360)
    onChange(deg)
  }

  return (
    <div className={s.root}>
      <svg
        width="58"
        height="58"
        viewBox="0 0 58 58"
        className={s.svg}
        onClick={handleClick}
        aria-label={`Rotation: ${value}°`}
      >
        <circle cx={cx} cy={cy} r={23} stroke="var(--border)" strokeWidth="1.5" fill="none" />
        {TICKS.map(t => {
          const tr = (t * Math.PI) / 180
          const inner = t % 90 === 0 ? 18 : 19
          return (
            <line
              key={t}
              x1={cx + 23 * Math.sin(tr)}
              y1={cy - 23 * Math.cos(tr)}
              x2={cx + inner * Math.sin(tr)}
              y2={cy - inner * Math.cos(tr)}
              stroke="var(--border)"
              strokeWidth="1"
              strokeLinecap="round"
            />
          )
        })}
        <line x1={cx} y1={cy} x2={hx} y2={hy} stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={3.5} fill="var(--accent)" />
        <circle cx={hx} cy={hy} r={3.5} fill="var(--accent)" stroke="var(--bg-1)" strokeWidth="1.5" />
      </svg>
      <span className={s.val}>{value}°</span>
    </div>
  )
}
