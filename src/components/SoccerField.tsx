'use client'

import React, { useRef, useState, useCallback } from 'react'
import { Player, BallState, Drawing, OverlayState, Tool, Point, DrawingType } from '@/types'

interface Props {
  players: Player[]
  ball: BallState
  drawings: Drawing[]
  overlays: OverlayState
  activeTool: Tool
  drawingColor: string
  showAwayTeam: boolean
  onPlayerMove: (id: string, x: number, y: number) => void
  onBallMove: (x: number, y: number) => void
  onDrawingAdd: (d: Drawing) => void
  onPlayerClick: (id: string) => void
  onDrawingErase: (id: string) => void
  animationNote: string | null
}

const W = 68   // field width in SVG units (metres)
const H = 105  // field height in SVG units (metres)
const DRAG_THRESHOLD = 2  // SVG units — below this = click, above = drag

function arrowheadPoints(from: Point, to: Point, size = 1.5): string {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const ux = dx / len
  const uy = dy / len
  const px = -uy
  const py = ux
  const base = { x: to.x - ux * size * 1.8, y: to.y - uy * size * 1.8 }
  const p1 = { x: base.x + px * size * 0.9, y: base.y + py * size * 0.9 }
  const p2 = { x: base.x - px * size * 0.9, y: base.y - py * size * 0.9 }
  return `${p1.x},${p1.y} ${to.x},${to.y} ${p2.x},${p2.y}`
}

