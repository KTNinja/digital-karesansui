import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GardenProvider } from './context/GardenProvider'
import { App } from './App'
import './styles/tokens.css'

const ROOM_ID = new URLSearchParams(window.location.search).get('room') ?? 'zen-garden-1'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <GardenProvider roomId={ROOM_ID}>
      <App />
    </GardenProvider>
  </StrictMode>
)
