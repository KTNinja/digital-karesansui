import s from './ModeSelector.module.css'
import type { EditorMode } from '@/types/garden'

interface ModeOption {
  value: EditorMode
  label: string
}

interface Props {
  modes: ModeOption[]
  active: EditorMode
  onChange: (mode: EditorMode) => void
}

export function ModeSelector({ modes, active, onChange }: Props) {
  return (
    <div className={s.root}>
      {modes.map(m => (
        <button
          key={m.value}
          className={`${s.btn} ${active === m.value ? s.on : ''}`}
          onClick={() => onChange(m.value)}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