export default function SoccerField({
  players, ball, drawings, overlays, activeTool, drawingColor,
  showAwayTeam, onPlayerMove, onBallMove, onDrawingAdd, onPlayerClick,
  onDrawingErase, animationNote,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  // dragging: which player/ball is currently being dragged
  const [dragging, setDragging] = useState<{ id: string; type: 'player' | 'ball' } | null>(null)

  // currentDraw: in-progress drawing stroke
  const [currentDraw, setCurrentDraw] = useState<{ points: Point[]; type: DrawingType } | null>(null)

  const [hoveredDrawing, setHoveredDrawing] = useState<string | null>(null)

  // FIX 3: track pointer-down position to distinguish click from drag
  const dragStartPos = useRef<Point | null>(null)
  const didDragRef = useRef(false)

  // ── Coordinate conversion ────────────────────────────────────────────────────

  const getSVGCoords = useCallback((e: React.PointerEvent): Point => {
    const svg = svgRef.current!
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const sp = pt.matrixTransform(svg.getScreenCTM()!.inverse())
    // Clamp to field bounds (not the viewBox padding — players stay on the pitch)
    return { x: Math.max(0, Math.min(W, sp.x)), y: Math.max(0, Math.min(H, sp.y)) }
  }, [])

  // ── Pointer handlers ─────────────────────────────────────────────────────────

  const handlePlayerDown = useCallback((e: React.PointerEvent, id: string) => {
    if (activeTool !== 'select') return
    e.stopPropagation()
    e.preventDefault()
    // FIX 2: capture on the SVG so moves/ups are always received
    svgRef.current?.setPointerCapture(e.pointerId)
    const startPt = getSVGCoords(e)
    dragStartPos.current = startPt
    didDragRef.current = false
    setDragging({ id, type: 'player' })
  }, [activeTool, getSVGCoords])

  const handleBallDown = useCallback((e: React.PointerEvent) => {
    if (activeTool !== 'select') return
    e.stopPropagation()
    e.preventDefault()
    svgRef.current?.setPointerCapture(e.pointerId)
    const startPt = getSVGCoords(e)
    dragStartPos.current = startPt
    didDragRef.current = false
    setDragging({ id: 'ball', type: 'ball' })
  }, [activeTool, getSVGCoords])

  const handleFieldDown = useCallback((e: React.PointerEvent) => {
    if (activeTool === 'select') return
    const pt = getSVGCoords(e)
    if (activeTool === 'cone') {
      onDrawingAdd({ id: Date.now().toString(), type: 'cone', points: [pt], color: drawingColor, completed: true })
      return
    }
    svgRef.current?.setPointerCapture(e.pointerId)
    const drawType: DrawingType =
      activeTool === 'zone' ? 'zone' :
      activeTool === 'arrow' ? 'arrow' :
      activeTool === 'dashed' ? 'dashed' : 'line'
    setCurrentDraw({ points: [pt, pt], type: drawType })
  }, [activeTool, drawingColor, getSVGCoords, onDrawingAdd])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const pt = getSVGCoords(e)
    if (dragging) {
      // FIX 3: mark as a genuine drag once we exceed the threshold
      if (!didDragRef.current && dragStartPos.current) {
        const dist = Math.hypot(pt.x - dragStartPos.current.x, pt.y - dragStartPos.current.y)
        if (dist > DRAG_THRESHOLD) didDragRef.current = true
      }
      if (dragging.type === 'player') onPlayerMove(dragging.id, pt.x, pt.y)
      else onBallMove(pt.x, pt.y)
    } else if (currentDraw) {
      setCurrentDraw(prev => prev ? { ...prev, points: [prev.points[0], pt] } : null)
    }
  }, [dragging, currentDraw, getSVGCoords, onPlayerMove, onBallMove])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    svgRef.current?.releasePointerCapture(e.pointerId)
    setDragging(null)
    dragStartPos.current = null

    if (currentDraw && currentDraw.points.length >= 2) {
      const [a, b] = currentDraw.points
      if (Math.hypot(b.x - a.x, b.y - a.y) > 1) {
        onDrawingAdd({
          id: Date.now().toString(),
          type: currentDraw.type,
          points: currentDraw.points,
          color: drawingColor,
          completed: true,
        })
      }
    }
    setCurrentDraw(null)
  }, [currentDraw, drawingColor, onDrawingAdd])

  // ── Render helpers ───────────────────────────────────────────────────────────

  const renderDrawing = (d: Drawing, isPreview = false) => {
    const isHovered = hoveredDrawing === d.id && activeTool === 'eraser'
    const strokeWidth = isHovered ? 1.2 : 0.6

    if (d.type === 'cone') {
      const [p] = d.points
      return (
        <g key={d.id} opacity={isPreview ? 0.7 : 1}
          onPointerEnter={() => setHoveredDrawing(d.id)}
          onPointerLeave={() => setHoveredDrawing(null)}
          onClick={() => activeTool === 'eraser' && onDrawingErase(d.id)}
          style={{ cursor: activeTool === 'eraser' ? 'crosshair' : 'default' }}>
          <polygon
            points={`${p.x},${p.y - 1.8} ${p.x - 1.2},${p.y + 0.8} ${p.x + 1.2},${p.y + 0.8}`}
            fill={isHovered ? '#ff4444' : d.color} stroke="white" strokeWidth="0.15"
          />
        </g>
      )
    }

    if (d.type === 'zone') {
      const [a, b] = d.points
      const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y)
      const w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y)
      return (
        <rect key={d.id} x={x} y={y} width={w} height={h}
          fill={isHovered ? 'rgba(255,68,68,0.3)' : d.color}
          stroke={d.color.replace('rgba', 'rgb').split(',').slice(0, 3).join(',') + ')'}
          strokeWidth="0.3" opacity={isPreview ? 0.7 : 1}
          onPointerEnter={() => setHoveredDrawing(d.id)}
          onPointerLeave={() => setHoveredDrawing(null)}
          onClick={() => activeTool === 'eraser' && onDrawingErase(d.id)}
          style={{ cursor: activeTool === 'eraser' ? 'crosshair' : 'default' }}
        />
      )
    }

    const [a, b] = d.points
    const color = isHovered ? '#ff4444' : d.color
    return (
      <g key={d.id} opacity={isPreview ? 0.7 : 1}
        onPointerEnter={() => setHoveredDrawing(d.id)}
        onPointerLeave={() => setHoveredDrawing(null)}
        onClick={() => activeTool === 'eraser' && onDrawingErase(d.id)}
        style={{ cursor: activeTool === 'eraser' ? 'crosshair' : 'default' }}>
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={d.type === 'dashed' ? '2 1.2' : undefined}
          strokeLinecap="round"
        />
        {d.type === 'arrow' && <polygon points={arrowheadPoints(a, b)} fill={color} />}
      </g>
    )
  }

  const renderPlayer = (p: Player) => {
    if (p.team === 'away' && !showAwayTeam) return null
    const isHome = p.team === 'home'
    const isDragging = dragging?.id === p.id
    const r = 2.8
    // Pure SVG transform: translate to position, then scale around that origin (no CSS transforms)
    const svgTransform = isDragging
      ? `translate(${p.x},${p.y}) scale(1.25)`
      : `translate(${p.x},${p.y})`

    return (
      <g
        key={p.id}
        transform={svgTransform}
        style={{
          pointerEvents: activeTool === 'select' ? 'all' : 'none',
          touchAction: 'none',
          userSelect: 'none',
          cursor: isDragging ? 'grabbing' : activeTool === 'select' ? 'grab' : 'default',
        }}
        onPointerDown={(e) => handlePlayerDown(e, p.id)}
        onClick={() => {
          if (activeTool === 'select' && !didDragRef.current) onPlayerClick(p.id)
        }}
      >
        {/* Large invisible hit area — 2× radius for easy grabbing on touch */}
        <circle r={r * 2} fill="transparent" />
        {/* Dropped shadow */}
        <ellipse
          cx={isDragging ? 0.6 : 0.3}
          cy={isDragging ? r * 1.4 : r * 0.8}
          rx={isDragging ? r * 1.3 : r * 0.9}
          ry={isDragging ? r * 0.55 : r * 0.35}
          fill={isDragging ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.2)'}
        />
        {/* Player circle */}
        <circle r={r}
          fill={p.color}
          stroke={isDragging ? 'white' : isHome ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)'}
          strokeWidth={isDragging ? 0.7 : isHome ? 0.5 : 0.3}
        />
        {/* Jersey number */}
        <text
          textAnchor="middle" dominantBaseline="central"
          fontSize={p.number >= 10 ? 2.4 : 2.8}
          fontWeight="bold" fill={p.textColor}
          fontFamily="system-ui, sans-serif"
          style={{ pointerEvents: 'none' }}>
          {p.number}
        </text>
        {/* Away team indicator dot */}
        {!isHome && (
          <circle cx={r * 0.65} cy={-r * 0.65} r={0.65}
            fill="white" stroke={p.color} strokeWidth="0.15" />
        )}
      </g>
    )
  }

  const renderBall = () => {
    const isDragging = dragging?.type === 'ball'
    const r = 2.4  // ball radius — larger than before for visibility
    // Pure SVG transform: no CSS transforms inside SVG
    const svgTransform = isDragging
      ? `translate(${ball.x},${ball.y}) scale(1.25)`
      : `translate(${ball.x},${ball.y})`

    return (
      <g
        transform={svgTransform}
        style={{
          pointerEvents: activeTool === 'select' ? 'all' : 'none',
          touchAction: 'none',
          userSelect: 'none',
          cursor: isDragging ? 'grabbing' : activeTool === 'select' ? 'grab' : 'default',
        }}
        onPointerDown={handleBallDown}
      >
        {/* Large invisible hit area */}
        <circle r={r * 2.2} fill="transparent" />
        {/* Glow ring — makes ball stand out on any background */}
        <circle r={r + 0.8}
          fill="none"
          stroke={isDragging ? 'rgba(255,220,0,0.9)' : 'rgba(255,220,0,0.55)'}
          strokeWidth="0.5"
        />
        {/* Shadow */}
        <ellipse
          cx={isDragging ? 0.5 : 0.3}
          cy={isDragging ? r * 1.3 : r * 0.9}
          rx={isDragging ? r * 1.2 : r * 0.85}
          ry={isDragging ? r * 0.45 : r * 0.3}
          fill="rgba(0,0,0,0.3)"
        />
        {/* Ball body */}
        <circle r={r} fill="white" stroke="#222" strokeWidth="0.28" />
        {/* Pentagon centre */}
        <circle r={r * 0.27} fill="#222" />
        {/* Spokes */}
        <line x1={0} y1={-r} x2={0} y2={-r * 0.27} stroke="#222" strokeWidth={0.24} />
        <line x1={0} y1={r * 0.27} x2={0} y2={r} stroke="#222" strokeWidth={0.24} />
        <line x1={-r} y1={0} x2={-r * 0.27} y2={0} stroke="#222" strokeWidth={0.24} />
        <line x1={r * 0.27} y1={0} x2={r} y2={0} stroke="#222" strokeWidth={0.24} />
        <line x1={-r * 0.7} y1={-r * 0.7} x2={-r * 0.27} y2={-r * 0.27} stroke="#222" strokeWidth={0.24} />
        <line x1={r * 0.7} y1={-r * 0.7} x2={r * 0.27} y2={-r * 0.27} stroke="#222" strokeWidth={0.24} />
      </g>
    )
  }

  const renderOverlays = () => (
    <g style={{ pointerEvents: 'none' }}>
      {overlays.dangerZone && (
        <g>
          <rect x={13.84} y={78} width={40.32} height={27} fill="rgba(239,68,68,0.18)" />
          <text x={34} y={87} textAnchor="middle" fontSize={2.5}
            fill="rgba(239,68,68,0.9)" fontWeight="bold" fontFamily="system-ui">
            ⚠ DANGER ZONE
          </text>
        </g>
      )}
      {overlays.clearingZones && (
        <g>
          <rect x={0} y={52.5} width={10} height={52.5} fill="rgba(34,197,94,0.2)" />
          <rect x={58} y={52.5} width={10} height={52.5} fill="rgba(34,197,94,0.2)" />
          <text x={5} y={72} textAnchor="middle" fontSize={2} fill="rgba(34,197,94,0.9)"
            fontWeight="bold" fontFamily="system-ui" transform="rotate(-90,5,72)">CLEAR WIDE</text>
          <text x={63} y={72} textAnchor="middle" fontSize={2} fill="rgba(34,197,94,0.9)"
            fontWeight="bold" fontFamily="system-ui" transform="rotate(90,63,72)">CLEAR WIDE</text>
        </g>
      )}
      {overlays.buildOutZone && (
        <g>
          <rect x={0} y={70} width={68} height={35} fill="rgba(59,130,246,0.12)"
            stroke="rgba(59,130,246,0.5)" strokeWidth="0.4" strokeDasharray="3 1.5" />
          <text x={34} y={76} textAnchor="middle" fontSize={2.5}
            fill="rgba(59,130,246,0.9)" fontWeight="bold" fontFamily="system-ui">BUILD-OUT ZONE</text>
        </g>
      )}
      {overlays.attackingZone && (
        <g>
          <rect x={0} y={0} width={68} height={35} fill="rgba(234,179,8,0.12)"
            stroke="rgba(234,179,8,0.5)" strokeWidth="0.4" strokeDasharray="3 1.5" />
          <text x={34} y={8} textAnchor="middle" fontSize={2.5}
            fill="rgba(234,179,8,0.9)" fontWeight="bold" fontFamily="system-ui">⭐ ATTACKING ZONE</text>
        </g>
      )}
      {overlays.noClearMiddle && (
        <g>
          <rect x={20} y={75} width={28} height={30} fill="rgba(239,68,68,0.2)"
            stroke="rgba(239,68,68,0.7)" strokeWidth="0.4" strokeDasharray="2 1" />
          <text x={34} y={91} textAnchor="middle" fontSize={2.2}
            fill="rgba(239,68,68,1)" fontWeight="bold" fontFamily="system-ui">🚫 NO CLEAR MIDDLE</text>
        </g>
      )}
      {overlays.passingLanes && (
        <g opacity={0.6}>
          {[20, 34, 48].map((x) => (
            <line key={x} x1={x} y1={105} x2={x} y2={0}
              stroke="rgba(168,85,247,0.5)" strokeWidth="0.6" strokeDasharray="3 2" />
          ))}
          <text x={34} y={54} textAnchor="middle" fontSize={2}
            fill="rgba(168,85,247,0.9)" fontFamily="system-ui">PASSING LANES</text>
        </g>
      )}
      {overlays.widthGuide && (
        <g opacity={0.6}>
          <line x1={8} y1={0} x2={8} y2={105} stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1={60} y1={0} x2={60} y2={105} stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" strokeDasharray="2 2" />
          <text x={8} y={52.5} textAnchor="middle" fontSize={1.8} fill="rgba(255,255,255,0.7)"
            fontFamily="system-ui" transform="rotate(-90,8,52.5)">WIDTH GUIDE</text>
          <text x={60} y={52.5} textAnchor="middle" fontSize={1.8} fill="rgba(255,255,255,0.7)"
            fontFamily="system-ui" transform="rotate(90,60,52.5)">WIDTH GUIDE</text>
        </g>
      )}
      {ball.showTarget && (
        <g>
          <rect x={18} y={5} width={32} height={18} rx={2}
            fill="rgba(249,115,22,0.2)" stroke="rgba(249,115,22,0.7)"
            strokeWidth="0.5" strokeDasharray="2 1" />
          <text x={34} y={12} textAnchor="middle" fontSize={2.2}
            fill="rgba(249,115,22,1)" fontWeight="bold" fontFamily="system-ui">🎯 TARGET AREA</text>
        </g>
      )}
    </g>
  )

  const fieldLineStyle = { stroke: 'white', strokeWidth: 0.5, fill: 'none' }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        ref={svgRef}
        viewBox={`-2.44 -2.44 ${W + 4.88} ${H + 4.88}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full select-none"
        style={{
          touchAction: 'none',
          maxHeight: '100%',
          maxWidth: '100%',
          // FIX 5: show grabbing cursor on the whole SVG while actively dragging
          cursor: dragging ? 'grabbing' : undefined,
        }}
        onPointerDown={handleFieldDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        // FIX 1: removed onPointerLeave — pointer capture keeps events routed here even
        // when the pointer exits the SVG, so we must NOT prematurely end the drag here.
      >
        {/* Grass stripes */}
        {Array.from({ length: 21 }).map((_, i) => (
          <rect key={i} x={0} y={i * 5} width={W} height={5}
            fill={i % 2 === 0 ? '#2d8a2d' : '#267a26'} />
        ))}

        {/* Goals */}
        <rect x={30.34} y={-2.44} width={7.32} height={2.44} fill="#888" stroke="white" strokeWidth={0.4} />
        <rect x={30.34} y={H}      width={7.32} height={2.44} fill="#888" stroke="white" strokeWidth={0.4} />

        {/* Field outline */}
        <rect x={0} y={0} width={W} height={H} {...fieldLineStyle} />

        {/* Halfway line */}
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} {...fieldLineStyle} />

        {/* Center circle + spot */}
        <circle cx={W / 2} cy={H / 2} r={9.15} {...fieldLineStyle} />
        <circle cx={W / 2} cy={H / 2} r={0.5} fill="white" />

        {/* Penalty areas */}
        <rect x={13.84} y={0}          width={40.32} height={16.5} {...fieldLineStyle} />
        <rect x={13.84} y={H - 16.5}   width={40.32} height={16.5} {...fieldLineStyle} />

        {/* Goal areas */}
        <rect x={24.84} y={0}       width={18.32} height={5.5} {...fieldLineStyle} />
        <rect x={24.84} y={H - 5.5} width={18.32} height={5.5} {...fieldLineStyle} />

        {/* Penalty spots */}
        <circle cx={W / 2} cy={11}      r={0.5} fill="white" />
        <circle cx={W / 2} cy={H - 11} r={0.5} fill="white" />

        {/* Penalty arcs */}
        <path d={`M ${W / 2 - 9.5} 16.5 A 9.15 9.15 0 0 0 ${W / 2 + 9.5} 16.5`} {...fieldLineStyle} />
        <path d={`M ${W / 2 - 9.5} ${H - 16.5} A 9.15 9.15 0 0 1 ${W / 2 + 9.5} ${H - 16.5}`} {...fieldLineStyle} />

        {/* Corner arcs */}
        <path d="M 0 1 A 1 1 0 0 0 1 0"       {...fieldLineStyle} />
        <path d="M 67 0 A 1 1 0 0 0 68 1"      {...fieldLineStyle} />
        <path d="M 0 104 A 1 1 0 0 1 1 105"    {...fieldLineStyle} />
        <path d="M 67 105 A 1 1 0 0 1 68 104"  {...fieldLineStyle} />

        {/* Team labels */}
        <text x={W / 2} y={H - 1.2} textAnchor="middle" fontSize={2.5}
          fill="rgba(255,255,255,0.4)" fontFamily="system-ui" style={{ pointerEvents: 'none' }}>HOME</text>
        <text x={W / 2} y={2.8} textAnchor="middle" fontSize={2.5}
          fill="rgba(255,255,255,0.4)" fontFamily="system-ui" style={{ pointerEvents: 'none' }}>AWAY</text>

        {/* Overlays */}
        {renderOverlays()}

        {/* Completed drawings */}
        {drawings.map((d) => renderDrawing(d))}

        {/* Preview drawing */}
        {currentDraw && renderDrawing({
          id: '__preview__',
          type: currentDraw.type,
          points: currentDraw.points,
          color: drawingColor,
          completed: false,
        }, true)}

        {/* Players */}
        {players.map(renderPlayer)}

        {/* Ball — rendered after players so it always sits on top */}
        {renderBall()}
      </svg>

      {/* Animation step note */}
      {animationNote && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 text-white
          text-sm px-4 py-2 rounded-full max-w-xs text-center pointer-events-none z-10 border border-yellow-400">
          {animationNote}
        </div>
      )}
    </div>
  )
}
