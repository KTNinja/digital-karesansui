import s from './ConnectionStatus.module.css'

interface Props {
  connected: boolean
  endpoint: string
}

export function ConnectionStatus({ connected, endpoint }: Props) {
  return (
    <div className={s.root}>
      <div className={`${s.dot} ${connected ? s.live : s.dead}`} />
      <span className={s.text}>
        <strong className={connected ? s.live : s.dead}>
          {connected ? 'Connected' : 'Disconnected'}
        </strong>
        {endpoint ? ` · ${endpoint}` : ''}
      </span>
    </div>
  )
}
