export interface Point {
  x: number
  y: number
}

export interface Player {
  id: string
  team: 'home' | 'away'
  number: number
  name: string
  x: number  // 0-68 (SVG field width in meters)
  y: number  // 0-105 (SVG field height in meters)
  color: string
  textColor: string
}

export type DrawingType = 'arrow' | 'line' | 'dashed' | 'cone' | 'zone'
export type Tool = 'select' | 'arrow' | 'line' | 'dashed' | 'cone' | 'zone' | 'eraser'
export type GameFormat = '7v7' | '9v9' | '11v11'

export interface Drawing {
  id: string
  type: DrawingType
  points: Point[]
  color: string
  completed: boolean
}

export interface BallState {
  x: number
  y: number
  attachedTo: string | null
  showTarget: boolean
}

export interface OverlayState {
  dangerZone: boolean
  clearingZones: boolean
  buildOutZone: boolean
  attackingZone: boolean
  noClearMiddle: boolean
  passingLanes: boolean
  widthGuide: boolean
}

export interface Formation {
  id: string
  name: string
  format: GameFormat
  positions: Point[]
  description: string
  goodFor: string[]
  coachNotes: string
  tooltip: string
}

export interface PatternStep {
  title: string
  description: string
  highlightIds?: string[]
}

export interface PatternDrawing {
  type: DrawingType
  points: Point[]
  color: string
}

export interface Pattern {
  id: string
  name: string
  icon: string
  description: string
  coachingNote: string
  players: Array<{
    number: number
    x: number
    y: number
    team?: 'home' | 'away'
  }>
  ball: Point
  drawings: PatternDrawing[]
  steps: PatternStep[]
}

export interface TeamSettings {
  color: string
  textColor: string
  count: number
  name: string
}

export interface SavedBoard {
  id: string
  name: string
  createdAt: string
  players: Player[]
  ball: BallState
  drawings: Drawing[]
  overlays: OverlayState
}
