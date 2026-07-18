import s from './RakeToolbar.module.css'
import { PatternPicker } from './PatternPicker/PatternPicker'
import { LineWeightPicker } from './LineWeightPicker/LineWeightPicker'
import { SpacingSlider } from './SpacingSlider/SpacingSlider'
import { AngleLockPicker } from './AngleLockPicker/AngleLockPicker'
import { StrokeCounter } from './StrokeCounter/StrokeCounter'
import { useGarden } from '@/context/useGarden'
import type { RakePattern, LineWeight, AngleLock } from '@/types/garden'

const PATTERNS: { value: RakePattern; label: string }[] = [
  { value: 'straight',   label: 'Straight' },
  { value: 'wave',       label: 'Wave' },
  { value: 'concentric', label: 'Concentric' },
  { value: 'spiral',     label: 'Spiral' },
]

const WEIGHTS: LineWeight[] = [1, 2, 4]

const ANGLES: { value: AngleLock; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: '45',   label: '45°' },
  { value: '90',   label: '90°' },
]

export function RakeToolbar() {
  const { state, dispatch } = useGarden()

  return (
    <aside className={s.root}>
      <section className={s.section}>
        <div className={s.label}>Rake Pattern</div>
        <PatternPicker
          patterns={PATTERNS}
          selected={state.selectedPattern}
          onSelect={p => dispatch({ type: 'SET_PATTERN', payload: p })}
        />
      </section>

      <section className={s.section}>
        <div className={s.label}>Line Weight</div>
        <LineWeightPicker
          weights={WEIGHTS}
          selected={state.selectedWeight}
          onSelect={w => dispatch({ type: 'SET_LINE_WEIGHT', payload: w })}
        />
      </section>

      <section className={s.section}>
        <div className={s.label}>Spacing</div>
        <SpacingSlider
          value={state.spacing}
          onChange={v => dispatch({ type: 'SET_SPACING', payload: v })}
        />
      </section>

      <section className={s.section}>
        <div className={s.label}>Angle Lock</div>
        <AngleLockPicker
          modes={ANGLES}
          selected={state.angleLock}
          onSelect={a => dispatch({ type: 'SET_ANGLE_LOCK', payload: a })}
        />
      </section>

      <section className={`${s.section} ${s.bottom}`}>
        <div className={s.label}>Strokes</div>
        <StrokeCounter count={state.strokes.length} />
      </section>
    </aside>
  )
}
