# Auth & Sessions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add working sign-in/sign-up pages, session-aware Nav, profile page, and game result tracking to DeckVerse.

**Architecture:** NextAuth v5 handles auth via JWT sessions; credentials provider stores bcrypt hash in `account.access_token`; a `useGameOver` client hook posts results to `/api/game-sessions`; leaderboard pulls aggregated data from Postgres via Prisma.

**Tech Stack:** Next.js 16 App Router, NextAuth v5, Prisma 7 + Neon PostgreSQL, bcryptjs, Tailwind CSS

---

### Task 1: NextAuth API route

**Files:**
- Create: `app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create the route file**

```ts
// app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/auth'
export const { GET, POST } = handlers
```

- [ ] **Step 2: Verify dev server compiles without error**

Run: `npm run dev` in `fun-projects/deckverse/`
Expected: No TypeScript errors on startup

- [ ] **Step 3: Commit**

```bash
git add app/api/auth
git commit -m "feat: wire NextAuth handlers to API route"
```

---

### Task 2: Signup API route

**Files:**
- Create: `app/api/auth/signup/route.ts`

- [ ] **Step 1: Create the route**

```ts
// app/api/auth/signup/route.ts
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const { name, email, password } = await req.json()
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }
  const hash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { name, email } })
  await prisma.account.create({
    data: {
      userId: user.id,
      type: 'credentials',
      provider: 'credentials',
      providerAccountId: user.id,
      access_token: hash,
    },
  })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/auth/signup
git commit -m "feat: add signup API route"
```

---

### Task 3: Sign in page

**Files:**
- Create: `app/auth/signin/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// app/auth/signin/page.tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) setError('Invalid email or password')
    else router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#050510' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black tracking-widest">
            DECK<span className="text-violet-400">VERSE</span>
          </Link>
          <p className="text-gray-400 mt-2 text-sm">Sign in to track your stats</p>
        </div>

        <div className="p-6 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors mb-4">
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-500">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email" required
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm" />
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Password" required
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm" />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-4">
            No account?{' '}
            <Link href="/auth/signup" className="text-violet-400 hover:text-violet-300">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/auth/signin
git commit -m "feat: add sign in page"
```

---

### Task 4: Sign up page

**Files:**
- Create: `app/auth/signup/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// app/auth/signup/page.tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
      return
    }
    await signIn('credentials', { email, password, redirect: false })
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#050510' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black tracking-widest">
            DECK<span className="text-violet-400">VERSE</span>
          </Link>
          <p className="text-gray-400 mt-2 text-sm">Create your free account</p>
        </div>

        <div className="p-6 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors mb-4">
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-500">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Display name" required
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm" />
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email" required
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm" />
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Password (min 8 chars)" minLength={8} required
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm" />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-4">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-violet-400 hover:text-violet-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/auth/signup
git commit -m "feat: add sign up page"
```

---

### Task 5: Session-aware Nav

**Files:**
- Create: `components/ui/NavClient.tsx`
- Modify: `components/ui/Nav.tsx`

- [ ] **Step 1: Create NavClient (client component for session)**

```tsx
// components/ui/NavClient.tsx
'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'

