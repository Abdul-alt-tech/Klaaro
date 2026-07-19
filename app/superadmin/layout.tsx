'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [authorised, setAuthorised] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user || user.id !== process.env.NEXT_PUBLIC_SUPER_ADMIN_ID) {
        router.push('/login')
        return
      }

      setAuthorised(true)
      setChecking(false)
    }

    checkAccess()
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Checking access...</p>
      </div>
    )
  }

  if (!authorised) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#059669' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="4" y="3" width="3" height="14" rx="1" fill="white"/>
                <line x1="7" y1="10" x2="17" y2="3.5" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
                <line x1="7" y1="10" x2="17" y2="16.5" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-emerald-600">Klaaro</span>
            <span className="text-xs bg-purple-100 text-purple-700 font-medium px-2 py-1 rounded-full ml-2">
              Super Admin
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}