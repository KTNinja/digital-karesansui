import s from './RockToolbar.module.css'
import { RockTypePicker } from './RockTypePicker/RockTypePicker'
import { SizePicker } from './SizePicker/SizePicker'
import { RotationDial } from './RotationDial/RotationDial'
import { PlacedCounter } from './PlacedCounter/PlacedCounter'
import { useGarden } from '@/context/useGarden'
import type { RockType, RockSize } from '@/types/garden'

const ROCK_TYPES: { value: RockType; label: string }[] = [
  { value: 'river-stone', label: 'River Stone' },
  { value: 'boulder', label: 'Boulder' },
  { value: 'flat-slab', label: 'Flat Slab' },
  { value: 'standing-stone', label: 'Standing Stone' },
]

const SIZES: RockSize[] = ['S', 'M', 'L']

export function RockToolbar() {
  const { state, dispatch } = useGarden()

  return (
    <aside className={s.root}>
      <section className={s.section}>
        <div className={s.label}>Rock Type</div>
        <RockTypePicker
          types={ROCK_TYPES}
          selected={state.selectedRockType}
          onSelect={type => dispatch({ type: 'SET_ROCK_TYPE', payload: type })}
        />
      </section>

      <section className={s.section}>
        <div className={s.label}>Size</div>
        <SizePicker
          sizes={SIZES}
          selected={state.selectedRockSize}
          onSelect={size => dispatch({ type: 'SET_ROCK_SIZE', payload: size })}
        />
      </section>

      <section className={s.section}>
        <div className={s.label}>Rotation</div>
        <RotationDial
          value={state.rockRotation}
          onChange={deg => dispatch({ type: 'SET_ROCK_ROTATION', payload: deg })}
        />
      </section>

      <section className={`${s.section} ${s.bottom}`}>
        <div className={s.label}>Placed</div>
        <PlacedCounter count={state.rocks.length} />
      </section>
    </aside>
  )
}
