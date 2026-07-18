import { useReducer } from 'react'
import { GardenContext } from './GardenContext'
import { gardenReducer, initialState } from './gardenReducer'

interface Props {
  roomId: string
  children: React.ReactNode
}

export function GardenProvider({ roomId, children }: Props) {
  const [state, dispatch] = useReducer(gardenReducer, {
    ...initialState,
    roomId,
    endpoint: `/ws/garden/${roomId}`,
  })

  return (
    <GardenContext value={{ state, dispatch }}>
      {children}
    </GardenContext>
  )
}