export function NavClient() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  if (!session) {
    return (
      <Link href="/auth/signin"
        className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>
        Sign In
      </Link>
    )
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2">
        {session.user?.image
          ? <img src={session.user.image} alt="" className="w-8 h-8 rounded-full border border-white/20" />
          : <div className="w-8 h-8 rounded-full border border-violet-500 flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(124,58,237,0.3)' }}>
              {session.user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>}
        <span className="text-sm text-gray-300 hidden md:block">{session.user?.name}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-10 w-44 rounded-xl border border-white/10 py-1 z-50"
          style={{ background: 'rgba(10,10,30,0.95)', backdropFilter: 'blur(12px)' }}>
          <Link href="/profile" onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5">Profile</Link>
          <Link href="/leaderboard" onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5">Leaderboard</Link>
          <button onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5">Sign Out</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update Nav.tsx to use NavClient**

```tsx
// components/ui/Nav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NavClient } from './NavClient'

export function Nav() {
  const path = usePathname()
  const links = [
    { href: '/games', label: 'Games' },
    { href: '/learn/blackjack', label: 'How to Play' },
    { href: '/leaderboard', label: 'Leaderboard' },
  ]

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 border-b border-white/5 backdrop-blur-xl"
      style={{ background: 'rgba(5,5,16,0.92)' }}>
      <Link href="/" className="text-xl font-black tracking-widest">
        DECK<span className="text-violet-400" style={{ textShadow: '0 0 20px #7c3aed' }}>VERSE</span>
      </Link>
      <div className="hidden md:flex items-center gap-8">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={`text-sm tracking-wide transition-colors ${path.startsWith(l.href) ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
            {l.label}
          </Link>
        ))}
      </div>
      <NavClient />
    </nav>
  )
}
```

- [ ] **Step 3: Add SessionProvider to layout**

Read `app/layout.tsx` and wrap children with SessionProvider:

```tsx
// app/layout.tsx  — add to imports:
import { SessionProvider } from 'next-auth/react'
// wrap {children} with:
<SessionProvider>{children}</SessionProvider>
```

- [ ] **Step 4: Commit**

```bash
git add components/ui/NavClient.tsx components/ui/Nav.tsx app/layout.tsx
git commit -m "feat: session-aware Nav with sign in/out and avatar"
```

---

### Task 6: Game sessions API + Leaderboard API

**Files:**
- Create: `app/api/game-sessions/route.ts`
- Create: `app/api/leaderboard/route.ts`

- [ ] **Step 1: Create game-sessions POST route**

```ts
// app/api/game-sessions/route.ts
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
      userId: session?.user?.id ?? null,
    },
  })
  if (session?.user?.id && outcome !== 'abandoned') {
    await prisma.leaderboard.upsert({
      where: { userId_gameType: { userId: session.user.id, gameType } },
      create: {
        userId: session.user.id,
        gameType,
        gamesPlayed: 1,
        wins: outcome === 'win' ? 1 : 0,
        highScore: score ?? 0,
      },
      update: {
        gamesPlayed: { increment: 1 },
        wins: outcome === 'win' ? { increment: 1 } : undefined,
        highScore: { set: Math.max(score ?? 0, 0) },
      },
    })
  }
  return NextResponse.json({ ok: true, id: gs.id })
}
```

- [ ] **Step 2: Create leaderboard GET route**

```ts
// app/api/leaderboard/route.ts
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
```

- [ ] **Step 3: Commit**

```bash
git add app/api/game-sessions app/api/leaderboard
git commit -m "feat: game sessions and leaderboard API routes"
```

---

### Task 7: useGameOver hook

**Files:**
- Create: `hooks/useGameOver.ts`

- [ ] **Step 1: Create the hook**

```ts
// hooks/useGameOver.ts
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
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useGameOver.ts
git commit -m "feat: useGameOver hook for tracking game results"
```

---

### Task 8: Wire useGameOver into all 10 game boards

For each board below, add the hook call. The pattern is the same for all.

**Files to modify:**
- `components/games/blackjack/Board.tsx`
- `components/games/war/Board.tsx`
- `components/games/memory/Board.tsx`
- `components/games/snap/Board.tsx`
- `components/games/go-fish/Board.tsx`
- `components/games/crazy-eights/Board.tsx`
- `components/games/rummy/Board.tsx`
- `components/games/speed/Board.tsx`
- `components/games/poker/Board.tsx`
- `components/games/solitaire/Board.tsx`

**Pattern for each board (example using Poker):**

```tsx
// Add to imports:
import { useGameOver } from '@/hooks/useGameOver'

