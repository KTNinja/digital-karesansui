import type {
  EditorMode, RockType, RockSize, RakePattern,
  LineWeight, AngleLock, Rock, RakeStroke, RemoteUser, CanvasSnapshot,
} from '@/types/garden'

export interface State {
  roomId: string
  mode: EditorMode
  selectedRockType: RockType
  selectedRockSize: RockSize
  rockRotation: number
  selectedPattern: RakePattern
  selectedWeight: LineWeight
  spacing: number
  angleLock: AngleLock
  rocks: Rock[]
  strokes: RakeStroke[]
  remoteUsers: RemoteUser[]
  connected: boolean
  rttMs: number
  endpoint: string
  undoStack: CanvasSnapshot[]
  redoStack: CanvasSnapshot[]
}

export type Action =
  | { type: 'SET_MODE'; payload: EditorMode }
  | { type: 'SET_ROCK_TYPE'; payload: RockType }
  | { type: 'SET_ROCK_SIZE'; payload: RockSize }
  | { type: 'SET_ROCK_ROTATION'; payload: number }
  | { type: 'SET_PATTERN'; payload: RakePattern }
  | { type: 'SET_LINE_WEIGHT'; payload: LineWeight }
  | { type: 'SET_SPACING'; payload: number }
  | { type: 'SET_ANGLE_LOCK'; payload: AngleLock }
  | { type: 'PLACE_ROCK'; payload: Rock }
  | { type: 'REMOVE_ROCK'; payload: { id: string } }
  | { type: 'ADD_STROKE'; payload: RakeStroke }
  | { type: 'REMOVE_STROKE'; payload: { id: string } }
  | { type: 'REMOTE_PLACE_ROCK'; payload: Rock }
  | { type: 'REMOTE_ADD_STROKE'; payload: RakeStroke }
  | { type: 'REMOTE_REMOVE_ROCK'; payload: { id: string; timestamp: number } }
  | { type: 'REMOTE_REMOVE_STROKE'; payload: { id: string; timestamp: number } }
  | { type: 'REMOTE_CLEAR'; payload: { timestamp: number } }
  | { type: 'UPSERT_REMOTE_USER'; payload: RemoteUser }
  | { type: 'REMOVE_REMOTE_USER'; payload: { id: string } }
  | { type: 'SET_CONNECTED'; payload: { connected: boolean; endpoint: string } }
  | { type: 'SET_RTT'; payload: number }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR_GARDEN'; payload: { timestamp: number } }

export const initialState: State = {
  roomId: '',
  mode: 'rake',
  selectedRockType: 'river-stone',
  selectedRockSize: 'M',
  rockRotation: 0,
  selectedPattern: 'straight',
  selectedWeight: 2,
  spacing: 17,
  angleLock: 'free',
  rocks: [],
  strokes: [],
  remoteUsers: [],
  connected: false,
  rttMs: 0,
  endpoint: '',
  undoStack: [],
  redoStack: [],
}

function snapshot(state: State): CanvasSnapshot {
  return { rocks: state.rocks, strokes: state.strokes }
}

const MAX_UNDO = 50

