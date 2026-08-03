'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Problem = {
  id: string
  title: string
  description: string
  status: string
  priority: string | null
  submitted_by_name: string | null
  root_cause: string | null
  workaround: string | null
  resolution: string | null
  created_at: string
  updated_at: string
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  investigating: 'bg-yellow-100 text-yellow-700',
  known_error: 'bg-orange-100 text-orange-700',
  resolved: 'bg-emerald-100 text-emerald-700',
}

export default function ProblemDetailPage() {
  const { id } = useParams()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userRole, setUserRole] = useState('')
  const [message, setMessage] = useState('')
  const [rootCause, setRootCause] = useState('')
  const [workaround, setWorkaround] = useState('')
  const [resolution, setResolution] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user!.id)
        .single()

      setUserRole(profile?.role || '')

      const { data: problemData } = await supabase
        .from('problems')
        .select('*')
        .eq('id', id)
        .single()

      setProblem(problemData)
      if (problemData?.root_cause) setRootCause(problemData.root_cause)
      if (problemData?.workaround) setWorkaround(problemData.workaround)
      if (problemData?.resolution) setResolution(problemData.resolution)
      setLoading(false)
    }

    fetchData()
  }, [id, supabase])

  const updateProblem = async (newStatus: string) => {
    setSaving(true)
    setMessage('')

    const updates: Record<string, string | null> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
      root_cause: rootCause.trim() || null,
      workaround: workaround.trim() || null,
      resolution: newStatus === 'resolved' ? resolution.trim() || null : null,
    }

    await supabase
      .from('problems')
      .update(updates)
      .eq('id', id)

    setProblem((prev) => prev ? { ...prev, ...updates } : prev)
    setMessage(`Problem updated to ${newStatus.replace('_', ' ')}.`)
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading problem...</p>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Problem not found.</p>
      </div>
    )
  }

  const canManage = userRole === 'agent' || userRole === 'admin'

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

      <div className="max-w-3xl mx-auto px-6 py-8">
        <Link
          href="/problems"
          className="text-sm text-emerald-600 hover:underline mb-6 inline-block"
        >
          ← Back to Problems
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {problem.priority && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    problem.priority === 'P1' ? 'bg-red-100 text-red-700' :
                    problem.priority === 'P2' ? 'bg-orange-100 text-orange-700' :
                    problem.priority === 'P3' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {problem.priority}
                  </span>
                )}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[problem.status]}`}>
                  {problem.status.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">{problem.title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Raised by {problem.submitted_by_name || 'Unknown'} ·{' '}
                {new Date(problem.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-5">
            <p className="text-xs font-medium text-gray-500 mb-2">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed">{problem.description}</p>
          </div>

          {problem.workaround && !canManage && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
              <p className="text-xs font-medium text-blue-700 mb-1">Workaround available</p>
              <p className="text-sm text-blue-800">{problem.workaround}</p>
            </div>
          )}

          {problem.resolution && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
              <p className="text-xs font-medium text-emerald-700 mb-1">Resolution</p>
              <p className="text-sm text-emerald-800">{problem.resolution}</p>
            </div>
          )}

          {canManage && problem.status !== 'resolved' && (
            <div className="border-t border-gray-100 pt-5 space-y-4">
              <p className="text-xs font-medium text-gray-500">Investigation workspace</p>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Root cause analysis
                </label>
                <textarea
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="Document what is causing this problem..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Workaround
                </label>
                <textarea
                  value={workaround}
                  onChange={(e) => setWorkaround(e.target.value)}
                  placeholder="Temporary steps staff can take while this is being fixed..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {problem.status === 'known_error' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Resolution
                  </label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Describe the permanent fix applied..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {problem.status === 'open' && (
                  <button
                    onClick={() => updateProblem('investigating')}
                    disabled={saving}
                    className="text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Start investigating
                  </button>
                )}

                {problem.status === 'investigating' && (
                  <button
                    onClick={() => updateProblem('known_error')}
                    disabled={saving}
                    className="text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Mark as known error
                  </button>
                )}

                {problem.status === 'known_error' && (
                  <button
                    onClick={() => updateProblem('resolved')}
                    disabled={saving}
                    className="text-sm bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Mark resolved
                  </button>
                )}

                {(problem.status === 'investigating' || problem.status === 'known_error') && (
                  <button
                    onClick={() => updateProblem(problem.status)}
                    disabled={saving}
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Save notes
                  </button>
                )}
              </div>

              {message && (
                <p className="text-sm text-emerald-600">{message}</p>
              )}
            </div>
          )}

          {canManage && problem.status === 'resolved' && (
            <div className="border-t border-gray-100 pt-5">
              {problem.root_cause && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">Root cause</p>
                  <p className="text-sm text-gray-700">{problem.root_cause}</p>
                </div>
              )}
              {problem.workaround && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">Workaround</p>
                  <p className="text-sm text-gray-700">{problem.workaround}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}