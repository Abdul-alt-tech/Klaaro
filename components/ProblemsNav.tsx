'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ProblemsNavProps = {
  activeLink?: 'problems' | 'new'
}

export default function ProblemsNav({ activeLink = 'problems' }: ProblemsNavProps) {
  const [role, setRole] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setRole('')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setRole(profile?.role || '')
    }

    fetchRole()
  }, [supabase])

  const isAgentOrAdmin = role === 'agent' || role === 'admin'

  const navLinkClass = (isActive: boolean) =>
    `text-sm ${isActive ? 'text-emerald-600 font-medium' : 'text-gray-600 hover:text-emerald-600 font-medium'}`

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#059669' }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="4" y="3" width="3" height="14" rx="1" fill="white" />
                <line x1="7" y1="10" x2="17" y2="3.5" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
                <line x1="7" y1="10" x2="17" y2="16.5" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-xl font-bold text-emerald-600">Klaaro</span>
          </div>

          <div className="flex gap-6">
            {!isAgentOrAdmin ? (
              <Link href="/portal" className={navLinkClass(false)}>
                My Requests
              </Link>
            ) : (
              <>
                <Link href="/agent" className={navLinkClass(false)}>
                  Ticket Queue
                </Link>
                <Link href="/agent/dashboard" className={navLinkClass(false)}>
                  Dashboard
                </Link>
              </>
            )}

            <Link href="/changes" className={navLinkClass(false)}>
              Changes
            </Link>
            <Link href="/problems" className={navLinkClass(activeLink === 'problems' || activeLink === 'new')}>
              Problems
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAgentOrAdmin && (
            <span className="text-xs bg-emerald-100 text-emerald-700 font-medium px-2 py-1 rounded-full">
              Agent
            </span>
          )}
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}
            className="text-sm text-gray-500 hover:text-red-500"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
