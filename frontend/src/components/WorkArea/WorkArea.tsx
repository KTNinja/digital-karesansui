import s from './WorkArea.module.css'
import { RockToolbar } from './RockToolbar/RockToolbar'
import { GardenCanvas } from './GardenCanvas/GardenCanvas'
import { RakeToolbar } from './RakeToolbar/RakeToolbar'

export function WorkArea() {
  return (
    <div className={s.root}>
      <RockToolbar />
      <GardenCanvas />
      <RakeToolbar />
    </div>
  )
}
