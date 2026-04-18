import { useEffect, useRef } from 'react'

export function useGameOver(opts: {
  over: boolean
  winner: string | null | undefined
  playerId: string
  gameType: string
  score?: number
}) {
  const { over, winner, playerId, gameType, score } = opts
  const saved = useRef(false)

  useEffect(() => {
    if (!over || saved.current) return
    saved.current = true
    const outcome = winner === playerId ? 'win' : winner ? 'loss' : 'draw'
    fetch('/api/game-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameType, outcome, score: score ?? 0 }),
    }).catch(() => {})
  }, [over, winner, playerId, gameType, score])

  useEffect(() => {
    saved.current = false
  }, [over === false])
}
