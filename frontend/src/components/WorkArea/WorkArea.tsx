import s from './WorkArea.module.css'
import { RockToolbar } from './RockToolbar/RockToolbar'
import { GardenCanvas } from './GardenCanvas/GardenCanvas'
import { RakeToolbar } from './RakeToolbar/RakeToolbar'
import { useGarden } from '@/context/useGarden'

export function WorkArea() {
  const { state } = useGarden()
  const rockActive = state.mode === 'place-rock'
  const rakeActive = state.mode === 'rake'

  return (
    <div className={s.root}>
      <div className={`${s.toolbarSlot} ${rockActive ? s.active : s.dim}`}>
        <RockToolbar />
      </div>
      <GardenCanvas />
      <div className={`${s.toolbarSlot} ${rakeActive ? s.active : s.dim}`}>
        <RakeToolbar />
      </div>
    </div>
  )
}
