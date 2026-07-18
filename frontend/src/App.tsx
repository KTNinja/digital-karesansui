import s from './App.module.css'
import { TopBar } from './components/TopBar/TopBar'
import { WorkArea } from './components/WorkArea/WorkArea'
import { BottomBar } from './components/BottomBar/BottomBar'

export function App() {
  return (
    <div className={s.root}>
      <TopBar />
      <WorkArea />
      <BottomBar />
    </div>
  )
}
