import { useEffect } from 'react'
import s from './App.module.css'
import { TopBar } from './components/TopBar/TopBar'
import { WorkArea } from './components/WorkArea/WorkArea'
import { BottomBar } from './components/BottomBar/BottomBar'
import { useGarden } from './context/useGarden'

function KeyboardShortcuts() {
  const { dispatch } = useGarden()

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey
      if (!meta) return
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        dispatch({ type: 'UNDO' })
      }
      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault()
        dispatch({ type: 'REDO' })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dispatch])

  return null
}

export function App() {
  return (
    <div className={s.root}>
      <KeyboardShortcuts />
      <TopBar />
      <WorkArea />
      <BottomBar />
    </div>
  )
}
