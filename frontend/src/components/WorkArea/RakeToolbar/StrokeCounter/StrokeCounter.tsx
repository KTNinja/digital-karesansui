import s from './StrokeCounter.module.css'

interface Props {
  count: number
}

export function StrokeCounter({ count }: Props) {
  return (
    <div className={s.root}>
      <span className={s.n}>{count}</span>
      <span className={s.label}>rake strokes</span>
    </div>
  )
}
