import s from './TopBar.module.css'
import { Logo } from './Logo/Logo'
import { RoomChip } from './RoomChip/RoomChip'
import { ModeSelector } from './ModeSelector/ModeSelector'
import { AvatarCluster } from './AvatarCluster/AvatarCluster'
import { PingIndicator } from './PingIndicator/PingIndicator'
import { useGarden } from '@/context/useGarden'
import type { EditorMode } from '@/types/garden'

const MODES: { value: EditorMode; label: string }[] = [
  { value: 'place-rock', label: 'Place Rock' },
  { value: 'rake', label: 'Rake' },
  { value: 'erase', label: 'Erase' },
]

export function TopBar() {
  const { state, dispatch } = useGarden()

  return (
    <header className={s.root}>
      <Logo />
      <div className={s.sep} />
      <RoomChip roomId={state.roomId} />
      <ModeSelector
        modes={MODES}
        active={state.mode}
        onChange={mode => dispatch({ type: 'SET_MODE', payload: mode })}
      />
      <div className={s.spacer} />
      <AvatarCluster users={state.remoteUsers} />
      <div className={s.sep} />
      <PingIndicator rttMs={state.rttMs} />
    </header>
  )
}
