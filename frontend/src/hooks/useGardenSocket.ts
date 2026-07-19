import { useEffect, useRef, useCallback } from 'react'
import { useGarden } from '@/context/useGarden'
import { getUserId, deriveInitials, deriveColor } from '@/utils/userId'
import type { Rock, RakeStroke, RemoteUser } from '@/types/garden'

type IncomingMessage =
  | { type: 'rock_placed'; data: Rock }
  | { type: 'stroke_added'; data: RakeStroke }
  | { type: 'rock_removed'; data: { id: string; timestamp: number } }
  | { type: 'stroke_removed'; data: { id: string; timestamp: number } }
  | { type: 'garden_cleared'; data: { timestamp: number } }
  | { type: 'cursor_moved'; data: RemoteUser }
  | { type: 'user_left'; data: { id: string } }
  | { type: 'pong'; data: { clientTimestamp: number } }

const PING_INTERVAL_MS = 5000

export function useGardenSocket() {
  const { state, dispatch } = useGarden()
  const wsRef = useRef<WebSocket | null>(null)
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const send = useCallback((payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    }
  }, [])

  useEffect(() => {
    if (!state.roomId) return

    const url = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/garden/${state.roomId}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      dispatch({ type: 'SET_CONNECTED', payload: { connected: true, endpoint: url } })

      const userId = getUserId()
      send({
        type: 'join',
        data: { id: userId, initials: deriveInitials(userId), color: deriveColor(userId) },
      })

      pingTimerRef.current = setInterval(() => {
        send({ type: 'ping', clientTimestamp: Date.now() })
      }, PING_INTERVAL_MS)
    }

    ws.onclose = () => {
      dispatch({ type: 'SET_CONNECTED', payload: { connected: false, endpoint: url } })
      if (pingTimerRef.current) clearInterval(pingTimerRef.current)
    }

    ws.onerror = () => {
      dispatch({ type: 'SET_CONNECTED', payload: { connected: false, endpoint: url } })
    }

    ws.onmessage = (event: MessageEvent<string>) => {
      let msg: IncomingMessage
      try {
        msg = JSON.parse(event.data) as IncomingMessage
      } catch {
        return
      }

      switch (msg.type) {
        case 'rock_placed':
          dispatch({ type: 'REMOTE_PLACE_ROCK', payload: msg.data })
          break
        case 'stroke_added':
          dispatch({ type: 'REMOTE_ADD_STROKE', payload: msg.data })
          break
        case 'rock_removed':
          dispatch({ type: 'REMOTE_REMOVE_ROCK', payload: msg.data })
          break
        case 'stroke_removed':
          dispatch({ type: 'REMOTE_REMOVE_STROKE', payload: msg.data })
          break
        case 'garden_cleared':
          dispatch({ type: 'REMOTE_CLEAR', payload: msg.data })
          break
        case 'cursor_moved':
          dispatch({ type: 'UPSERT_REMOTE_USER', payload: msg.data })
          break
        case 'user_left':
          dispatch({ type: 'REMOVE_REMOTE_USER', payload: msg.data })
          break
        case 'pong': {
          const rttMs = Date.now() - msg.data.clientTimestamp
          dispatch({ type: 'SET_RTT', payload: rttMs })
          break
        }
      }
    }

    return () => {
      if (pingTimerRef.current) clearInterval(pingTimerRef.current)
      ws.close()
    }
  }, [state.roomId, dispatch, send])

  return { send }
}
