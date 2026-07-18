import { use } from 'react'
import { GardenContext } from './GardenContext'

export function useGarden() {
  return use(GardenContext)
}
