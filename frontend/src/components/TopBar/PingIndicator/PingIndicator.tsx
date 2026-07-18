import s from './PingIndicator.module.css'

interface Props {
  rttMs: number
}

export function PingIndicator({ rttMs }: Props) {
  return (
    <div className={s.root}>
      <div className={s.dot} />
      {rttMs} ms
    </div>
  )
}
