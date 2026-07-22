'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let handled = false
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined

    const handleSession = async (session: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>) => {
      if (handled) return
      handled = true

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!profile) {
        router.push('/accept-invite/setup')
        return
      }

      if (session.user.id === process.env.NEXT_PUBLIC_SUPER_ADMIN_ID) {
        router.push('/superadmin')
      } else if (profile.role === 'agent') {
        router.push('/agent')
      } else if (profile.role === 'admin') {
        router.push('/admin')
      } else if (profile.role === 'end_user') {
        router.push('/portal')
      } else {
        router.push('/portal')
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setTimeout(() => {
          void handleSession(session)
        }, 0)
      }
    })

    const handleCallback = async () => {
      const code = new URLSearchParams(window.location.search).get('code')

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data.session) {
          await handleSession(data.session)
          return
        }
      }

      // Hash tokens are processed asynchronously by Supabase. Give the auth
      // listener time to receive SIGNED_IN before using the session fallback.
      fallbackTimer = setTimeout(async () => {
        if (handled) return

        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          await handleSession(session)
        } else if (!handled) {
          handled = true
          router.push('/login')
        }
      }, 1000)
    }

    void handleCallback()

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer)
      authListener.subscription.unsubscribe()
    }
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Setting up your account...</p>
    </div>
  )
}
