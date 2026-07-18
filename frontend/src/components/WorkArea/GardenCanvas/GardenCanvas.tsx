import { useRef, useEffect, useCallback } from 'react'
import s from './GardenCanvas.module.css'
import { CanvasLayer } from './CanvasLayer/CanvasLayer'
import { useGarden } from '@/context/useGarden'
import { useGardenSocket } from '@/hooks/useGardenSocket'
import type { Rock, RakeStroke } from '@/types/garden'

function randomId() {
  return Math.random().toString(36).slice(2)
}

const ROCK_RADII: Record<string, [number, number]> = {
  'river-stone':    [30, 22],
  'boulder':        [26, 22],
  'flat-slab':      [34, 11],
  'standing-stone': [14, 22],
}

const SIZE_SCALE: Record<string, number> = { S: 0.65, M: 1, L: 1.45 }

function drawSandLayer(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0,    '#cfc0a0')
  grad.addColorStop(0.35, '#c0b090')
  grad.addColorStop(0.7,  '#bfad8e')
  grad.addColorStop(1,    '#b09475')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

function drawRocks(ctx: CanvasRenderingContext2D, rocks: Rock[]) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  for (const rock of rocks) {
    const [rx, ry] = ROCK_RADII[rock.type] ?? [20, 18]
    const scale = SIZE_SCALE[rock.size] ?? 1

    ctx.save()
    ctx.translate(rock.x, rock.y)
    ctx.rotate((rock.rotation * Math.PI) / 180)
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetY = 4

    const grad = ctx.createRadialGradient(
      -rx * scale * 0.2, -ry * scale * 0.25, rx * scale * 0.05,
      0, 0, rx * scale
    )
    grad.addColorStop(0, '#a09488')
    grad.addColorStop(0.55, '#706460')
    grad.addColorStop(1, '#4a4240')

    ctx.beginPath()
    ctx.ellipse(0, 0, rx * scale, ry * scale, 0, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.restore()
  }
}

function drawStrokes(ctx: CanvasRenderingContext2D, strokes: RakeStroke[]) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  for (const stroke of strokes) {
    if (stroke.points.length < 2) continue
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(100,80,55,0.3)'
    ctx.lineWidth = stroke.weight
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const [x0, y0] = stroke.points[0] ?? [0, 0]
    ctx.moveTo(x0, y0)
    for (let i = 1; i < stroke.points.length; i++) {
      const [x, y] = stroke.points[i] ?? [0, 0]
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
}

export function GardenCanvas() {
  const { state, dispatch } = useGarden()
  const { send } = useGardenSocket()

  const sandRef  = useRef<HTMLCanvasElement>(null)
  const strokeRef = useRef<HTMLCanvasElement>(null)
  const rockRef  = useRef<HTMLCanvasElement>(null)
  const wrapRef  = useRef<HTMLDivElement>(null)

  // Resize all three canvases together
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const ro = new ResizeObserver(entries => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      for (const ref of [sandRef, strokeRef, rockRef]) {
        if (ref.current) {
          ref.current.width = width
          ref.current.height = height
        }
      }
      // Redraw sand on resize
      const sandCtx = sandRef.current?.getContext('2d')
      if (sandCtx) drawSandLayer(sandCtx, width, height)
    })
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])

  // Redraw rocks layer when rocks change
  useEffect(() => {
    const ctx = rockRef.current?.getContext('2d')
    if (ctx) drawRocks(ctx, state.rocks)
  }, [state.rocks])

  // Redraw strokes layer when strokes change
  useEffect(() => {
    const ctx = strokeRef.current?.getContext('2d')
    if (ctx) drawStrokes(ctx, state.strokes)
  }, [state.strokes])

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (state.mode === 'place-rock') {
      const rock: Rock = {
        id: randomId(),
        type: state.selectedRockType,
        size: state.selectedRockSize,
        rotation: state.rockRotation,
        x, y,
        timestamp: Date.now(),
        ownerId: 'local',
      }
      dispatch({ type: 'PLACE_ROCK', payload: rock })
      send({ type: 'rock_placed', data: rock })
    }

    if (state.mode === 'rake') {
      const stroke: RakeStroke = {
        id: randomId(),
        pattern: state.selectedPattern,
        weight: state.selectedWeight,
        spacing: state.spacing,
        angleLock: state.angleLock,
        points: [[x, y]],
        timestamp: Date.now(),
        ownerId: 'local',
      }
      dispatch({ type: 'ADD_STROKE', payload: stroke })
      send({ type: 'stroke_added', data: stroke })
    }
  }, [state, dispatch, send])

  return (
    <div ref={wrapRef} className={s.root} onPointerDown={handlePointerDown}>
      <CanvasLayer ref={sandRef}   className={s.sand} />
      <CanvasLayer ref={strokeRef} className={s.strokes} />
      <CanvasLayer ref={rockRef}   className={s.rocks} />
      <span className={s.label}>GardenCanvas</span>
    </div>
  )
}