// Inside the board component function, after state declarations:
useGameOver({ over, winner: state.winner, playerId: 'player', gameType: 'poker' })
```

For Blackjack (uses `result` not `winner`):
```tsx
const over = !!getResult(state)
const result = getResult(state)
useGameOver({ over, winner: result === 'player' ? 'player' : result === 'push' ? null : 'dealer', playerId: 'player', gameType: 'blackjack' })
```

For Memory (no explicit winner, just `over`):
```tsx
useGameOver({ over, winner: over ? 'player' : null, playerId: 'player', gameType: 'memory' })
```

For Solitaire (win only):
```tsx
useGameOver({ over, winner: over ? 'player' : null, playerId: 'player', gameType: 'solitaire', score: state.moves })
```

- [ ] **Step 1: Add hook to all 10 boards**
- [ ] **Step 2: Commit**

```bash
git add components/games/
git commit -m "feat: track game results with useGameOver in all 10 boards"
```

---

### Task 9: Profile page

**Files:**
- Create: `app/profile/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// app/profile/page.tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Nav } from '@/components/ui/Nav'
import { GAME_META } from '@/lib/games/types'
import Link from 'next/link'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const leaderboard = await prisma.leaderboard.findMany({
    where: { userId: session.user.id },
    orderBy: { gamesPlayed: 'desc' },
  })
  const totalGames = leaderboard.reduce((s, r) => s + r.gamesPlayed, 0)
  const totalWins = leaderboard.reduce((s, r) => s + r.wins, 0)

  return (
    <div className="min-h-screen" style={{ background: '#050510' }}>
      <Nav />
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="flex items-center gap-5 mb-10">
          {session.user.image
            ? <img src={session.user.image} alt="" className="w-16 h-16 rounded-full border-2 border-violet-500" />
            : <div className="w-16 h-16 rounded-full border-2 border-violet-500 flex items-center justify-center text-2xl font-black" style={{ background: 'rgba(124,58,237,0.3)' }}>
                {session.user.name?.[0]?.toUpperCase()}
              </div>}
          <div>
            <h1 className="text-2xl font-black">{session.user.name}</h1>
            <p className="text-gray-400 text-sm">{session.user.email}</p>
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

        {leaderboard.length > 0 && (
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
        )}

        {leaderboard.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🃏</div>
            <p className="text-gray-400">No games played yet.</p>
            <Link href="/games" className="mt-4 inline-block px-6 py-2 rounded-xl font-bold text-sm"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
              Play Now
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/profile
git commit -m "feat: profile page with game stats"
```

---

### Task 10: Live Leaderboard page

**Files:**
- Modify: `app/leaderboard/page.tsx`

- [ ] **Step 1: Rewrite to fetch real data**

```tsx
// app/leaderboard/page.tsx
import { Nav } from '@/components/ui/Nav'
import { prisma } from '@/lib/db'
import { GAME_META, GAME_SLUGS } from '@/lib/games/types'
import Link from 'next/link'

export const revalidate = 60

export default async function LeaderboardPage() {
  const rows = await prisma.leaderboard.findMany({
    orderBy: { wins: 'desc' },
    take: 50,
    include: { user: { select: { name: true, image: true } } },
  })

  const byGame = GAME_SLUGS.reduce((acc, slug) => {
    acc[slug] = rows.filter(r => r.gameType === slug).slice(0, 5)
    return acc
  }, {} as Record<string, typeof rows>)

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
                    {entries.map((row, i) => (
                      <div key={row.id} className="flex items-center gap-3">
                        <span className="text-sm font-black w-5 text-gray-500">{i + 1}</span>
                        {row.user.image
                          ? <img src={row.user.image} alt="" className="w-7 h-7 rounded-full" />
                          : <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(124,58,237,0.4)' }}>
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
```

- [ ] **Step 2: Commit**

```bash
git add app/leaderboard/page.tsx
git commit -m "feat: live leaderboard with real data from DB"
```

---

### Task 11: Deploy to Vercel

- [ ] **Step 1: Set env vars on Vercel**

Run these (replace values with real secrets):
```bash
npx vercel env add NEXTAUTH_SECRET production
npx vercel env add NEXTAUTH_URL production  # https://deckverse.vercel.app
npx vercel env add DATABASE_URL production
npx vercel env add GOOGLE_CLIENT_ID production
npx vercel env add GOOGLE_CLIENT_SECRET production
```

- [ ] **Step 2: Push and deploy**

```bash
git push origin main
npx vercel deploy --prod --yes
```

Expected: Build succeeds, `https://deckverse.vercel.app` is live with auth.
