import { Nav } from '@/components/ui/Nav'
import { prisma } from '@/lib/db'
import { GAME_META, GAME_SLUGS } from '@/lib/games/types'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type LeaderboardRow = {
  id: string
  gameType: string
  wins: number
  gamesPlayed: number
  user: { name: string | null; image: string | null }
}

export default async function LeaderboardPage() {
  const rows: LeaderboardRow[] = await prisma.leaderboard.findMany({
    orderBy: { wins: 'desc' },
    take: 100,
    include: { user: { select: { name: true, image: true } } },
  })

  const byGame = GAME_SLUGS.reduce((acc, slug) => {
    acc[slug] = rows.filter((r: LeaderboardRow) => r.gameType === slug).slice(0, 5)
    return acc
  }, {} as Record<string, LeaderboardRow[]>)

  return (
    <div className="min-h-screen" style={{ background: '#050510' }}>
      <Nav />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-3" style={{ fontFamily: 'Georgia, serif' }}>Leaderboard</h1>
          <p className="text-gray-400">Top players across all games</p>
        </div>

        <div className="grid gap-6">
          {GAME_SLUGS.map(slug => {
            const m = GAME_META[slug]
            const entries = byGame[slug]
            return (
              <div key={slug} className="p-6 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{m.icon}</span>
                    <h2 className="text-lg font-bold">{m.name}</h2>
                  </div>
                  <Link href={`/games/${slug}/play`} className="text-xs text-violet-400 hover:text-violet-300">Play →</Link>
                </div>
                {entries.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-3">No games played yet — be the first!</div>
                ) : (
                  <div className="space-y-2">
                    {entries.map((row: LeaderboardRow, i: number) => (
                      <div key={row.id} className="flex items-center gap-3">
                        <span className={`text-sm font-black w-5 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                          {i + 1}
                        </span>
                        {row.user.image
                          ? <img src={row.user.image} alt="" className="w-7 h-7 rounded-full" />
                          : <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{ background: 'rgba(124,58,237,0.4)' }}>
                              {row.user.name?.[0]}
                            </div>}
                        <span className="flex-1 text-sm">{row.user.name}</span>
                        <span className="text-sm font-bold text-violet-400">{row.wins}W</span>
                        <span className="text-xs text-gray-500">{row.gamesPlayed} played</span>
                      </div>
                    ))}
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
