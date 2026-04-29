'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
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

// Field: 68m wide × 105m tall in SVG units
const W = 68
const H = 105

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
  const [dragging, setDragging] = useState<{ id: string; type: 'player' | 'ball' } | null>(null)
  const [currentDraw, setCurrentDraw] = useState<{ points: Point[]; type: DrawingType } | null>(null)
  const [hoveredDrawing, setHoveredDrawing] = useState<string | null>(null)

  const getSVGCoords = useCallback((e: React.PointerEvent): Point => {
    const svg = svgRef.current!
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const inv = svg.getScreenCTM()!.inverse()
    const sp = pt.matrixTransform(inv)
    return { x: Math.max(0, Math.min(W, sp.x)), y: Math.max(0, Math.min(H, sp.y)) }
  }, [])

  const handlePlayerDown = useCallback((e: React.PointerEvent, id: string) => {
    if (activeTool !== 'select') return
    e.stopPropagation()
    svgRef.current?.setPointerCapture(e.pointerId)
    setDragging({ id, type: 'player' })
  }, [activeTool])

  const handleBallDown = useCallback((e: React.PointerEvent) => {
    if (activeTool !== 'select') return
    e.stopPropagation()
    svgRef.current?.setPointerCapture(e.pointerId)
    setDragging({ id: 'ball', type: 'ball' })
  }, [activeTool])

  const handleFieldDown = useCallback((e: React.PointerEvent) => {
    if (activeTool === 'select') return
    const pt = getSVGCoords(e)
    if (activeTool === 'cone') {
      onDrawingAdd({
        id: Date.now().toString(),
        type: 'cone',
        points: [pt],
        color: drawingColor,
        completed: true,
      })
      return
    }
    svgRef.current?.setPointerCapture(e.pointerId)
    const drawType: DrawingType = activeTool === 'zone' ? 'zone'
      : activeTool === 'arrow' ? 'arrow'
      : activeTool === 'dashed' ? 'dashed' : 'line'
    setCurrentDraw({ points: [pt, pt], type: drawType })
  }, [activeTool, drawingColor, getSVGCoords, onDrawingAdd])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const pt = getSVGCoords(e)
    if (dragging) {
      if (dragging.type === 'player') onPlayerMove(dragging.id, pt.x, pt.y)
      else onBallMove(pt.x, pt.y)
    } else if (currentDraw) {
      setCurrentDraw(prev => prev ? { ...prev, points: [prev.points[0], pt] } : null)
    }
  }, [dragging, currentDraw, getSVGCoords, onPlayerMove, onBallMove])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    svgRef.current?.releasePointerCapture(e.pointerId)
    setDragging(null)
    if (currentDraw && currentDraw.points.length >= 2) {
      const [a, b] = currentDraw.points
      const dist = Math.hypot(b.x - a.x, b.y - a.y)
      if (dist > 1) {
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

  const renderDrawing = (d: Drawing, isPreview = false) => {
    const key = d.id
    const opacity = isPreview ? 0.7 : 1
    const isHovered = hoveredDrawing === d.id && activeTool === 'eraser'
    const strokeWidth = isHovered ? 1.2 : 0.6

    if (d.type === 'cone') {
      const [p] = d.points
      return (
        <g key={key} opacity={opacity}
          onPointerEnter={() => setHoveredDrawing(d.id)}
          onPointerLeave={() => setHoveredDrawing(null)}
          onClick={() => activeTool === 'eraser' && onDrawingErase(d.id)}
          style={{ cursor: activeTool === 'eraser' ? 'crosshair' : 'default' }}>
          <polygon
            points={`${p.x},${p.y - 1.8} ${p.x - 1.2},${p.y + 0.8} ${p.x + 1.2},${p.y + 0.8}`}
            fill={isHovered ? '#ff4444' : d.color}
            stroke="white" strokeWidth="0.15"
          />
        </g>
      )
    }

    if (d.type === 'zone') {
      const [a, b] = d.points
      const x = Math.min(a.x, b.x)
      const y = Math.min(a.y, b.y)
      const w = Math.abs(b.x - a.x)
      const h = Math.abs(b.y - a.y)
      return (
        <rect key={key} x={x} y={y} width={w} height={h}
          fill={isHovered ? 'rgba(255,68,68,0.3)' : d.color}
          stroke={d.color.replace('rgba', 'rgb').split(',').slice(0, 3).join(',') + ')'}
          strokeWidth="0.3" opacity={opacity}
          onPointerEnter={() => setHoveredDrawing(d.id)}
          onPointerLeave={() => setHoveredDrawing(null)}
          onClick={() => activeTool === 'eraser' && onDrawingErase(d.id)}
          style={{ cursor: activeTool === 'eraser' ? 'crosshair' : 'default' }}
        />
      )
    }

    const [a, b] = d.points
    const isDashed = d.type === 'dashed'
    const color = isHovered ? '#ff4444' : d.color

    return (
      <g key={key} opacity={opacity}
        onPointerEnter={() => setHoveredDrawing(d.id)}
        onPointerLeave={() => setHoveredDrawing(null)}
        onClick={() => activeTool === 'eraser' && onDrawingErase(d.id)}
        style={{ cursor: activeTool === 'eraser' ? 'crosshair' : 'default' }}>
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={isDashed ? '2 1.2' : undefined}
          strokeLinecap="round"
        />
        {d.type === 'arrow' && (
          <polygon points={arrowheadPoints(a, b)} fill={color} />
        )}
      </g>
    )
  }

  const renderPlayer = (p: Player) => {
    if (p.team === 'away' && !showAwayTeam) return null
    const isHome = p.team === 'home'
    const r = 2.4
    return (
      <g key={p.id} transform={`translate(${p.x},${p.y})`}
        onPointerDown={(e) => handlePlayerDown(e, p.id)}
        onClick={() => activeTool === 'select' && onPlayerClick(p.id)}
        style={{ cursor: activeTool === 'select' ? 'grab' : 'default', touchAction: 'none', userSelect: 'none' }}>
        {/* Shadow */}
        <ellipse cx={0.3} cy={r * 0.8} rx={r * 0.9} ry={r * 0.35} fill="rgba(0,0,0,0.2)" />
        {/* Player circle */}
        <circle r={r} fill={p.color}
          stroke={isHome ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)'}
          strokeWidth={isHome ? 0.5 : 0.3}
        />
        {/* Jersey number */}
        <text textAnchor="middle" dominantBaseline="central"
          fontSize={p.number >= 10 ? 2.2 : 2.6}
          fontWeight="bold" fill={p.textColor}
          fontFamily="system-ui, sans-serif"
          style={{ pointerEvents: 'none' }}>
          {p.number}
        </text>
        {/* Team indicator dot for away */}
        {!isHome && (
          <circle cx={r * 0.65} cy={-r * 0.65} r={0.6}
            fill="white" stroke={p.color} strokeWidth="0.15" />
        )}
      </g>
    )
  }

  const renderBall = () => (
    <g transform={`translate(${ball.x},${ball.y})`}
      onPointerDown={handleBallDown}
      style={{ cursor: activeTool === 'select' ? 'grab' : 'default', touchAction: 'none', userSelect: 'none' }}>
      <ellipse cx={0.3} cy={1.5} rx={1.4} ry={0.5} fill="rgba(0,0,0,0.2)" />
      <circle r={1.6} fill="white" stroke="#111" strokeWidth="0.25" />
      {/* Pentagon pattern */}
      <circle r={0.6} fill="#111" />
      <line x1={0} y1={-1.6} x2={0} y2={-0.6} stroke="#111" strokeWidth={0.22} />
      <line x1={0} y1={0.6} x2={0} y2={1.6} stroke="#111" strokeWidth={0.22} />
      <line x1={-1.6} y1={0} x2={-0.6} y2={0} stroke="#111" strokeWidth={0.22} />
      <line x1={0.6} y1={0} x2={1.6} y2={0} stroke="#111" strokeWidth={0.22} />
      <line x1={-1.1} y1={-1.1} x2={-0.45} y2={-0.45} stroke="#111" strokeWidth={0.22} />
      <line x1={1.1} y1={-1.1} x2={0.45} y2={-0.45} stroke="#111" strokeWidth={0.22} />
    </g>
  )

  const renderOverlays = () => (
    <g>
      {/* Danger zone — red semi-transparent near home goal */}
      {overlays.dangerZone && (
        <g>
          <rect x={13.84} y={78} width={40.32} height={27} fill="rgba(239,68,68,0.18)" />
          <text x={34} y={87} textAnchor="middle" fontSize={2.5}
            fill="rgba(239,68,68,0.9)" fontWeight="bold" fontFamily="system-ui">
            ⚠ DANGER ZONE
          </text>
        </g>
      )}
      {/* Safe clearing zones — green wide channels */}
      {overlays.clearingZones && (
        <g>
          <rect x={0} y={52.5} width={10} height={52.5} fill="rgba(34,197,94,0.2)" />
          <rect x={58} y={52.5} width={10} height={52.5} fill="rgba(34,197,94,0.2)" />
          <text x={5} y={72} textAnchor="middle" fontSize={2} fill="rgba(34,197,94,0.9)"
            fontWeight="bold" fontFamily="system-ui" transform="rotate(-90,5,72)">
            CLEAR WIDE
          </text>
          <text x={63} y={72} textAnchor="middle" fontSize={2} fill="rgba(34,197,94,0.9)"
            fontWeight="bold" fontFamily="system-ui" transform="rotate(90,63,72)">
            CLEAR WIDE
          </text>
        </g>
      )}
      {/* Build-out zone — blue lower third */}
      {overlays.buildOutZone && (
        <g>
          <rect x={0} y={70} width={68} height={35} fill="rgba(59,130,246,0.12)"
            stroke="rgba(59,130,246,0.5)" strokeWidth="0.4" strokeDasharray="3 1.5" />
          <text x={34} y={76} textAnchor="middle" fontSize={2.5}
            fill="rgba(59,130,246,0.9)" fontWeight="bold" fontFamily="system-ui">
            BUILD-OUT ZONE
          </text>
        </g>
      )}
      {/* Attacking zone — yellow top third */}
      {overlays.attackingZone && (
        <g>
          <rect x={0} y={0} width={68} height={35} fill="rgba(234,179,8,0.12)"
            stroke="rgba(234,179,8,0.5)" strokeWidth="0.4" strokeDasharray="3 1.5" />
          <text x={34} y={8} textAnchor="middle" fontSize={2.5}
            fill="rgba(234,179,8,0.9)" fontWeight="bold" fontFamily="system-ui">
            ⭐ ATTACKING ZONE
          </text>
        </g>
      )}
      {/* No-clear-middle zone */}
      {overlays.noClearMiddle && (
        <g>
          <rect x={20} y={75} width={28} height={30} fill="rgba(239,68,68,0.2)"
            stroke="rgba(239,68,68,0.7)" strokeWidth="0.4" strokeDasharray="2 1" />
          <text x={34} y={91} textAnchor="middle" fontSize={2.2}
            fill="rgba(239,68,68,1)" fontWeight="bold" fontFamily="system-ui">
            🚫 NO CLEAR MIDDLE
          </text>
        </g>
      )}
      {/* Passing lanes */}
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
      {/* Width guide */}
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
      {/* Target ball area — orange zone in front of away goal */}
      {ball.showTarget && (
        <g>
          <rect x={18} y={5} width={32} height={18} rx={2}
            fill="rgba(249,115,22,0.2)" stroke="rgba(249,115,22,0.7)"
            strokeWidth="0.5" strokeDasharray="2 1" />
          <text x={34} y={12} textAnchor="middle" fontSize={2.2}
            fill="rgba(249,115,22,1)" fontWeight="bold" fontFamily="system-ui">
            🎯 TARGET AREA
          </text>
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
        style={{ touchAction: 'none', maxHeight: '100%', maxWidth: '100%' }}
        onPointerDown={handleFieldDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* ── Grass stripes ── */}
        {Array.from({ length: 21 }).map((_, i) => (
          <rect key={i} x={0} y={i * 5} width={W} height={5}
            fill={i % 2 === 0 ? '#2d8a2d' : '#267a26'} />
        ))}

        {/* ── Goals (gray boxes outside field) ── */}
        <rect x={30.34} y={-2.44} width={7.32} height={2.44}
          fill="#888" stroke="white" strokeWidth={0.4} />
        <rect x={30.34} y={H} width={7.32} height={2.44}
          fill="#888" stroke="white" strokeWidth={0.4} />

        {/* ── Field outline ── */}
        <rect x={0} y={0} width={W} height={H} {...fieldLineStyle} />

        {/* ── Halfway line ── */}
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} {...fieldLineStyle} />

        {/* ── Center circle ── */}
        <circle cx={W / 2} cy={H / 2} r={9.15} {...fieldLineStyle} />
        <circle cx={W / 2} cy={H / 2} r={0.5} fill="white" />

        {/* ── Penalty areas ── */}
        <rect x={13.84} y={0} width={40.32} height={16.5} {...fieldLineStyle} />
        <rect x={13.84} y={H - 16.5} width={40.32} height={16.5} {...fieldLineStyle} />

        {/* ── Goal areas (6-yard boxes) ── */}
        <rect x={24.84} y={0} width={18.32} height={5.5} {...fieldLineStyle} />
        <rect x={24.84} y={H - 5.5} width={18.32} height={5.5} {...fieldLineStyle} />

        {/* ── Penalty spots ── */}
        <circle cx={W / 2} cy={11} r={0.5} fill="white" />
        <circle cx={W / 2} cy={H - 11} r={0.5} fill="white" />

        {/* ── Penalty arcs ── */}
        <path d={`M ${W / 2 - 9.5} 16.5 A 9.15 9.15 0 0 0 ${W / 2 + 9.5} 16.5`} {...fieldLineStyle} />
        <path d={`M ${W / 2 - 9.5} ${H - 16.5} A 9.15 9.15 0 0 1 ${W / 2 + 9.5} ${H - 16.5}`} {...fieldLineStyle} />

        {/* ── Corner arcs ── */}
        <path d="M 0 1 A 1 1 0 0 0 1 0" {...fieldLineStyle} />
        <path d="M 67 0 A 1 1 0 0 0 68 1" {...fieldLineStyle} />
        <path d="M 0 104 A 1 1 0 0 1 1 105" {...fieldLineStyle} />
        <path d="M 67 105 A 1 1 0 0 1 68 104" {...fieldLineStyle} />

        {/* ── Team labels ── */}
        <text x={W / 2} y={H - 1.2} textAnchor="middle" fontSize={2.5}
          fill="rgba(255,255,255,0.4)" fontFamily="system-ui">HOME</text>
        <text x={W / 2} y={2.8} textAnchor="middle" fontSize={2.5}
          fill="rgba(255,255,255,0.4)" fontFamily="system-ui">AWAY</text>

        {/* ── Overlays ── */}
        {renderOverlays()}

        {/* ── Completed drawings ── */}
        {drawings.map((d) => renderDrawing(d))}

        {/* ── Preview drawing ── */}
        {currentDraw && renderDrawing({
          id: '__preview__',
          type: currentDraw.type,
          points: currentDraw.points,
          color: drawingColor,
          completed: false,
        }, true)}

        {/* ── Ball ── */}
        {renderBall()}

        {/* ── Players ── */}
        {players.map(renderPlayer)}
      </svg>

      {/* Animation step note overlay */}
      {animationNote && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 text-white
          text-sm px-4 py-2 rounded-full max-w-xs text-center pointer-events-none z-10 border border-yellow-400">
          {animationNote}
        </div>
      )}
    </div>
  )
}
