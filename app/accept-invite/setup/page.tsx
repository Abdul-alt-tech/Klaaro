'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function InviteSetupPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) {
        setEmail(session.user.email)
        const metadata = session.user.user_metadata
        if (metadata?.full_name) setName(metadata.full_name)
      }
    }
    getSession()
  }, [])

  const handleSetup = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      setError('Please enter and confirm your password.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Session expired. Please ask your admin to send a new invite.')
      setLoading(false)
      return
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError('Error setting password: ' + updateError.message)
      setLoading(false)
      return
    }

    // Get invite details from user metadata
    const metadata = session.user.user_metadata
    const token = metadata?.invite_token
    const role = metadata?.role || 'end_user'
    const organisationId = metadata?.organisation_id
    const fullName = metadata?.full_name || name || email

    if (token && organisationId) {
      await fetch('/api/admin/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          password,
          fullName,
          role,
          organisationId,
        })
      })
    }

    // Redirect based on role
    if (role === 'agent') router.push('/agent')
    else if (role === 'admin') router.push('/admin')
    else router.push('/portal')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#059669' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="3" width="3.5" height="18" rx="1.5" fill="white"/>
              <line x1="7.5" y1="12" x2="20" y2="4" stroke="white" strokeWidth="3.2" strokeLinecap="round"/>
              <line x1="7.5" y1="12" x2="20" y2="20" stroke="white" strokeWidth="3.2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-emerald-600">Klaaro</h1>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {name ? `Welcome, ${name}` : 'Welcome to Klaaro'}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Set your password to activate your account and join your team.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleSetup}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Activating account...' : 'Activate account'}
          </button>
        </div>
      </div>
    </div>
  )
}