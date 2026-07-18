import s from './SpacingSlider.module.css'

const MIN = 8
const MAX = 40

interface Props {
  value: number
  onChange: (v: number) => void
}

export function SpacingSlider({ value, onChange }: Props) {
  const pct = ((value - MIN) / (MAX - MIN)) * 100

  return (
    <div className={s.root}>
      <div className={s.labels}>
        <span>Fine</span>
        <span className={s.val}>{value} px</span>
        <span>Wide</span>
      </div>
      <div className={s.track}>
        <div className={s.fill} style={{ width: `${pct}%` }} />
        <input
          type="range"
          min={MIN}
          max={MAX}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className={s.input}
        />
      </div>
    </div>
  )
}
