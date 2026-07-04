'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{backgroundColor: '#059669'}}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="4" y="3" width="3" height="14" rx="1" fill="white"/>
                  <line x1="7" y1="10" x2="17" y2="3.5" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
                  <line x1="7" y1="10" x2="17" y2="16.5" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-emerald-600">Klaaro</span>
            </div>
            <div className="flex gap-6">
              <Link
                href="/agent"
                className="text-sm text-gray-600 hover:text-emerald-600 font-medium"
              >
                Ticket Queue
              </Link>
              <Link
                href="/agent/dashboard"
                className="text-sm text-gray-600 hover:text-emerald-600 font-medium"
              >
                Dashboard
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs bg-emerald-100 text-emerald-700 font-medium px-2 py-1 rounded-full">
              Agent
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-red-500"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
