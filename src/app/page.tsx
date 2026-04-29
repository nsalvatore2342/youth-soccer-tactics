'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  Player, BallState, Drawing, OverlayState, Tool, Pattern,
  Formation, GameFormat, Point,
} from '@/types'
import { FORMATIONS } from '@/data/formations'
import SoccerField from '@/components/SoccerField'
import DrawingToolbar from '@/components/DrawingToolbar'
import FormationPanel from '@/components/FormationPanel'
import OverlayControls from '@/components/OverlayControls'
import PatternLibrary from '@/components/PatternLibrary'
import CoachNotesPanel from '@/components/CoachNotesPanel'
import AICoachBox from '@/components/AICoachBox'

// ─── Helpers ───────────────────────────────────────────────────────────────────

const DEFAULT_HOME_COLOR = '#3b82f6'
const DEFAULT_AWAY_COLOR = '#ef4444'

function makePlayer(
  id: string, team: 'home' | 'away', number: number, x: number, y: number,
  color: string, textColor = 'white', name = '',
): Player {
  return { id, team, number, name, x, y, color, textColor }
}

function buildDefaultPlayers(
  homeColor: string, awayColor: string,
  homeCount: number, awayCount: number,
): Player[] {
  const players: Player[] = []

  // Home team starting positions (7v7 base, filled from GK outward)
  const homePositions: Point[] = [
    { x: 34, y: 99 },  // GK
    { x: 14, y: 82 }, { x: 34, y: 85 }, { x: 54, y: 82 }, // defenders
    { x: 22, y: 65 }, { x: 46, y: 65 },  // midfielders
    { x: 34, y: 42 },  // striker
    { x: 14, y: 65 }, { x: 54, y: 65 },  // wide mids
    { x: 14, y: 42 }, { x: 54, y: 42 },  // wings
  ]

  for (let i = 0; i < homeCount; i++) {
    const pos = homePositions[i] ?? { x: 20 + (i % 5) * 8, y: 60 }
    players.push(makePlayer(`home-${i + 1}`, 'home', i + 1, pos.x, pos.y, homeColor))
  }

  // Away team — mirrored vertically
  const awayPositions: Point[] = [
    { x: 34, y: 6 },
    { x: 14, y: 23 }, { x: 34, y: 20 }, { x: 54, y: 23 },
    { x: 22, y: 40 }, { x: 46, y: 40 },
    { x: 34, y: 63 },
    { x: 14, y: 40 }, { x: 54, y: 40 },
    { x: 14, y: 63 }, { x: 54, y: 63 },
  ]

  for (let i = 0; i < awayCount; i++) {
    const pos = awayPositions[i] ?? { x: 20 + (i % 5) * 8, y: 45 }
    players.push(makePlayer(`away-${i + 1}`, 'away', i + 1, pos.x, pos.y, awayColor))
  }

  return players
}

const DEFAULT_OVERLAYS: OverlayState = {
  dangerZone: false,
  clearingZones: false,
  buildOutZone: false,
  attackingZone: false,
  noClearMiddle: false,
  passingLanes: false,
  widthGuide: false,
}

const LS_KEY = 'soccer-tactics-v1'

type SideTab = 'formations' | 'patterns' | 'overlays' | 'notes' | 'ai'

// ─── Player Edit Modal ──────────────────────────────────────────────────────────

