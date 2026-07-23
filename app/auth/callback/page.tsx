'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()
  const processed = useRef(false)

  useEffect(() => {
    // Explicitly process the URL hash so Supabase detects the session
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
  
      if (accessToken && refreshToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
      }
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (processed.current) return
        
        if (event === 'SIGNED_IN' && session) {
          processed.current = true
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, organisation_id')
            .eq('id', session.user.id)
            .single()

          if (!profile || !profile.organisation_id) {
            router.push('/accept-invite/setup')
            return
          }

          if (session.user.id === process.env.NEXT_PUBLIC_SUPER_ADMIN_ID) {
            router.push('/superadmin')
          } else if (profile.role === 'agent') {
            router.push('/agent')
          } else if (profile.role === 'admin') {
            router.push('/admin')
          } else {
            router.push('/portal')
          }
        }

        if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
          router.push('/login')
        }
      }
    )

    // Fallback after 5 seconds if no auth event fires
    const timeout = setTimeout(() => {
      if (!processed.current) {
        router.push('/login')
      }
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#059669' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="3" width="3.5" height="18" rx="1.5" fill="white"/>
            <line x1="7.5" y1="12" x2="20" y2="4" stroke="white" strokeWidth="3.2" strokeLinecap="round"/>
            <line x1="7.5" y1="12" x2="20" y2="20" stroke="white" strokeWidth="3.2" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-gray-600 font-medium">Setting up your account...</p>
        <p className="text-gray-400 text-sm mt-1">Please wait a moment</p>
      </div>
    </div>
  )
}