import s from './SizePicker.module.css'
import type { RockSize } from '@/types/garden'

interface Props {
  sizes: RockSize[]
  selected: RockSize
  onSelect: (size: RockSize) => void
}

export function SizePicker({ sizes, selected, onSelect }: Props) {
  return (
    <div className={s.root}>
      {sizes.map(sz => (
        <button
          key={sz}
          className={`${s.btn} ${s[sz.toLowerCase() as 's' | 'm' | 'l']} ${selected === sz ? s.on : ''}`}
          onClick={() => onSelect(sz)}
        >
          {sz}
        </button>
      ))}
    </div>
  )
}
