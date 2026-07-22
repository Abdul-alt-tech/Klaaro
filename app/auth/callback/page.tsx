'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

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

    handleCallback()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Setting up your account...</p>
    </div>
  )
}
