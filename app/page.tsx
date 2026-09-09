'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RootPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleRedirect = async () => {
      const hash = window.location.hash

      if (hash && hash.includes('access_token')) {
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, organisation_id')
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
          } else {
            router.push('/portal')
          }
          return
        }
      }

      router.push('/login')
    }

    handleRedirect()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Loading...</p>
    </div>
  )
}
