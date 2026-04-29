'use client'

import React, { useState } from 'react'
import { Formation, GameFormat } from '@/types'
import { FORMATIONS } from '@/data/formations'

interface Props {
  selectedFormation: string | null
  onFormationSelect: (f: Formation) => void
  showAwayTeam: boolean
  onShowAwayTeamToggle: () => void
  homeColor: string
  awayColor: string
  homeCount: number
  awayCount: number
  onHomeColorChange: (c: string) => void
  onAwayColorChange: (c: string) => void
  onHomeCountChange: (n: number) => void
  onAwayCountChange: (n: number) => void
  gameFormat: GameFormat
  onGameFormatChange: (f: GameFormat) => void
}

const FORMAT_LABELS: Record<GameFormat, string> = {
  '7v7': '7v7',
  '9v9': '9v9',
  '11v11': '11v11',
}

const FORMAT_COUNTS: Record<GameFormat, number> = {
  '7v7': 7,
  '9v9': 9,
  '11v11': 11,
}

const BADGE_COLORS: Record<string, string> = {
  Defense: 'bg-blue-800 text-blue-200',
  Attacking: 'bg-red-800 text-red-200',
  Attack: 'bg-red-800 text-red-200',
  Possession: 'bg-green-800 text-green-200',
  Pressing: 'bg-orange-800 text-orange-200',
  'Counter-attack': 'bg-yellow-800 text-yellow-200',
  'Beginner teams': 'bg-purple-800 text-purple-200',
  default: 'bg-gray-700 text-gray-300',
}

function BadgeColor(label: string) {
  return BADGE_COLORS[label] ?? BADGE_COLORS.default
}

export default function FormationPanel({
  selectedFormation, onFormationSelect, showAwayTeam, onShowAwayTeamToggle,
  homeColor, awayColor, homeCount, awayCount,
  onHomeColorChange, onAwayColorChange, onHomeCountChange, onAwayCountChange,
  gameFormat, onGameFormatChange,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const formations = FORMATIONS.filter((f) => f.format === gameFormat)
  const maxCount = FORMAT_COUNTS[gameFormat]

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Format selector */}
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Game Format</label>
        <div className="flex gap-1">
          {(['7v7', '9v9', '11v11'] as GameFormat[]).map((f) => (
            <button key={f} onClick={() => onGameFormatChange(f)}
              className={`flex-1 py-2 rounded text-sm font-bold transition-all
                ${gameFormat === f
                  ? 'bg-green-600 text-white shadow shadow-green-600/30'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              {FORMAT_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Team controls */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-800 rounded p-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Home Team</span>
            <input type="color" value={homeColor}
              onChange={(e) => onHomeColorChange(e.target.value)}
              className="w-7 h-7 rounded cursor-pointer border-0"
              title="Home team color" />
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onHomeCountChange(Math.max(1, homeCount - 1))}
              className="w-6 h-6 rounded bg-gray-600 text-white text-sm hover:bg-gray-500">-</button>
            <span className="flex-1 text-center text-white text-sm font-bold">{homeCount}</span>
            <button onClick={() => onHomeCountChange(Math.min(maxCount, homeCount + 1))}
              className="w-6 h-6 rounded bg-gray-600 text-white text-sm hover:bg-gray-500">+</button>
          </div>
        </div>
        <div className={`bg-gray-800 rounded p-2 transition-opacity ${showAwayTeam ? 'opacity-100' : 'opacity-50'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Away Team</span>
            <div className="flex items-center gap-1">
              <input type="color" value={awayColor}
                onChange={(e) => onAwayColorChange(e.target.value)}
                className="w-7 h-7 rounded cursor-pointer border-0"
                title="Away team color" disabled={!showAwayTeam} />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onAwayCountChange(Math.max(1, awayCount - 1))}
              disabled={!showAwayTeam}
              className="w-6 h-6 rounded bg-gray-600 text-white text-sm hover:bg-gray-500 disabled:opacity-40">-</button>
            <span className="flex-1 text-center text-white text-sm font-bold">{awayCount}</span>
            <button onClick={() => onAwayCountChange(Math.min(maxCount, awayCount + 1))}
              disabled={!showAwayTeam}
              className="w-6 h-6 rounded bg-gray-600 text-white text-sm hover:bg-gray-500 disabled:opacity-40">+</button>
          </div>
        </div>
      </div>

      {/* Show away team toggle */}
      <button onClick={onShowAwayTeamToggle}
        className={`w-full py-2 rounded text-sm font-bold transition-all
          ${showAwayTeam ? 'bg-red-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
        {showAwayTeam ? '🔴 Hide Away Team' : '⚽ Show Both Teams'}
      </button>

      {/* Formations */}
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wider mb-1.5 block">
          Formations — {gameFormat}
        </label>
        <div className="flex flex-col gap-2">
          {formations.map((f) => {
            const isSelected = selectedFormation === f.id
            const isExpanded = expandedId === f.id
            return (
              <div key={f.id}
                className={`rounded border transition-all
                  ${isSelected ? 'border-yellow-400 bg-gray-750' : 'border-gray-700 bg-gray-800'}`}>
                <div className="flex items-center gap-2 p-2">
                  <button
                    onClick={() => onFormationSelect(f)}
                    className={`flex-1 text-left font-bold text-lg leading-none
                      ${isSelected ? 'text-yellow-400' : 'text-white'}`}>
                    {f.name}
                  </button>
                  {isSelected && (
                    <span className="text-xs bg-yellow-400 text-gray-900 px-1.5 py-0.5 rounded font-bold">
                      ACTIVE
                    </span>
                  )}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : f.id)}
                    className="text-gray-400 hover:text-white text-xs px-1">
                    {isExpanded ? '▲' : '▼'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-2 pb-2 border-t border-gray-700 pt-2 space-y-2">
                    <p className="text-gray-300 text-xs">{f.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {f.goodFor.map((g) => (
                        <span key={g} className={`text-xs px-1.5 py-0.5 rounded ${BadgeColor(g)}`}>
                          {g}
                        </span>
                      ))}
                    </div>
                    <div className="bg-yellow-900/40 border border-yellow-700/50 rounded p-2">
                      <p className="text-yellow-300 text-xs font-bold mb-0.5">🏆 Coach Tips (U9–U12)</p>
                      <p className="text-yellow-100 text-xs">{f.coachNotes}</p>
                    </div>
                    <button
                      onClick={() => onFormationSelect(f)}
                      className="w-full py-1.5 bg-green-700 hover:bg-green-600 text-white text-sm rounded font-bold">
                      Apply Formation
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
