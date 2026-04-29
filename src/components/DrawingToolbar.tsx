'use client'

import React from 'react'
import { Tool, OverlayState } from '@/types'

interface Props {
  activeTool: Tool
  drawingColor: string
  isAnimating: boolean
  animationStep: number
  totalSteps: number
  onToolChange: (t: Tool) => void
  onColorChange: (c: string) => void
  onClearDrawings: () => void
  onUndo: () => void
  onResetAll: () => void
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onNextStep: () => void
  onPrevStep: () => void
  hasPattern: boolean
  overlays: OverlayState
  onOverlayToggle: (key: keyof OverlayState) => void
}

const TOOLS: { id: Tool; icon: string; label: string }[] = [
  { id: 'select', icon: '✋', label: 'Move Players & Ball' },
  { id: 'arrow', icon: '↗', label: 'Draw Arrow (Run)' },
  { id: 'line', icon: '—', label: 'Draw Line (Pass)' },
  { id: 'dashed', icon: '- -', label: 'Dashed Line (Option)' },
  { id: 'cone', icon: '▲', label: 'Place Cone' },
  { id: 'zone', icon: '▭', label: 'Draw Zone' },
  { id: 'eraser', icon: '✕', label: 'Erase Drawing' },
]

const COLORS = [
  '#FFFFFF', '#FFFF00', '#22c55e', '#3b82f6', '#ef4444',
  '#f97316', '#a855f7', '#ec4899',
]

