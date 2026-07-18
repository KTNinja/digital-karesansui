import s from './LineWeightPicker.module.css'
import type { LineWeight } from '@/types/garden'

interface Props {
  weights: LineWeight[]
  selected: LineWeight
  onSelect: (w: LineWeight) => void
}

export function LineWeightPicker({ weights, selected, onSelect }: Props) {
  return (
    <div className={s.root}>
      {weights.map(w => (
        <button
          key={w}
          className={`${s.btn} ${selected === w ? s.on : ''}`}
          onClick={() => onSelect(w)}
        >
          <span className={s.line} style={{ height: `${w}px` }} />
        </button>
      ))}
    </div>
  )
}
