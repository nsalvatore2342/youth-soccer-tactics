'use client'

import React, { useState } from 'react'
import { Pattern } from '@/types'
import { PATTERNS } from '@/data/patterns'

interface Props {
  activePatternId: string | null
  animationStep: number
  isAnimating: boolean
  onPatternLoad: (p: Pattern) => void
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onNextStep: () => void
  onPrevStep: () => void
}

export default function PatternLibrary({
  activePatternId, animationStep, isAnimating,
  onPatternLoad, onPlay, onPause, onStop, onNextStep, onPrevStep,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const activePattern = PATTERNS.find((p) => p.id === activePatternId) ?? null

  return (
    <div className="flex flex-col gap-3 p-3">
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">
          Teaching Patterns
        </label>
        <p className="text-gray-500 text-xs mb-3">
          Click a pattern to place players + arrows. Then use Play to walk through steps.
        </p>
      </div>

      {/* Active pattern controls */}
      {activePattern && (
        <div className="bg-green-900/40 border border-green-700 rounded p-3 mb-1">
          <p className="text-green-300 font-bold text-sm mb-1">
            {activePattern.icon} {activePattern.name}
          </p>
          <p className="text-green-200 text-xs mb-2">{activePattern.coachingNote}</p>

          {/* Step display */}
          {activePattern.steps.length > 0 && (
            <div className="bg-gray-900/60 rounded p-2 mb-2">
              <p className="text-yellow-300 text-xs font-bold mb-0.5">
                Step {animationStep + 1} / {activePattern.steps.length}: {activePattern.steps[animationStep]?.title}
              </p>
              <p className="text-gray-300 text-xs">{activePattern.steps[animationStep]?.description}</p>
            </div>
          )}

          {/* Playback controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={onPrevStep} disabled={animationStep === 0}
              className="px-2 py-1.5 rounded bg-gray-700 text-white text-xs hover:bg-gray-600 disabled:opacity-40">
              ◀ Prev
            </button>
            {isAnimating ? (
              <button onClick={onPause}
                className="px-3 py-1.5 rounded bg-yellow-500 text-gray-900 text-xs font-bold hover:bg-yellow-400">
                ⏸ Pause
              </button>
            ) : (
              <button onClick={onPlay}
                className="px-3 py-1.5 rounded bg-green-600 text-white text-xs font-bold hover:bg-green-500">
                ▶ Play All
              </button>
            )}
            <button onClick={onNextStep} disabled={animationStep >= activePattern.steps.length - 1}
              className="px-2 py-1.5 rounded bg-gray-700 text-white text-xs hover:bg-gray-600 disabled:opacity-40">
              Next ▶
            </button>
            <button onClick={onStop}
              className="px-2 py-1.5 rounded bg-gray-700 text-gray-300 text-xs hover:bg-gray-600">
              ⏹ Stop
            </button>
          </div>

          {/* Step dots */}
          {activePattern.steps.length > 1 && (
            <div className="flex gap-1 mt-2">
              {activePattern.steps.map((_, i) => (
                <div key={i}
                  className={`w-2 h-2 rounded-full transition-colors
                    ${i === animationStep ? 'bg-yellow-400' : i < animationStep ? 'bg-green-500' : 'bg-gray-600'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pattern list */}
      <div className="flex flex-col gap-2">
        {PATTERNS.map((pattern) => {
          const isActive = activePatternId === pattern.id
          const isExpanded = expandedId === pattern.id
          return (
            <div key={pattern.id}
              className={`rounded border transition-all
                ${isActive ? 'border-green-500 bg-gray-750' : 'border-gray-700 bg-gray-800'}`}>
              <div className="flex items-center gap-2 p-2">
                <span className="text-xl w-7 text-center flex-shrink-0">{pattern.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${isActive ? 'text-green-400' : 'text-white'}`}>
                    {pattern.name}
                  </p>
                  {!isExpanded && (
                    <p className="text-xs text-gray-500 truncate">{pattern.description}</p>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {isActive && (
                    <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded font-bold">ON</span>
                  )}
                  <button onClick={() => setExpandedId(isExpanded ? null : pattern.id)}
                    className="text-gray-400 hover:text-white text-xs px-1">
                    {isExpanded ? '▲' : '▼'}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="px-3 pb-3 border-t border-gray-700 pt-2 space-y-2">
                  <p className="text-gray-300 text-xs">{pattern.description}</p>
                  <div className="bg-yellow-900/30 border border-yellow-700/40 rounded p-2">
                    <p className="text-yellow-300 text-xs font-bold mb-0.5">🏆 Coach Note</p>
                    <p className="text-yellow-100 text-xs">{pattern.coachingNote}</p>
                  </div>

                  {/* Steps preview */}
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 font-semibold">Steps ({pattern.steps.length}):</p>
                    {pattern.steps.map((step, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="text-xs bg-gray-700 text-gray-300 rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-xs text-gray-400"><strong className="text-gray-300">{step.title}:</strong> {step.description}</p>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => { onPatternLoad(pattern); setExpandedId(null) }}
                    className="w-full py-2 bg-green-700 hover:bg-green-600 text-white text-sm rounded font-bold">
                    {isActive ? '↺ Reload Pattern' : 'Load Pattern'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
