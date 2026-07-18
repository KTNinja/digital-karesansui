export type EditorMode = 'place-rock' | 'rake' | 'erase'

export type RockType = 'river-stone' | 'boulder' | 'flat-slab' | 'standing-stone'
export type RockSize = 'S' | 'M' | 'L'
export type RakePattern = 'straight' | 'wave' | 'concentric' | 'spiral'
export type LineWeight = 1 | 2 | 4
export type AngleLock = 'free' | '45' | '90'

export interface Rock {
  id: string
  type: RockType
  size: RockSize
  rotation: number
  x: number
  y: number
  timestamp: number
  ownerId: string
}

export interface RakeStroke {
  id: string
  pattern: RakePattern
  weight: LineWeight
  spacing: number
  angleLock: AngleLock
  points: [number, number][]
  timestamp: number
  ownerId: string
}

export interface RemoteUser {
  id: string
  initials: string
  color: string
  cursorX: number
  cursorY: number
}

export interface CanvasSnapshot {
  rocks: Rock[]
  strokes: RakeStroke[]
}
