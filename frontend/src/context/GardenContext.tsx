import { createContext } from 'react'
import type { State, Action } from './gardenReducer'
import { initialState } from './gardenReducer'

export interface GardenContextValue {
  state: State
  dispatch: React.Dispatch<Action>
}

export const GardenContext = createContext<GardenContextValue>({
  state: initialState,
  dispatch: () => undefined,
})
