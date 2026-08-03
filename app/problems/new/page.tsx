'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NewProblemPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('P3')
  const [workaround, setWorkaround] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('organisation_id, full_name')
      .eq('id', user.id)
      .single()

    const { error: insertError } = await supabase
      .from('problems')
      .insert({
        title: title.trim(),
        description: description.trim(),
        priority,
        status: 'open',
        submitted_by: user.id,
        submitted_by_name: profile?.full_name,
        organisation_id: profile?.organisation_id,
        workaround: workaround.trim() || null,
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/problems')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#059669' }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="4" y="3" width="3" height="14" rx="1" fill="white"/>
                  <line x1="7" y1="10" x2="17" y2="3.5" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
                  <line x1="7" y1="10" x2="17" y2="16.5" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-emerald-600">Klaaro</span>
            </div>
            <div className="flex gap-6">
              <Link href="/portal" className="text-sm text-gray-600 hover:text-emerald-600 font-medium">
                My Requests
              </Link>
              <Link href="/agent" className="text-sm text-gray-600 hover:text-emerald-600 font-medium">
                Agent Queue
              </Link>
              <Link href="/changes" className="text-sm text-gray-600 hover:text-emerald-600 font-medium">
                Changes
              </Link>
              <Link href="/problems" className="text-sm text-emerald-600 font-medium">
                Problems
              </Link>
            </div>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}
            className="text-sm text-gray-500 hover:text-red-500"
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/problems" className="text-sm text-emerald-600 hover:underline">
            ← Back to Problems
          </Link>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-1">Raise a Problem</h2>
        <p className="text-gray-500 text-sm mb-6">
          Use this to record a recurring issue or investigate the root cause of multiple related incidents.
        </p>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="P1">P1 — Critical</option>
              <option value="P2">P2 — High</option>
              <option value="P3">P3 — Medium</option>
              <option value="P4">P4 — Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the problem"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem — what is happening, how often, which systems are affected, and what impact it is having"
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Known workaround
            </label>
            <textarea
              value={workaround}
              onChange={(e) => setWorkaround(e.target.value)}
              placeholder="If there is a temporary workaround staff can use while this is being investigated, describe it here"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Raise Problem'}
          </button>
        </div>
      </div>
    </div>
  )
}