function PlayerEditModal({
  player, onSave, onClose,
}: { player: Player; onSave: (p: Player) => void; onClose: () => void }) {
  const [name, setName] = useState(player.name)
  const [number, setNumber] = useState(player.number)
  const [color, setColor] = useState(player.color)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div className="bg-gray-800 rounded-xl p-5 w-full max-w-sm border border-gray-600 shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <h3 className="text-white font-bold text-lg mb-4">Edit Player</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Jersey Number</label>
            <input type="number" min={1} max={99} value={number}
              onChange={(e) => setNumber(Number(e.target.value))}
              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-lg font-bold
                border border-gray-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Player Name (optional)</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full bg-gray-700 text-white rounded px-3 py-2
                border border-gray-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Color</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 rounded cursor-pointer border-0 bg-transparent" />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose}
            className="flex-1 py-2 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm">
            Cancel
          </button>
          <button onClick={() => { onSave({ ...player, name, number, color }); onClose() }}
            className="flex-1 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 text-sm font-bold">
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Save/Load Panel ────────────────────────────────────────────────────────────

function SavePanel({
  players, ball, drawings, overlays,
  onLoad, onClose,
}: {
  players: Player[]; ball: BallState; drawings: Drawing[]; overlays: OverlayState
  onLoad: (data: { players: Player[]; ball: BallState; drawings: Drawing[]; overlays: OverlayState }) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [saves, setSaves] = useState<Array<{ name: string; key: string; date: string }>>([])

  useEffect(() => {
    const stored = Object.keys(localStorage)
      .filter((k) => k.startsWith(LS_KEY + '-'))
      .map((k) => {
        try { const d = JSON.parse(localStorage.getItem(k)!); return { name: d.name, key: k, date: d.date } }
        catch { return null }
      })
      .filter(Boolean) as Array<{ name: string; key: string; date: string }>
    setSaves(stored)
  }, [])

  const handleSave = () => {
    if (!name.trim()) return
    const key = `${LS_KEY}-${Date.now()}`
    localStorage.setItem(key, JSON.stringify({ name, date: new Date().toLocaleDateString(), players, ball, drawings, overlays }))
    alert(`Saved: "${name}"`)
    onClose()
  }

  const handleLoad = (key: string) => {
    try {
      const d = JSON.parse(localStorage.getItem(key)!)
      onLoad({ players: d.players, ball: d.ball, drawings: d.drawings, overlays: d.overlays })
      onClose()
    } catch {
      alert('Failed to load save.')
    }
  }

  const handleDelete = (key: string) => {
    localStorage.removeItem(key)
    setSaves((prev) => prev.filter((s) => s.key !== key))
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div className="bg-gray-800 rounded-xl p-5 w-full max-w-sm border border-gray-600 shadow-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <h3 className="text-white font-bold text-lg mb-3">Save / Load Board</h3>

        <div className="flex gap-2 mb-4">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Board name (e.g. Practice #3)"
            className="flex-1 bg-gray-700 text-white rounded px-3 py-2 text-sm
              border border-gray-600 focus:border-blue-500 focus:outline-none" />
          <button onClick={handleSave} disabled={!name.trim()}
            className="px-3 py-2 bg-green-600 text-white rounded text-sm font-bold hover:bg-green-500 disabled:opacity-40">
            💾 Save
          </button>
        </div>

        {saves.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No saved boards yet</p>
        ) : (
          <div className="space-y-2">
            {saves.map((s) => (
              <div key={s.key} className="flex items-center gap-2 bg-gray-700 rounded p-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{s.name}</p>
                  <p className="text-gray-400 text-xs">{s.date}</p>
                </div>
                <button onClick={() => handleLoad(s.key)}
                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-500">
                  Load
                </button>
                <button onClick={() => handleDelete(s.key)}
                  className="px-2 py-1 bg-gray-600 text-gray-300 rounded text-xs hover:bg-red-800 hover:text-red-200">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <button onClick={onClose}
          className="w-full mt-4 py-2 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600">
          Close
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [gameFormat, setGameFormat] = useState<GameFormat>('7v7')
  const [homeColor, setHomeColor] = useState(DEFAULT_HOME_COLOR)
  const [awayColor, setAwayColor] = useState(DEFAULT_AWAY_COLOR)
  const [homeCount, setHomeCount] = useState(7)
  const [awayCount, setAwayCount] = useState(7)
  const [showAwayTeam, setShowAwayTeam] = useState(false)
  const [players, setPlayers] = useState<Player[]>(() =>
    buildDefaultPlayers(DEFAULT_HOME_COLOR, DEFAULT_AWAY_COLOR, 7, 7))
  const [ball, setBall] = useState<BallState>({ x: 34, y: 52.5, attachedTo: null, showTarget: false })
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [overlays, setOverlays] = useState<OverlayState>(DEFAULT_OVERLAYS)
  const [activeTool, setActiveTool] = useState<Tool>('select')
  const [drawingColor, setDrawingColor] = useState('#FFFF00')
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null)
  const [activePattern, setActivePattern] = useState<Pattern | null>(null)
  const [animationStep, setAnimationStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [activeTab, setActiveTab] = useState<SideTab>('formations')
  const [sidePanelOpen, setSidePanelOpen] = useState(true)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [showSavePanel, setShowSavePanel] = useState(false)
  const [showCoachTip, setShowCoachTip] = useState(false)
  const [coachTip, setCoachTip] = useState('')
  const animIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sync player colors when team color changes
  useEffect(() => {
    setPlayers((prev) => prev.map((p) =>
      p.team === 'home' ? { ...p, color: homeColor } : p
    ))
  }, [homeColor])

  useEffect(() => {
    setPlayers((prev) => prev.map((p) =>
      p.team === 'away' ? { ...p, color: awayColor } : p
    ))
  }, [awayColor])

  // Rebuild players when count or format changes
  const handleHomeCountChange = useCallback((n: number) => {
    setHomeCount(n)
    setPlayers((prev) => {
      const existing = prev.filter((p) => p.team === 'home')
      if (n > existing.length) {
        const extras = buildDefaultPlayers(homeColor, awayColor, n, 0)
          .slice(existing.length)
        return [...prev, ...extras]
      }
      return [...prev.filter((p) => p.team === 'away'), ...existing.slice(0, n)]
    })
  }, [homeColor, awayColor])

  const handleAwayCountChange = useCallback((n: number) => {
    setAwayCount(n)
    setPlayers((prev) => {
      const existing = prev.filter((p) => p.team === 'away')
      if (n > existing.length) {
        const extras = buildDefaultPlayers(homeColor, awayColor, 0, n)
          .filter((p) => p.team === 'away')
          .slice(existing.length)
        return [...prev, ...extras]
      }
      return [...prev.filter((p) => p.team === 'home'), ...existing.slice(0, n)]
    })
  }, [homeColor, awayColor])

  const handleGameFormatChange = useCallback((f: GameFormat) => {
    const count = f === '7v7' ? 7 : f === '9v9' ? 9 : 11
    setGameFormat(f)
    setHomeCount(count)
    setAwayCount(count)
    setPlayers(buildDefaultPlayers(homeColor, awayColor, count, count))
    setSelectedFormation(null)
  }, [homeColor, awayColor])

  // Formation apply
  const handleFormationSelect = useCallback((formation: Formation) => {
    setSelectedFormation(formation)
    setPlayers((prev) => {
      const homePlayers = prev.filter((p) => p.team === 'home')
      const awayPlayers = prev.filter((p) => p.team === 'away')
      const updatedHome = homePlayers.map((p, i) => {
        const pos = formation.positions[i]
        return pos ? { ...p, x: pos.x, y: pos.y } : p
      })
      return [...updatedHome, ...awayPlayers]
    })
    setShowCoachTip(true)
    setCoachTip(`${formation.name}: ${formation.tooltip}`)
    setTimeout(() => setShowCoachTip(false), 4000)
  }, [])

  // Pattern load
  const handlePatternLoad = useCallback((pattern: Pattern) => {
    setActivePattern(pattern)
    setAnimationStep(0)
    setIsAnimating(false)

    // Place players from pattern
    const homePats = pattern.players.filter((p) => !p.team || p.team === 'home')
    const awayPats = pattern.players.filter((p) => p.team === 'away')

    setPlayers((prev) => {
      const homePlayers = prev.filter((p) => p.team === 'home')
      const awayPlayers = prev.filter((p) => p.team === 'away')

      const updatedHome = homePlayers.map((p, i) => {
        const pat = homePats[i]
        return pat ? { ...p, x: pat.x, y: pat.y, number: pat.number } : p
      })
      const updatedAway = awayPlayers.map((p, i) => {
        const pat = awayPats[i]
        return pat ? { ...p, x: pat.x, y: pat.y, number: pat.number } : p
      })

      // Show away team if pattern has away players
      if (awayPats.length > 0) setShowAwayTeam(true)

      return [...updatedHome, ...updatedAway]
    })

    setBall({ x: pattern.ball.x, y: pattern.ball.y, attachedTo: null, showTarget: false })

    // Load pattern drawings
    setDrawings(
      pattern.drawings.map((d, i) => ({
        id: `pattern-${i}`,
        type: d.type,
        points: d.points,
        color: d.color,
        completed: true,
      }))
    )

    setActiveTab('patterns')
  }, [])

  // Animation
  const stopAnimation = useCallback(() => {
    if (animIntervalRef.current) {
      clearInterval(animIntervalRef.current)
      animIntervalRef.current = null
    }
    setIsAnimating(false)
  }, [])

  const handlePlay = useCallback(() => {
    if (!activePattern) return
    setIsAnimating(true)
    animIntervalRef.current = setInterval(() => {
      setAnimationStep((prev) => {
        if (prev >= (activePattern?.steps.length ?? 1) - 1) {
          stopAnimation()
          return prev
        }
        return prev + 1
      })
    }, 2500)
  }, [activePattern, stopAnimation])

  const handlePause = useCallback(() => {
    stopAnimation()
  }, [stopAnimation])

  const handleStop = useCallback(() => {
    stopAnimation()
    setActivePattern(null)
    setAnimationStep(0)
  }, [stopAnimation])

  const handleNextStep = useCallback(() => {
    if (!activePattern) return
    setAnimationStep((prev) => Math.min(prev + 1, activePattern.steps.length - 1))
  }, [activePattern])

  const handlePrevStep = useCallback(() => {
    setAnimationStep((prev) => Math.max(0, prev - 1))
  }, [])

  useEffect(() => () => stopAnimation(), [stopAnimation])

  // Player moves
  const handlePlayerMove = useCallback((id: string, x: number, y: number) => {
    setPlayers((prev) => prev.map((p) => p.id === id ? { ...p, x, y } : p))
  }, [])

  const handleBallMove = useCallback((x: number, y: number) => {
    setBall((prev) => ({ ...prev, x, y }))
  }, [])

  const handleDrawingAdd = useCallback((d: Drawing) => {
    setDrawings((prev) => [...prev, d])
  }, [])

  const handleDrawingErase = useCallback((id: string) => {
    setDrawings((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const handleUndo = useCallback(() => {
    setDrawings((prev) => prev.slice(0, -1))
  }, [])

  const handleClearDrawings = useCallback(() => {
    setDrawings([])
  }, [])

  const handleResetAll = useCallback(() => {
    if (!confirm('Reset everything? Players, ball, and drawings will all be cleared.')) return
    const count = gameFormat === '7v7' ? 7 : gameFormat === '9v9' ? 9 : 11
    setPlayers(buildDefaultPlayers(homeColor, awayColor, count, count))
    setBall({ x: 34, y: 52.5, attachedTo: null, showTarget: false })
    setDrawings([])
    setOverlays(DEFAULT_OVERLAYS)
    setSelectedFormation(null)
    setActivePattern(null)
    setAnimationStep(0)
    stopAnimation()
  }, [gameFormat, homeColor, awayColor, stopAnimation])

  const handleResetBall = useCallback(() => {
    setBall({ x: 34, y: 52.5, attachedTo: null, showTarget: false })
  }, [])

  const handleOverlayToggle = useCallback((key: keyof OverlayState) => {
    setOverlays((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handlePlayerClick = useCallback((id: string) => {
    const player = players.find((p) => p.id === id)
    if (player) setEditingPlayer(player)
  }, [players])

  const handlePlayerSave = useCallback((updated: Player) => {
    setPlayers((prev) => prev.map((p) => p.id === updated.id ? updated : p))
  }, [])

  const handleLoadBoard = useCallback((data: {
    players: Player[]; ball: BallState; drawings: Drawing[]; overlays: OverlayState
  }) => {
    setPlayers(data.players)
    setBall(data.ball)
    setDrawings(data.drawings)
    setOverlays(data.overlays)
  }, [])

  const TABS: { id: SideTab; label: string; icon: string }[] = [
    { id: 'formations', label: 'Formations', icon: '⚽' },
    { id: 'patterns', label: 'Patterns', icon: '↗' },
    { id: 'overlays', label: 'Overlays', icon: '🗺' },
    { id: 'notes', label: 'Notes', icon: '📋' },
    { id: 'ai', label: 'AI Coach', icon: '🤖' },
  ]

  const animationNote = activePattern?.steps[animationStep]?.title
    ? `Step ${animationStep + 1}: ${activePattern.steps[animationStep].title}`
    : null

  return (
    <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">
      {/* ─── Header ─── */}
      <header className="flex items-center gap-2 px-3 py-2 bg-gray-900 border-b border-gray-700 flex-shrink-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚽</span>
          <div>
            <h1 className="text-white font-bold text-sm leading-none">Youth Soccer Tactics</h1>
            <p className="text-gray-500 text-xs">Coach&apos;s Board</p>
          </div>
        </div>

        <div className="flex-1" />

        {/* Save/Load */}
        <button onClick={() => setShowSavePanel(true)}
          className="px-2.5 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-semibold">
          💾 Save / Load
        </button>

        {/* Toggle side panel */}
        <button onClick={() => setSidePanelOpen((p) => !p)}
          className="px-2.5 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-semibold">
          {sidePanelOpen ? '▶ Hide Panel' : '◀ Show Panel'}
        </button>
      </header>

      {/* ─── Toolbar ─── */}
      <div className="flex-shrink-0">
        <DrawingToolbar
          activeTool={activeTool}
          drawingColor={drawingColor}
          isAnimating={isAnimating}
          animationStep={animationStep}
          totalSteps={activePattern?.steps.length ?? 1}
          onToolChange={setActiveTool}
          onColorChange={setDrawingColor}
          onClearDrawings={handleClearDrawings}
          onUndo={handleUndo}
          onResetAll={handleResetAll}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          onNextStep={handleNextStep}
          onPrevStep={handlePrevStep}
          hasPattern={activePattern !== null}
        />
      </div>

      {/* ─── Main content ─── */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Field area */}
        <div className="flex-1 bg-gray-800 flex items-center justify-center p-2 overflow-hidden min-w-0">
          <SoccerField
            players={players}
            ball={ball}
            drawings={drawings}
            overlays={overlays}
            activeTool={activeTool}
            drawingColor={drawingColor}
            showAwayTeam={showAwayTeam}
            onPlayerMove={handlePlayerMove}
            onBallMove={handleBallMove}
            onDrawingAdd={handleDrawingAdd}
            onPlayerClick={handlePlayerClick}
            onDrawingErase={handleDrawingErase}
            animationNote={animationNote}
          />
        </div>

        {/* Side panel */}
        {sidePanelOpen && (
          <aside className="w-72 flex-shrink-0 flex flex-col bg-gray-900 border-l border-gray-700 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-700 flex-shrink-0">
              {TABS.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  title={tab.label}
                  className={`flex-1 py-2 text-xs font-semibold transition-colors
                    ${activeTab === tab.id
                      ? 'bg-gray-800 text-white border-b-2 border-green-500'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                    }`}>
                  <span className="block text-sm">{tab.icon}</span>
                  <span className="hidden sm:block">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {activeTab === 'formations' && (
                <FormationPanel
                  selectedFormation={selectedFormation?.id ?? null}
                  onFormationSelect={handleFormationSelect}
                  showAwayTeam={showAwayTeam}
                  onShowAwayTeamToggle={() => setShowAwayTeam((p) => !p)}
                  homeColor={homeColor}
                  awayColor={awayColor}
                  homeCount={homeCount}
                  awayCount={awayCount}
                  onHomeColorChange={setHomeColor}
                  onAwayColorChange={setAwayColor}
                  onHomeCountChange={handleHomeCountChange}
                  onAwayCountChange={handleAwayCountChange}
                  gameFormat={gameFormat}
                  onGameFormatChange={handleGameFormatChange}
                />
              )}
              {activeTab === 'patterns' && (
                <PatternLibrary
                  activePatternId={activePattern?.id ?? null}
                  animationStep={animationStep}
                  isAnimating={isAnimating}
                  onPatternLoad={handlePatternLoad}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onStop={handleStop}
                  onNextStep={handleNextStep}
                  onPrevStep={handlePrevStep}
                />
              )}
              {activeTab === 'overlays' && (
                <OverlayControls
                  overlays={overlays}
                  onToggle={handleOverlayToggle}
                  showTarget={ball.showTarget}
                  onToggleTarget={() => setBall((prev) => ({ ...prev, showTarget: !prev.showTarget }))}
                  onResetBall={handleResetBall}
                />
              )}
              {activeTab === 'notes' && (
                <CoachNotesPanel
                  formation={selectedFormation}
                  pattern={activePattern}
                  animationStep={animationStep}
                />
              )}
              {activeTab === 'ai' && <AICoachBox />}
            </div>
          </aside>
        )}
      </div>

      {/* ─── Modals ─── */}
      {editingPlayer && (
        <PlayerEditModal
          player={editingPlayer}
          onSave={handlePlayerSave}
          onClose={() => setEditingPlayer(null)}
        />
      )}

      {showSavePanel && (
        <SavePanel
          players={players}
          ball={ball}
          drawings={drawings}
          overlays={overlays}
          onLoad={handleLoadBoard}
          onClose={() => setShowSavePanel(false)}
        />
      )}

      {/* ─── Coach tip toast ─── */}
      {showCoachTip && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
          bg-green-800 border border-green-500 text-green-100 text-sm
          px-5 py-3 rounded-xl shadow-2xl max-w-sm text-center pointer-events-none">
          💡 {coachTip}
        </div>
      )}
    </div>
  )
}
