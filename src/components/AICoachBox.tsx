'use client'

import React, { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'coach'
  text: string
  ts: number
}

const MOCK_RESPONSES: Record<string, string> = {
  default: "Great question! As an AI coach, I\'d suggest focusing on width and spacing first. Make sure your players aren\'t bunching up — spread to the sidelines to make the field big!",
  '3-2-1': "The 3-2-1 is perfect for beginners! Your three defenders form a solid base, the two midfielders link play, and your striker stays high. Tell your defenders: stay in a wide triangle! The GK is always an option for a back pass.",
  'build': "Building out of the back requires patience and bravery. Your GK should look to play to the open wide defender first. Defenders should spread to the edges of the penalty area to give clear angles. Then look for the central midfielder who drops to receive.",
  'press': "High pressing works best when ALL three forwards press AT THE SAME TIME. Use a signal — the striker's press triggers the wingers. The key is cutting off passing lanes, not just chasing the ball. Your midfielders must step up too!",
  'clear': "The golden rule: NEVER clear across your own goal! When under pressure, the wide channels are your friends. Aim for the sideline — give up a throw-in rather than risk giving the ball to an attacker in front of goal.",
  'pass': "For passing patterns, think triangles! Every player should always see TWO passing options. The player with the ball needs teammates in front, beside, and behind them. Call for the ball and show your hands!",
  'counterattack': "Counter-attacks need SPEED. The moment you win the ball, two things happen simultaneously: the ball-winner looks up immediately, and your forwards sprint into space. Don't hold the ball — play forward FAST before the opponent recovers.",
  'defend': "Defending as a unit: imagine the team connected by invisible elastic bands. When the ball moves left, EVERYONE shifts left together. Keep the space between your lines small — no gaps for the opponent to play through. Show the ball to the outside!",
  'formation': "Formation choice depends on your players' strengths. 4-3-3 for technical teams who press. 4-4-2 for physical teams who counter-attack. 3-5-2 for teams with great midfielders. 3-2-1 is perfect for beginners learning positions!",
}

function getMockResponse(input: string): string {
  const lower = input.toLowerCase()
  if (lower.includes('3-2-1') || lower.includes('321')) return MOCK_RESPONSES['3-2-1']
  if (lower.includes('build') || lower.includes('back')) return MOCK_RESPONSES['build']
  if (lower.includes('press') || lower.includes('pressing')) return MOCK_RESPONSES['press']
  if (lower.includes('clear') || lower.includes('clear')) return MOCK_RESPONSES['clear']
  if (lower.includes('pass') || lower.includes('passing')) return MOCK_RESPONSES['pass']
  if (lower.includes('counter') || lower.includes('attack fast')) return MOCK_RESPONSES['counterattack']
  if (lower.includes('defend') || lower.includes('defense') || lower.includes('shape')) return MOCK_RESPONSES['defend']
  if (lower.includes('formation') || lower.includes('which')) return MOCK_RESPONSES['formation']
  return MOCK_RESPONSES['default']
}

const SUGGESTIONS = [
  'How do I build out in a 3-2-1?',
  'When should we press?',
  'How to clear safely under pressure?',
  'Show me a passing pattern',
  'When should we counter-attack?',
  'How do we defend as a unit?',
]

export default function AICoachBox() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'coach',
      text: '👋 Hi Coach! I\'m your AI tactical assistant (demo mode). Ask me anything about formations, patterns, pressing, defending, or drills for your youth team!',
      ts: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (text?: string) => {
    const msg = text ?? input.trim()
    if (!msg) return
    setInput('')
    const userMsg: Message = { role: 'user', text: msg, ts: Date.now() }
    setMessages((prev) => [...prev, userMsg])
    setIsTyping(true)
    setTimeout(() => {
      const response = getMockResponse(msg)
      setMessages((prev) => [...prev, { role: 'coach', text: response, ts: Date.now() }])
      setIsTyping(false)
    }, 800 + Math.random() * 600)
  }

  return (
    <div className="flex flex-col h-full p-3 gap-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
          AI
        </div>
        <div>
          <p className="text-white font-bold text-sm">AI Tactics Coach</p>
          <p className="text-xs text-gray-400">Demo mode — real AI coming soon!</p>
        </div>
        <span className="ml-auto text-xs bg-yellow-800 text-yellow-300 px-2 py-0.5 rounded-full">
          DEMO
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0 bg-gray-900/50 rounded p-2">
        {messages.map((msg) => (
          <div key={msg.ts}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed
              ${msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-gray-700 text-gray-200 rounded-bl-none'
              }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-400 rounded-lg rounded-bl-none px-3 py-2 text-xs">
              <span className="inline-flex gap-0.5">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-1">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => handleSend(s)}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded-full border border-gray-700 hover:border-gray-600 transition-colors">
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about tactics, formations, drills..."
          className="flex-1 bg-gray-800 text-white text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500 placeholder-gray-500"
        />
        <button onClick={() => handleSend()}
          disabled={!input.trim() || isTyping}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-bold disabled:opacity-40 transition-colors">
          ↑
        </button>
      </div>

      <p className="text-xs text-gray-600 text-center">
        🔒 AI integration ready — wire up Claude API to enable real responses
      </p>
    </div>
  )
}
