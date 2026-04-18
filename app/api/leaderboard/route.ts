import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const gameType = searchParams.get('game')
  const rows = await prisma.leaderboard.findMany({
    where: gameType ? { gameType } : undefined,
    orderBy: { wins: 'desc' },
    take: 10,
    include: { user: { select: { name: true, image: true } } },
  })
  return NextResponse.json(rows)
}
