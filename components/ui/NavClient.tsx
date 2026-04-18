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
          : <div className="w-8 h-8 rounded-full border border-violet-500 flex items-center justify-center text-sm font-bold"
              style={{ background: 'rgba(124,58,237,0.3)' }}>
              {session.user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>}
        <span className="text-sm text-gray-300 hidden md:block">{session.user?.name}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 w-44 rounded-xl border border-white/10 py-1 z-50"
            style={{ background: 'rgba(10,10,30,0.95)', backdropFilter: 'blur(12px)' }}>
            <Link href="/profile" onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5">Profile</Link>
            <Link href="/leaderboard" onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5">Leaderboard</Link>
            <button onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5">Sign Out</button>
          </div>
        </>
      )}
    </div>
  )
}