export default function DrawingToolbar({
  activeTool, drawingColor, isAnimating, animationStep, totalSteps,
  onToolChange, onColorChange, onClearDrawings, onUndo, onResetAll,
  onPlay, onPause, onStop, onNextStep, onPrevStep, hasPattern,
  overlays, onOverlayToggle,
}: Props) {
  const defendActive = overlays.dangerZone || overlays.noClearMiddle || overlays.clearingZones
  const buildOutActive = overlays.buildOutZone || overlays.passingLanes || overlays.widthGuide
  const attackActive = overlays.attackingZone || overlays.widthGuide
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 bg-gray-900 border-b border-gray-700">
      {/* Tool buttons */}
      {TOOLS.map((t) => {
        const isSelect = t.id === 'select'
        const isActive = activeTool === t.id
        return (
          <button
            key={t.id}
            title={t.label}
            onClick={() => onToolChange(t.id)}
            className={`rounded font-bold transition-all select-none flex items-center gap-1
              ${isSelect ? 'px-3 py-2 text-base' : 'px-2.5 py-2 text-sm'}
              ${isActive
                ? isSelect
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/40 ring-2 ring-green-300'
                  : 'bg-yellow-400 text-gray-900 shadow-lg shadow-yellow-400/30'
                : isSelect
                  ? 'bg-green-800 text-green-200 hover:bg-green-700 border border-green-600'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
          >
            <span>{t.icon}</span>
            {isSelect && <span className="text-xs font-semibold">Move</span>}
          </button>
        )
      })}

      <div className="w-px h-6 bg-gray-600 mx-0.5" />

      {/* Color picker */}
      <div className="flex items-center gap-1">
        {COLORS.map((c) => (
          <button
            key={c}
            title={c}
            onClick={() => onColorChange(c)}
            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110
              ${drawingColor === c ? 'border-white scale-125' : 'border-gray-500'}`}
            style={{ backgroundColor: c }}
          />
        ))}
        <input
          type="color"
          value={drawingColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
          title="Custom color"
        />
      </div>

      {/* Preset overlay buttons — hidden on mobile (use ☰ panel instead) */}
      <div className="hidden md:flex items-center gap-1.5">
        <div className="w-px h-6 bg-gray-600 mx-0.5" />
        <button
          onClick={() => {
            if (defendActive) {
              if (overlays.dangerZone) onOverlayToggle('dangerZone')
              if (overlays.noClearMiddle) onOverlayToggle('noClearMiddle')
              if (overlays.clearingZones) onOverlayToggle('clearingZones')
            } else {
              if (!overlays.dangerZone) onOverlayToggle('dangerZone')
              if (!overlays.noClearMiddle) onOverlayToggle('noClearMiddle')
              if (!overlays.clearingZones) onOverlayToggle('clearingZones')
            }
          }}
          className={`px-2.5 py-1.5 rounded text-xs font-bold transition-all
            ${defendActive ? 'bg-red-700 text-white ring-2 ring-red-400' : 'bg-red-900/60 text-red-200 hover:bg-red-900'}`}>
          🛡 Defend
        </button>
        <button
          onClick={() => {
            if (buildOutActive) {
              if (overlays.buildOutZone) onOverlayToggle('buildOutZone')
              if (overlays.passingLanes) onOverlayToggle('passingLanes')
              if (overlays.widthGuide) onOverlayToggle('widthGuide')
            } else {
              if (!overlays.buildOutZone) onOverlayToggle('buildOutZone')
              if (!overlays.passingLanes) onOverlayToggle('passingLanes')
              if (!overlays.widthGuide) onOverlayToggle('widthGuide')
            }
          }}
          className={`px-2.5 py-1.5 rounded text-xs font-bold transition-all
            ${buildOutActive ? 'bg-blue-700 text-white ring-2 ring-blue-400' : 'bg-blue-900/60 text-blue-200 hover:bg-blue-900'}`}>
          📏 Build-Out
        </button>
        <button
          onClick={() => {
            if (attackActive) {
              if (overlays.attackingZone) onOverlayToggle('attackingZone')
              if (overlays.widthGuide) onOverlayToggle('widthGuide')
            } else {
              if (!overlays.attackingZone) onOverlayToggle('attackingZone')
              if (!overlays.widthGuide) onOverlayToggle('widthGuide')
            }
          }}
          className={`px-2.5 py-1.5 rounded text-xs font-bold transition-all
            ${attackActive ? 'bg-yellow-600 text-white ring-2 ring-yellow-400' : 'bg-yellow-900/60 text-yellow-200 hover:bg-yellow-900'}`}>
          ⭐ Attack
        </button>
        <button
          onClick={() => onOverlayToggle('thirds')}
          className={`px-2.5 py-1.5 rounded text-xs font-bold transition-all
            ${overlays.thirds ? 'bg-gray-500 text-white ring-2 ring-gray-300' : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600'}`}>
          ⅓ Thirds
        </button>
      </div>

      <div className="w-px h-6 bg-gray-600 mx-0.5" />

      {/* Edit actions */}
      <button onClick={onUndo} title="Undo last drawing"
        className="px-2.5 py-1.5 rounded text-sm bg-gray-700 text-white hover:bg-gray-600">
        ↩ Undo
      </button>
      <button onClick={onClearDrawings} title="Clear all drawings"
        className="px-2.5 py-1.5 rounded text-sm bg-gray-700 text-yellow-300 hover:bg-gray-600">
        🗑 Drawings
      </button>
      <button onClick={onResetAll} title="Reset everything"
        className="px-2.5 py-1.5 rounded text-sm bg-red-900 text-red-200 hover:bg-red-800">
        ↺ Reset All
      </button>

      {/* Animation controls (only when a pattern is loaded) */}
      {hasPattern && (
        <>
          <div className="w-px h-6 bg-gray-600 mx-0.5" />
          <span className="text-gray-400 text-xs">Step {animationStep + 1}/{totalSteps}</span>
          <button onClick={onPrevStep} disabled={animationStep === 0}
            className="px-2 py-1.5 rounded text-sm bg-blue-900 text-blue-200 hover:bg-blue-800 disabled:opacity-40">
            ◀
          </button>
          {isAnimating ? (
            <button onClick={onPause}
              className="px-2.5 py-1.5 rounded text-sm bg-yellow-500 text-gray-900 font-bold hover:bg-yellow-400">
              ⏸ Pause
            </button>
          ) : (
            <button onClick={onPlay}
              className="px-2.5 py-1.5 rounded text-sm bg-green-600 text-white font-bold hover:bg-green-500">
              ▶ Play
            </button>
          )}
          <button onClick={onNextStep} disabled={animationStep >= totalSteps - 1}
            className="px-2 py-1.5 rounded text-sm bg-blue-900 text-blue-200 hover:bg-blue-800 disabled:opacity-40">
            ▶
          </button>
          <button onClick={onStop}
            className="px-2.5 py-1.5 rounded text-sm bg-gray-700 text-white hover:bg-gray-600">
            ⏹ Stop
          </button>
        </>
      )}
    </div>
  )
}
