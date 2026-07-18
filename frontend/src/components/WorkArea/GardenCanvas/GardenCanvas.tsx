import { useRef, useEffect, useCallback } from 'react'
import s from './GardenCanvas.module.css'
import { CanvasLayer } from './CanvasLayer/CanvasLayer'
import { useGarden } from '@/context/useGarden'
import { useGardenSocket } from '@/hooks/useGardenSocket'
import type { Rock, RakeStroke } from '@/types/garden'

function randomId() {
  return Math.random().toString(36).slice(2)
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

function makeRockGrad(ctx: CanvasRenderingContext2D, rx: number, ry: number, light: string, mid: string, dark: string) {
  const g = ctx.createRadialGradient(-rx * 0.25, -ry * 0.3, rx * 0.05, rx * 0.1, ry * 0.1, rx * 1.1)
  g.addColorStop(0, light)
  g.addColorStop(0.5, mid)
  g.addColorStop(1, dark)
  return g
}

function drawRiverStone(ctx: CanvasRenderingContext2D, scale: number) {
  // Smooth, rounded, slightly asymmetric oval
  const rx = 28 * scale, ry = 20 * scale
  const g = makeRockGrad(ctx, rx, ry, '#b8b0a4', '#7a7068', '#4a4240')
  ctx.beginPath()
  ctx.ellipse(0, 2 * scale, rx, ry, 0.15, 0, Math.PI * 2)
  ctx.fillStyle = g
  ctx.fill()
}

function drawBoulder(ctx: CanvasRenderingContext2D, scale: number) {
  // Chunky angular polygon — clearly different from river stone
  const s2 = scale
  ctx.beginPath()
  ctx.moveTo(-22 * s2,  4 * s2)
  ctx.lineTo(-14 * s2, -18 * s2)
  ctx.lineTo(  6 * s2, -22 * s2)
  ctx.lineTo( 22 * s2,  -8 * s2)
  ctx.lineTo( 18 * s2,  14 * s2)
  ctx.lineTo( -2 * s2,  20 * s2)
  ctx.lineTo(-18 * s2,  14 * s2)
  ctx.closePath()
  const rx = 22 * s2
  const g = makeRockGrad(ctx, rx, rx, '#9a9288', '#65605a', '#3e3a36')
  ctx.fillStyle = g
  ctx.fill()
  // Highlight facet line
  ctx.beginPath()
  ctx.moveTo(-14 * s2, -18 * s2)
  ctx.lineTo(  6 * s2, -22 * s2)
  ctx.lineTo( 22 * s2,  -8 * s2)
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'
  ctx.lineWidth = 1.5 * s2
  ctx.stroke()
}

function drawFlatSlab(ctx: CanvasRenderingContext2D, scale: number) {
  // Wide, very flat — like a paving stone
  const rx = 34 * scale, ry = 9 * scale
  const g = makeRockGrad(ctx, rx, ry, '#c0b8ac', '#8a8278', '#524e4a')
  ctx.beginPath()
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
  ctx.fillStyle = g
  ctx.fill()
  // Top edge highlight
  ctx.beginPath()
  ctx.ellipse(0, -2 * scale, rx * 0.85, ry * 0.5, 0, Math.PI, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 1
  ctx.stroke()
}

function drawStandingStone(ctx: CanvasRenderingContext2D, scale: number) {
  // Tall, narrow, upright monolith
  const w = 14 * scale, h = 28 * scale
  ctx.beginPath()
  ctx.moveTo(-w * 0.6,  h * 0.5)
  ctx.lineTo(-w,        h * 0.1)
  ctx.lineTo(-w * 0.8, -h * 0.5)
  ctx.lineTo( 0,       -h * 0.55)
  ctx.lineTo( w * 0.8, -h * 0.4)
  ctx.lineTo( w,        h * 0.15)
  ctx.lineTo( w * 0.5,  h * 0.5)
  ctx.closePath()
  const g = makeRockGrad(ctx, w, h, '#aca49a', '#706860', '#484240')
  ctx.fillStyle = g
  ctx.fill()
  // Left-face shadow
  ctx.beginPath()
  ctx.moveTo(-w,        h * 0.1)
  ctx.lineTo(-w * 0.8, -h * 0.5)
  ctx.lineTo( 0,       -h * 0.55)
  ctx.lineTo(-w * 0.05, h * 0.5)
  ctx.closePath()
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  ctx.fill()
}

function drawRocks(ctx: CanvasRenderingContext2D, rocks: Rock[]) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  for (const rock of rocks) {
    const scale = SIZE_SCALE[rock.size] ?? 1
    ctx.save()
    ctx.translate(rock.x, rock.y)
    ctx.rotate((rock.rotation * Math.PI) / 180)
    ctx.shadowColor = 'rgba(0,0,0,0.55)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetY = 5 * scale
    switch (rock.type) {
      case 'river-stone':    drawRiverStone(ctx, scale);    break
      case 'boulder':        drawBoulder(ctx, scale);       break
      case 'flat-slab':      drawFlatSlab(ctx, scale);      break
      case 'standing-stone': drawStandingStone(ctx, scale); break
    }
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

const MODE_CURSOR: Record<string, string> = {
  'place-rock': 'cell',
  'rake':       'crosshair',
  'erase':      'not-allowed',
}

const MODE_LABEL: Record<string, string> = {
  'place-rock': '石 Place Rock',
  'rake':       '熊手 Rake',
  'erase':      '消 Erase',
}

export function GardenCanvas() {
  const { state, dispatch } = useGarden()
  const { send } = useGardenSocket()

  const sandRef   = useRef<HTMLCanvasElement>(null)
  const strokeRef = useRef<HTMLCanvasElement>(null)
  const rockRef   = useRef<HTMLCanvasElement>(null)
  const wrapRef   = useRef<HTMLDivElement>(null)

  // Track the active stroke id while the pointer is held down in rake mode
  const activeStrokeId = useRef<string | null>(null)

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
          ref.current.width  = width
          ref.current.height = height
        }
      }
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

  const getCanvasXY = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return [e.clientX - rect.left, e.clientY - rect.top] as const
  }

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const [x, y] = getCanvasXY(e)

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
      const id = randomId()
      activeStrokeId.current = id
      const stroke: RakeStroke = {
        id,
        pattern: state.selectedPattern,
        weight: state.selectedWeight,
        spacing: state.spacing,
        angleLock: state.angleLock,
        points: [[x, y]],
        timestamp: Date.now(),
        ownerId: 'local',
      }
      dispatch({ type: 'ADD_STROKE', payload: stroke })
      e.currentTarget.setPointerCapture(e.pointerId)
    }

    if (state.mode === 'erase') {
      // Find topmost rock near click (within 35px) and remove it
      const hit = [...state.rocks].reverse().find(r => {
        const dx = r.x - x, dy = r.y - y
        return Math.sqrt(dx * dx + dy * dy) < 35
      })
      if (hit) {
        dispatch({ type: 'REMOVE_ROCK', payload: { id: hit.id } })
        send({ type: 'rock_removed', data: { id: hit.id, timestamp: Date.now() } })
      }
    }
  }, [state, dispatch, send])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (state.mode !== 'rake' || !activeStrokeId.current) return
    const [x, y] = getCanvasXY(e)
    const id = activeStrokeId.current

    // Append point to the active stroke in-place by dispatching REMOTE_ADD_STROKE
    // which replaces the stroke entry via the LWW merge path
    const existing = state.strokes.find(s => s.id === id)
    if (!existing) return
    const updated: RakeStroke = { ...existing, points: [...existing.points, [x, y]] }
    dispatch({ type: 'REMOTE_ADD_STROKE', payload: updated })
  }, [state.mode, state.strokes, dispatch])

  const handlePointerUp = useCallback(() => {
    if (activeStrokeId.current) {
      const stroke = state.strokes.find(s => s.id === activeStrokeId.current)
      if (stroke) send({ type: 'stroke_added', data: stroke })
      activeStrokeId.current = null
    }
  }, [state.strokes, send])

  const cursor = MODE_CURSOR[state.mode] ?? 'crosshair'

  return (
    <div
      ref={wrapRef}
      className={s.root}
      style={{ cursor }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <CanvasLayer ref={sandRef}   className={s.sand} />
      <CanvasLayer ref={strokeRef} className={s.strokes} />
      <CanvasLayer ref={rockRef}   className={s.rocks} />
      <div className={s.modeBadge}>{MODE_LABEL[state.mode]}</div>
      <span className={s.label}>GardenCanvas</span>
    </div>
  )
}
