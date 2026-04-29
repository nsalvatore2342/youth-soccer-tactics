'use client'

import React from 'react'
import { Formation, Pattern } from '@/types'

interface Props {
  formation: Formation | null
  pattern: Pattern | null
  animationStep: number
}

export default function CoachNotesPanel({ formation, pattern, animationStep }: Props) {
  if (!formation && !pattern) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full text-center">
        <div className="text-4xl mb-3">⚽</div>
        <p className="text-gray-400 text-sm">
          Select a <strong className="text-gray-300">formation</strong> or load a <strong className="text-gray-300">pattern</strong> to see coaching notes here.
        </p>
        <p className="text-gray-500 text-xs mt-2">
          All notes are written in simple language for U9–U12 players!
        </p>
      </div>
    )
  }

  return (
    <div className="p-3 flex flex-col gap-3">
      {pattern && (
        <div className="bg-green-900/40 border border-green-700/60 rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{pattern.icon}</span>
            <div>
              <p className="text-green-300 font-bold">{pattern.name}</p>
              <p className="text-green-500 text-xs">Pattern loaded</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm mb-2">{pattern.description}</p>

          {/* Current step highlight */}
          {pattern.steps[animationStep] && (
            <div className="bg-yellow-900/40 border border-yellow-700/60 rounded p-2 mb-2">
              <p className="text-yellow-300 text-xs font-bold mb-1">
                📍 Step {animationStep + 1}: {pattern.steps[animationStep].title}
              </p>
              <p className="text-yellow-100 text-sm">{pattern.steps[animationStep].description}</p>
            </div>
          )}

          <div className="bg-gray-800 rounded p-2">
            <p className="text-gray-400 text-xs font-bold mb-1">🏆 Coach Tip</p>
            <p className="text-gray-300 text-xs">{pattern.coachingNote}</p>
          </div>
        </div>
      )}

      {formation && (
        <div className="bg-blue-900/30 border border-blue-700/60 rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-bold text-blue-300">{formation.name}</span>
            <span className="text-xs bg-blue-700 text-blue-200 px-1.5 py-0.5 rounded">
              {formation.format}
            </span>
          </div>
          <p className="text-gray-300 text-sm mb-2">{formation.description}</p>

          <p className="text-xs text-gray-400 font-semibold mb-1">Good for:</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {formation.goodFor.map((g) => (
              <span key={g} className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">
                {g}
              </span>
            ))}
          </div>

          <div className="bg-yellow-900/40 border border-yellow-700/50 rounded p-2">
            <p className="text-yellow-300 text-xs font-bold mb-1">🏆 Coach Notes (U9–U12)</p>
            <p className="text-yellow-100 text-sm">{formation.coachNotes}</p>
          </div>

          <p className="text-gray-500 text-xs mt-2 italic">💡 {formation.tooltip}</p>
        </div>
      )}

      {/* General tips when nothing is active */}
      <div className="bg-gray-800/60 rounded p-3">
        <p className="text-gray-400 text-xs font-bold mb-2">⚽ Quick Coaching Reminders</p>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>🔴 Never clear across your own goal mouth</li>
          <li>🟢 When in trouble — clear it WIDE</li>
          <li>📢 Always communicate — talk to your teammates</li>
          <li>👀 Head up — always look before you receive the ball</li>
          <li>🏃 Support the player with the ball — always have options</li>
          <li>🛡 Stay in your shape — resist chasing the ball</li>
        </ul>
      </div>
    </div>
  )
}
