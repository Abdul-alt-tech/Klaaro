'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#059669' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="3" width="3.5" height="18" rx="1.5" fill="white" />
                <line x1="7.5" y1="12" x2="20" y2="4" stroke="white" strokeWidth="3.2" strokeLinecap="round" />
                <line x1="7.5" y1="12" x2="20" y2="20" stroke="white" strokeWidth="3.2" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-emerald-600">Klaaro</h1>
          </div>
          <p className="text-gray-500 mt-1">Reset your password</p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              If an account exists for that email, a reset link has been sent. Check your inbox.
            </p>
            <Link
              href="/login"
              className="block text-center text-emerald-600 font-medium text-sm hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="you@example.com"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>

            <p className="text-center text-sm text-gray-500">
              <Link href="/login" className="text-emerald-600 font-medium hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
