'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PortalLayout({
  children,
}: {
  children: ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-emerald-600">Klaaro</h1>
            <div className="flex gap-6">
              <Link
                href="/portal"
                className="text-sm text-gray-600 hover:text-emerald-600 font-medium"
              >
                My Requests
              </Link>
              <Link
                href="/portal/new"
                className="text-sm text-gray-600 hover:text-emerald-600 font-medium"
              >
                Submit Request
              </Link>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-red-500"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}