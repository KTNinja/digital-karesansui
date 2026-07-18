import s from './PatternPicker.module.css'
import type { RakePattern } from '@/types/garden'

interface PatternOption {
  value: RakePattern
  label: string
}

interface Props {
  patterns: PatternOption[]
  selected: RakePattern
  onSelect: (p: RakePattern) => void
}

export function PatternPicker({ patterns, selected, onSelect }: Props) {
  return (
    <div className={s.grid}>
      {patterns.map(p => (
        <button
          key={p.value}
          className={`${s.item} ${selected === p.value ? s.on : ''}`}
          onClick={() => onSelect(p.value)}
        >
          <div className={`${s.icon} ${s[p.value as keyof typeof s]}`} aria-hidden="true" />
          <span className={s.label}>{p.label}</span>
        </button>
      ))}
    </div>
  )
}
