import { Formation, GameFormat } from '@/types'

// Field: 68m wide × 105m tall (SVG units)
// Home team defends at the bottom (y ≈ 88–105), attacks upward (toward y=0)
// Away team defends at the top (y ≈ 0–17), attacks downward (toward y=105)

export const FORMATIONS: Formation[] = [
  // ─── 7v7 ───────────────────────────────────────────────
  {
    id: '7v7-3-2-1',
    name: '3-2-1',
    format: '7v7',
    positions: [
      { x: 34, y: 99 },      // 1 GK
      { x: 14, y: 82 }, { x: 34, y: 85 }, { x: 54, y: 82 }, // 2 3 4 Defenders
      { x: 22, y: 65 }, { x: 46, y: 65 },                    // 5 6 Midfielders
      { x: 34, y: 42 },                                       // 7 Striker
    ],
    description: 'Solid defensive shape with width at the back and one target striker.',
    goodFor: ['Defense', 'Beginner teams', 'Keeping possession', 'Learning positions'],
    coachNotes: 'Stay in your triangle shape! If the ball goes right, the right defender steps up and the striker drops a little. ALWAYS look for the wide pass first — do NOT clear straight up the middle!',
    tooltip: 'Perfect for beginners — clear zones, easy to understand.',
  },
  {
    id: '7v7-2-3-1',
    name: '2-3-1',
    format: '7v7',
    positions: [
      { x: 34, y: 99 },
      { x: 22, y: 84 }, { x: 46, y: 84 },
      { x: 14, y: 65 }, { x: 34, y: 68 }, { x: 54, y: 65 },
      { x: 34, y: 42 },
    ],
    description: 'Midfield-heavy shape with width in the middle third — great for controlling the game.',
    goodFor: ['Possession', 'Counter-attack', 'Pressing', 'Technical teams'],
    coachNotes: 'The three midfielders make a triangle — always have someone to pass to! Spread wide to make the field BIG. When we win the ball, look for the striker with a quick pass.',
    tooltip: 'Midfield control — great for teams that like to pass.',
  },
  {
    id: '7v7-2-2-2',
    name: '2-2-2',
    format: '7v7',
    positions: [
      { x: 34, y: 99 },
      { x: 22, y: 84 }, { x: 46, y: 84 },
      { x: 22, y: 65 }, { x: 46, y: 65 },
      { x: 22, y: 42 }, { x: 46, y: 42 },
    ],
    description: 'Balanced pairs across all zones — every player has a partner.',
    goodFor: ['Attacking', 'Counter-attack', 'Balanced teams', 'High energy'],
    coachNotes: 'Always stay with your pair! Left pair works the left side together, right pair works the right side. When one goes forward, the other is ready to defend. TALK to your partner!',
    tooltip: 'Balanced and fun — great for teams that love to attack.',
  },

  // ─── 9v9 ───────────────────────────────────────────────
  {
    id: '9v9-3-3-2',
    name: '3-3-2',
    format: '9v9',
    positions: [
      { x: 34, y: 99 },
      { x: 14, y: 82 }, { x: 34, y: 85 }, { x: 54, y: 82 },
      { x: 14, y: 63 }, { x: 34, y: 66 }, { x: 54, y: 63 },
      { x: 24, y: 38 }, { x: 44, y: 38 },
    ],
    description: 'Strong defensive block with double-striker threat up top.',
    goodFor: ['Defense', 'Counter-attack', 'Physical teams', 'Winning by 1 goal'],
    coachNotes: 'The back three protect the goal — STAY BACK! Middle three win the ball and quickly pass to the two strikers. Two strikers stay up and look for the long ball or quick counter. DON\'T all chase the ball!',
    tooltip: 'Defensive strength with counter-attack threat.',
  },
  {
    id: '9v9-2-4-2',
    name: '2-4-2',
    format: '9v9',
    positions: [
      { x: 34, y: 99 },
      { x: 22, y: 84 }, { x: 46, y: 84 },
      { x: 10, y: 63 }, { x: 26, y: 66 }, { x: 42, y: 66 }, { x: 58, y: 63 },
      { x: 22, y: 38 }, { x: 46, y: 38 },
    ],
    description: 'Wide midfield with four in the middle — dominate possession.',
    goodFor: ['Possession', 'Attacking', 'Technical teams', 'Short passing'],
    coachNotes: 'The four midfielders control the game! Wing midfielders spread WIDE to get the ball. The two defenders must stay back — no joining the attack unless you\'re 100% sure! Two strikers stay high and stretch the defense.',
    tooltip: 'Midfield dominance — for technical possession teams.',
  },
  {
    id: '9v9-3-2-3',
    name: '3-2-3',
    format: '9v9',
    positions: [
      { x: 34, y: 99 },
      { x: 14, y: 82 }, { x: 34, y: 85 }, { x: 54, y: 82 },
      { x: 24, y: 65 }, { x: 44, y: 65 },
      { x: 12, y: 38 }, { x: 34, y: 35 }, { x: 56, y: 38 },
    ],
    description: 'Attacking shape with three wide forwards and strong pressing.',
    goodFor: ['Attacking', 'Pressing', 'Skilled forwards', 'Dominant teams'],
    coachNotes: 'Three forwards spread wide and press the opponent\'s defenders! Two midfielders must work VERY hard — sprint back when we lose the ball. Defenders stay back and spread wide. This formation requires a LOT of running!',
    tooltip: 'Attacking shape with width — great for pressing high.',
  },

  // ─── 11v11 ─────────────────────────────────────────────
  {
    id: '11v11-4-3-3',
    name: '4-3-3',
    format: '11v11',
    positions: [
      { x: 34, y: 101 },
      { x: 10, y: 84 }, { x: 26, y: 87 }, { x: 42, y: 87 }, { x: 58, y: 84 },
      { x: 16, y: 66 }, { x: 34, y: 70 }, { x: 52, y: 66 },
      { x: 10, y: 40 }, { x: 34, y: 37 }, { x: 58, y: 40 },
    ],
    description: 'Modern pressing formation — three forwards press high, three midfielders control.',
    goodFor: ['Pressing', 'Attacking', 'Possession', 'Counter-attack', 'Physical fitness'],
    coachNotes: 'Wingers stay WIDE to stretch the defense. The 9 (center forward) leads the press. Three midfielders form a triangle — there\'s ALWAYS a passing option. Full-backs can overlap wide when we have the ball, but get back FAST when we lose it!',
    tooltip: 'The modern standard — great for pressing and quick attacks.',
  },
  {
    id: '11v11-4-4-2',
    name: '4-4-2',
    format: '11v11',
    positions: [
      { x: 34, y: 101 },
      { x: 10, y: 84 }, { x: 26, y: 87 }, { x: 42, y: 87 }, { x: 58, y: 84 },
      { x: 10, y: 66 }, { x: 26, y: 69 }, { x: 42, y: 69 }, { x: 58, y: 66 },
      { x: 24, y: 40 }, { x: 44, y: 40 },
    ],
    description: 'The classic formation — two solid lines of four that are easy to understand.',
    goodFor: ['Defense', 'Counter-attack', 'Beginner teams', 'Physical teams', 'Easy to learn'],
    coachNotes: 'Stay compact in your 4-4 block! Without the ball, form TWO lines of four — keep the space between the lines small. The two strikers press TOGETHER — never split up when pressing! Wide midfielders track back to help defend.',
    tooltip: 'The classic — easy to learn, very hard to beat.',
  },
  {
    id: '11v11-3-5-2',
    name: '3-5-2',
    format: '11v11',
    positions: [
      { x: 34, y: 101 },
      { x: 16, y: 84 }, { x: 34, y: 87 }, { x: 52, y: 84 },
      { x: 6, y: 66 }, { x: 20, y: 69 }, { x: 34, y: 72 }, { x: 48, y: 69 }, { x: 62, y: 66 },
      { x: 24, y: 40 }, { x: 44, y: 40 },
    ],
    description: 'Midfield dominance with wing-backs giving width — five in the middle!',
    goodFor: ['Possession', 'Attacking midfield', 'Dominant teams', 'Technical players'],
    coachNotes: 'Wing-backs (5 and 11) must run up AND back all game — they give us our width! The three center-backs hold the line. Wing-backs attack when we have the ball but SPRINT BACK immediately when we lose it. This needs very fit players!',
    tooltip: 'Dominant midfield — needs fit, technical wing-backs.',
  },
]

export const getFormationsByFormat = (format: GameFormat) =>
  FORMATIONS.filter((f) => f.format === format)
