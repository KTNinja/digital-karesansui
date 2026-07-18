import s from './RockTypePicker.module.css'
import type { RockType } from '@/types/garden'

interface RockOption {
  value: RockType
  label: string
}

interface Props {
  types: RockOption[]
  selected: RockType
  onSelect: (type: RockType) => void
}

export function RockTypePicker({ types, selected, onSelect }: Props) {
  return (
    <div className={s.grid}>
      {types.map(t => (
        <button
          key={t.value}
          className={`${s.item} ${selected === t.value ? s.on : ''}`}
          onClick={() => onSelect(t.value)}
        >
          <div className={`${s.icon} ${s[t.value.replace(/-/g, '_') as keyof typeof s]}`} aria-hidden="true" />
          <span className={s.label}>{t.label}</span>
        </button>
      ))}
    </div>
  )
}
