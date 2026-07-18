import s from './AngleLockPicker.module.css'
import type { AngleLock } from '@/types/garden'

interface AngleOption {
  value: AngleLock
  label: string
}

interface Props {
  modes: AngleOption[]
  selected: AngleLock
  onSelect: (a: AngleLock) => void
}

export function AngleLockPicker({ modes, selected, onSelect }: Props) {
  return (
    <div className={s.root}>
      {modes.map(m => (
        <button
          key={m.value}
          className={`${s.btn} ${selected === m.value ? s.on : ''}`}
          onClick={() => onSelect(m.value)}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
