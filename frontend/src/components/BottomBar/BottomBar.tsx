import s from './BottomBar.module.css'
import { ConnectionStatus } from './ConnectionStatus/ConnectionStatus'
import { RttDisplay } from './RttDisplay/RttDisplay'
import { ActionButtons } from './ActionButtons/ActionButtons'
import { useGarden } from '@/context/useGarden'

export function BottomBar() {
  const { state, dispatch } = useGarden()

  return (
    <footer className={s.root}>
      <ConnectionStatus connected={state.connected} endpoint={state.endpoint} />
      <div className={s.sep} />
      <RttDisplay rttMs={state.rttMs} budgetMs={100} />
      <div className={s.spacer} />
      <ActionButtons
        onUndo={() => dispatch({ type: 'UNDO' })}
        onRedo={() => dispatch({ type: 'REDO' })}
        onClear={() => dispatch({ type: 'CLEAR_GARDEN', payload: { timestamp: Date.now() } })}
      />
    </footer>
  )
}