export function gardenReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.payload }
    case 'SET_ROCK_TYPE':
      return { ...state, selectedRockType: action.payload }
    case 'SET_ROCK_SIZE':
      return { ...state, selectedRockSize: action.payload }
    case 'SET_ROCK_ROTATION':
      return { ...state, rockRotation: action.payload }
    case 'SET_PATTERN':
      return { ...state, selectedPattern: action.payload }
    case 'SET_LINE_WEIGHT':
      return { ...state, selectedWeight: action.payload }
    case 'SET_SPACING':
      return { ...state, spacing: action.payload }
    case 'SET_ANGLE_LOCK':
      return { ...state, angleLock: action.payload }

    case 'PLACE_ROCK': {
      const undoStack = [...state.undoStack, snapshot(state)].slice(-MAX_UNDO)
      return { ...state, rocks: [...state.rocks, action.payload], undoStack, redoStack: [] }
    }
    case 'REMOVE_ROCK': {
      const undoStack = [...state.undoStack, snapshot(state)].slice(-MAX_UNDO)
      return { ...state, rocks: state.rocks.filter(r => r.id !== action.payload.id), undoStack, redoStack: [] }
    }
    case 'ADD_STROKE': {
      const undoStack = [...state.undoStack, snapshot(state)].slice(-MAX_UNDO)
      return { ...state, strokes: [...state.strokes, action.payload], undoStack, redoStack: [] }
    }
    case 'REMOVE_STROKE': {
      const undoStack = [...state.undoStack, snapshot(state)].slice(-MAX_UNDO)
      return { ...state, strokes: state.strokes.filter(s => s.id !== action.payload.id), undoStack, redoStack: [] }
    }

    // LWW: apply remote update only if timestamp is newer or equal
    case 'REMOTE_PLACE_ROCK': {
      const existing = state.rocks.find(r => r.id === action.payload.id)
      if (existing && existing.timestamp > action.payload.timestamp) return state
      const rocks = existing
        ? state.rocks.map(r => r.id === action.payload.id ? action.payload : r)
        : [...state.rocks, action.payload]
      return { ...state, rocks }
    }
    case 'REMOTE_ADD_STROKE': {
      const existing = state.strokes.find(s => s.id === action.payload.id)
      if (existing && existing.timestamp > action.payload.timestamp) return state
      const strokes = existing
        ? state.strokes.map(s => s.id === action.payload.id ? action.payload : s)
        : [...state.strokes, action.payload]
      return { ...state, strokes }
    }
    case 'REMOTE_REMOVE_ROCK': {
      const existing = state.rocks.find(r => r.id === action.payload.id)
      if (existing && existing.timestamp > action.payload.timestamp) return state
      return { ...state, rocks: state.rocks.filter(r => r.id !== action.payload.id) }
    }
    case 'REMOTE_REMOVE_STROKE': {
      const existing = state.strokes.find(s => s.id === action.payload.id)
      if (existing && existing.timestamp > action.payload.timestamp) return state
      return { ...state, strokes: state.strokes.filter(s => s.id !== action.payload.id) }
    }
    case 'REMOTE_CLEAR':
      return { ...state, rocks: [], strokes: [] }

    case 'UPSERT_REMOTE_USER': {
      const exists = state.remoteUsers.some(u => u.id === action.payload.id)
      const remoteUsers = exists
        ? state.remoteUsers.map(u => u.id === action.payload.id ? action.payload : u)
        : [...state.remoteUsers, action.payload]
      return { ...state, remoteUsers }
    }
    case 'REMOVE_REMOTE_USER':
      return { ...state, remoteUsers: state.remoteUsers.filter(u => u.id !== action.payload.id) }

    case 'SET_CONNECTED':
      return { ...state, connected: action.payload.connected, endpoint: action.payload.endpoint }
    case 'SET_RTT':
      return { ...state, rttMs: action.payload }

    case 'UNDO': {
      const undoStack = [...state.undoStack]
      const prev = undoStack.pop()
      if (!prev) return state
      return {
        ...state,
        rocks: prev.rocks,
        strokes: prev.strokes,
        undoStack,
        redoStack: [snapshot(state), ...state.redoStack].slice(0, MAX_UNDO),
      }
    }
    case 'REDO': {
      const redoStack = [...state.redoStack]
      const next = redoStack.shift()
      if (!next) return state
      return {
        ...state,
        rocks: next.rocks,
        strokes: next.strokes,
        undoStack: [...state.undoStack, snapshot(state)].slice(-MAX_UNDO),
        redoStack,
      }
    }
    case 'CLEAR_GARDEN': {
      const undoStack = [...state.undoStack, snapshot(state)].slice(-MAX_UNDO)
      return { ...state, rocks: [], strokes: [], undoStack, redoStack: [] }
    }

    default:
      return state
  }
}
