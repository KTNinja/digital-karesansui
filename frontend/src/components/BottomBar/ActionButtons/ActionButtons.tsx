import s from './ActionButtons.module.css'

interface Props {
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
}

export function ActionButtons({ onUndo, onRedo, onClear }: Props) {
  return (
    <div className={s.root}>
      <button className={s.btn} onClick={onUndo}>
        Undo <kbd className={s.kbd}>⌘Z</kbd>
      </button>
      <button className={s.btn} onClick={onRedo}>
        Redo <kbd className={s.kbd}>⌘⇧Z</kbd>
      </button>
      <button className={`${s.btn} ${s.danger}`} onClick={onClear}>
        Clear Garden
      </button>
    </div>
  )
}
