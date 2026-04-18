import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Nav } from '@/components/ui/Nav'
import { GAME_META } from '@/lib/games/types'
import Link from 'next/link'

export default async function ProfilePage() {
  const session = await auth()
  if (!(session?.user as any)?.id) redirect('/auth/signin')

  const userId = (session!.user as any).id

  const leaderboard = await prisma.leaderboard.findMany({
    where: { userId },
    orderBy: { gamesPlayed: 'desc' },
  })
  const totalGames = leaderboard.reduce((s, r) => s + r.gamesPlayed, 0)
  const totalWins = leaderboard.reduce((s, r) => s + r.wins, 0)

  return (
    <div className="min-h-screen" style={{ background: '#050510' }}>
      <Nav />
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="flex items-center gap-5 mb-10">
          {session!.user?.image
            ? <img src={session!.user.image} alt="" className="w-16 h-16 rounded-full border-2 border-violet-500" />
            : <div className="w-16 h-16 rounded-full border-2 border-violet-500 flex items-center justify-center text-2xl font-black"
                style={{ background: 'rgba(124,58,237,0.3)' }}>
                {session!.user?.name?.[0]?.toUpperCase()}
              </div>}
          <div>
            <h1 className="text-2xl font-black">{session!.user?.name}</h1>
            <p className="text-gray-400 text-sm">{session!.user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="p-5 rounded-2xl border border-white/5 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="text-3xl font-black text-violet-400">{totalGames}</div>
            <div className="text-xs text-gray-400 mt-1">Games Played</div>
          </div>
          <div className="p-5 rounded-2xl border border-white/5 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="text-3xl font-black text-emerald-400">{totalWins}</div>
            <div className="text-xs text-gray-400 mt-1">Total Wins</div>
          </div>
        </div>

        {leaderboard.length > 0 ? (
          <div>
            <h2 className="text-lg font-bold mb-4">Game Stats</h2>
            <div className="space-y-3">
              {leaderboard.map(row => {
                const m = GAME_META[row.gameType as keyof typeof GAME_META]
                if (!m) return null
                const winRate = row.gamesPlayed ? Math.round((row.wins / row.gamesPlayed) * 100) : 0
                return (
                  <div key={row.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5"
                    style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{m.icon}</span>
                      <div>
                        <div className="text-sm font-bold">{m.name}</div>
                        <div className="text-xs text-gray-500">{row.gamesPlayed} played · {row.wins} wins</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-violet-400">{winRate}%</div>
                      <div className="text-xs text-gray-500">win rate</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🃏</div>
            <p className="text-gray-400 mb-4">No games played yet.</p>
            <Link href="/games" className="inline-block px-6 py-2 rounded-xl font-bold text-sm"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
              Play Now
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
