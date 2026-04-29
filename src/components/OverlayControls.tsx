'use client'

import React from 'react'
import { OverlayState } from '@/types'

interface Props {
  overlays: OverlayState
  onToggle: (key: keyof OverlayState) => void
  showTarget: boolean
  onToggleTarget: () => void
  onResetBall: () => void
}

const OVERLAYS: { key: keyof OverlayState; label: string; icon: string; desc: string; color: string }[] = [
  { key: 'dangerZone', label: 'Danger Zone', icon: '⚠', desc: 'Red zone near your goal — avoid turning the ball over here!', color: 'text-red-400' },
  { key: 'clearingZones', label: 'Clear Wide Zones', icon: '↗', desc: 'Green channels on the sides — safest areas to clear the ball', color: 'text-green-400' },
  { key: 'buildOutZone', label: 'Build-Out Lines', icon: '📏', desc: 'Dashed blue lines across the field — opponents must retreat behind their line when GK has the ball (U9–U12 rule)', color: 'text-blue-400' },
  { key: 'attackingZone', label: 'Attacking Zone', icon: '⭐', desc: 'Yellow top third — get the ball here to score!', color: 'text-yellow-400' },
  { key: 'noClearMiddle', label: 'No Clear Middle', icon: '🚫', desc: 'Never clear across your own goal mouth — ever!', color: 'text-red-300' },
  { key: 'passingLanes', label: 'Passing Lanes', icon: '↕', desc: 'Vertical channels for passing through the thirds', color: 'text-purple-400' },
  { key: 'widthGuide', label: 'Width Guide', icon: '↔', desc: 'Lines showing ideal width positioning', color: 'text-gray-300' },
  { key: 'thirds', label: 'Field Thirds', icon: '⅓', desc: 'Divides the field into attacking, middle, and defensive thirds', color: 'text-gray-400' },
]

function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0
        ${on ? 'bg-green-500' : 'bg-gray-600'}`}>
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all
        ${on ? 'left-5' : 'left-0.5'}`} />
    </button>
  )
}

export default function OverlayControls({ overlays, onToggle, showTarget, onToggleTarget, onResetBall }: Props) {
  return (
    <div className="flex flex-col gap-3 p-3">
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">
          Teaching Overlays
        </label>
        <p className="text-gray-500 text-xs mb-3">
          Toggle visual guides to teach key concepts. Turn on multiple overlays at once!
        </p>
        <div className="flex flex-col gap-2">
          {OVERLAYS.map(({ key, label, icon, desc, color }) => (
            <div key={key} className="flex items-start gap-2 bg-gray-800 rounded p-2 hover:bg-gray-750 transition-colors">
              <span className={`text-lg flex-shrink-0 ${color}`}>{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-semibold ${overlays[key] ? color : 'text-gray-300'}`}>
                    {label}
                  </span>
                  <ToggleSwitch on={overlays[key]} onToggle={() => onToggle(key)} />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ball options */}
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">
          Ball Options
        </label>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between bg-gray-800 rounded p-2">
            <div>
              <p className="text-sm text-gray-300 font-semibold">🎯 Show Target Area</p>
              <p className="text-xs text-gray-500">Orange zone in front of away goal</p>
            </div>
            <ToggleSwitch on={showTarget} onToggle={onToggleTarget} />
          </div>
          <button onClick={onResetBall}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded font-semibold">
            ⚽ Reset Ball to Center
          </button>
        </div>
      </div>

      {/* Quick teach buttons */}
      <div>
        <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">
          Quick Teach
        </label>
        <p className="text-xs text-gray-500 mb-2">Turn on preset overlay combinations</p>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => {
              if (!overlays.dangerZone) onToggle('dangerZone')
              if (!overlays.noClearMiddle) onToggle('noClearMiddle')
              if (!overlays.clearingZones) onToggle('clearingZones')
            }}
            className="py-2 px-2 bg-red-900/60 hover:bg-red-900 text-red-200 text-xs rounded font-semibold text-center">
            🛡 Defending Zones
          </button>
          <button
            onClick={() => {
              if (!overlays.buildOutZone) onToggle('buildOutZone')
              if (!overlays.passingLanes) onToggle('passingLanes')
              if (!overlays.widthGuide) onToggle('widthGuide')
            }}
            className="py-2 px-2 bg-blue-900/60 hover:bg-blue-900 text-blue-200 text-xs rounded font-semibold text-center">
            🏗 Build-Out Setup
          </button>
          <button
            onClick={() => {
              if (!overlays.attackingZone) onToggle('attackingZone')
              if (!overlays.widthGuide) onToggle('widthGuide')
            }}
            className="py-2 px-2 bg-yellow-900/60 hover:bg-yellow-900 text-yellow-200 text-xs rounded font-semibold text-center">
            ⭐ Attack Setup
          </button>
          <button
            onClick={() => {
              (Object.keys(overlays) as (keyof OverlayState)[]).forEach((k) => {
                if (overlays[k]) onToggle(k)
              })
            }}
            className="py-2 px-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded font-semibold text-center">
            ✕ Clear All
          </button>
        </div>
      </div>
    </div>
  )
}
