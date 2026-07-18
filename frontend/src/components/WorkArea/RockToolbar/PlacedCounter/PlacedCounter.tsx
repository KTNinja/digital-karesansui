import s from './PlacedCounter.module.css'

interface Props {
  count: number
}

export function PlacedCounter({ count }: Props) {
  return (
    <div className={s.root}>
      <span className={s.n}>{count}</span>
      <span className={s.label}>rocks in garden</span>
    </div>
  )
}
