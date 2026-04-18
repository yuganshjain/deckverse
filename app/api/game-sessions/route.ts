import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const session = await auth()
  const { gameType, outcome, score, duration } = await req.json()
  if (!gameType || !outcome) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const gs = await prisma.gameSession.create({
    data: {
      gameType,
      outcome,
      score: score ?? 0,
      duration: duration ?? 0,
      userId: (session?.user as any)?.id ?? null,
    },
  })
  if ((session?.user as any)?.id && outcome !== 'abandoned') {
    const userId = (session.user as any).id
    const existing = await prisma.leaderboard.findUnique({
      where: { userId_gameType: { userId, gameType } },
    })
    await prisma.leaderboard.upsert({
      where: { userId_gameType: { userId, gameType } },
      create: {
        userId,
        gameType,
        gamesPlayed: 1,
        wins: outcome === 'win' ? 1 : 0,
        highScore: score ?? 0,
      },
      update: {
        gamesPlayed: { increment: 1 },
        wins: outcome === 'win' ? { increment: 1 } : undefined,
        highScore: Math.max(score ?? 0, existing?.highScore ?? 0),
      },
    })
  }
  return NextResponse.json({ ok: true, id: gs.id })
}
