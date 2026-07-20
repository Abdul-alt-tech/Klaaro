'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AcceptInvitePage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tokenValid, setTokenValid] = useState(false)
  const [checking, setChecking] = useState(true)
  const [inviteData, setInviteData] = useState<{
    name: string
    email: string
    role: string
    org: string
    token: string
  } | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const validateInvite = async () => {
      const token = searchParams.get('token')
      const name = searchParams.get('name')
      const email = searchParams.get('email')
      const role = searchParams.get('role')
      const org = searchParams.get('org')

      if (!token || !name || !email || !role || !org) {
        setError('Invalid invite link.')
        setChecking(false)
        return
      }

      // Check the token exists and has not been accepted
      const { data: invite } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .eq('accepted', false)
        .single()

      if (!invite) {
        setError('This invite link is invalid or has already been used.')
        setChecking(false)
        return
      }

      // Check it has not expired
      if (new Date(invite.expires_at) < new Date()) {
        setError('This invite link has expired. Ask your admin to send a new one.')
        setChecking(false)
        return
      }

      setInviteData({ token, name, email, role, org })
      setTokenValid(true)
      setChecking(false)
    }

    validateInvite()
  }, [])

  const handleAccept = async () => {
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

    if (!inviteData) return

    setLoading(true)
    setError('')

    const response = await fetch('/api/admin/accept-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: inviteData.token,
        email: inviteData.email,
        password,
        fullName: inviteData.name,
        role: inviteData.role,
        organisationId: inviteData.org,
      })
    })

    const result = await response.json()

    if (!response.ok) {
      setError('Error accepting invite: ' + result.error)
      setLoading(false)
      return
    }

    // Sign them in automatically
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: inviteData.email,
      password,
    })

    if (signInError) {
      setError('Account created but could not sign in automatically. Please go to the login page.')
      setLoading(false)
      return
    }

    // Redirect based on role
    if (inviteData.role === 'agent') router.push('/agent')
    else if (inviteData.role === 'admin') router.push('/admin')
    else router.push('/portal')
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Validating invite...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#059669' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="3" width="3.5" height="18" rx="1.5" fill="white"/>
              <line x1="7.5" y1="12" x2="20" y2="4" stroke="white" strokeWidth="3.2" strokeLinecap="round"/>
              <line x1="7.5" y1="12" x2="20" y2="20" stroke="white" strokeWidth="3.2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-emerald-600">Klaaro</h1>
        </div>

        {!tokenValid ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Invalid invite
            </h2>
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Welcome, {inviteData?.name}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Set your password to activate your account and join your team on Klaaro.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={inviteData?.email || ''}
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
                onClick={handleAccept}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'Activating account...' : 'Activate account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}