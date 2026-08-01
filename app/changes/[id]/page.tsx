'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type ChangeRequest = {
  id: string
  title: string
  description: string
  type: string
  status: string
  priority: string | null
  submitted_by: string
  submitted_by_name: string | null
  approved_by: string | null
  implementation_date: string | null
  closure_notes: string | null
  created_at: string
  updated_at: string
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  implementing: 'bg-purple-100 text-purple-700',
  closed: 'bg-gray-100 text-gray-500',
}

const typeColors: Record<string, string> = {
  standard: 'bg-gray-100 text-gray-600',
  normal: 'bg-blue-100 text-blue-700',
  emergency: 'bg-red-100 text-red-700',
}

export default function ChangeDetailPage() {
  const { id } = useParams()
  const [change, setChange] = useState<ChangeRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [closureNotes, setClosureNotes] = useState('')
  const [userRole, setUserRole] = useState('')
  const [message, setMessage] = useState('')
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

      const { data: changeData } = await supabase
        .from('change_requests')
        .select('*')
        .eq('id', id)
        .single()

      setChange(changeData)
      if (changeData?.closure_notes) {
        setClosureNotes(changeData.closure_notes)
      }
      setLoading(false)
    }

    fetchData()
  }, [id, supabase])

  const updateStatus = async (newStatus: string) => {
    setSaving(true)
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()

    const updates: Record<string, string> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    if (newStatus === 'approved' || newStatus === 'rejected') {
      updates.approved_by = user!.id
    }

    if (newStatus === 'closed' && closureNotes.trim()) {
      updates.closure_notes = closureNotes.trim()
    }

    await supabase
      .from('change_requests')
      .update(updates)
      .eq('id', id)

    setChange((prev) => prev ? { ...prev, ...updates } : prev)
    setMessage(`Status updated to ${newStatus.replace('_', ' ')}.`)
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading change request...</p>
      </div>
    )
  }

  if (!change) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Change request not found.</p>
      </div>
    )
  }

  const canManage = userRole === 'agent' || userRole === 'admin'
  const canApprove = userRole === 'admin'

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
              <Link href="/changes" className="text-sm text-emerald-600 font-medium">
                Changes
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
          href="/changes"
          className="text-sm text-emerald-600 hover:underline mb-6 inline-block"
        >
          ← Back to Changes
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${typeColors[change.type]}`}>
                  {change.type}
                </span>
                {change.priority && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    change.priority === 'P1' ? 'bg-red-100 text-red-700' :
                    change.priority === 'P2' ? 'bg-orange-100 text-orange-700' :
                    change.priority === 'P3' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {change.priority}
                  </span>
                )}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[change.status]}`}>
                  {change.status.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">{change.title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Submitted by {change.submitted_by_name || 'Unknown'} ·{' '}
                {new Date(change.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-5">
            <p className="text-xs font-medium text-gray-500 mb-2">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed">{change.description}</p>
          </div>

          {change.implementation_date && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
              <p className="text-xs font-medium text-blue-700 mb-1">Planned implementation</p>
              <p className="text-sm text-blue-800">
                {new Date(change.implementation_date).toLocaleString()}
              </p>
            </div>
          )}

          {change.closure_notes && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
              <p className="text-xs font-medium text-gray-500 mb-1">Closure notes</p>
              <p className="text-sm text-gray-700">{change.closure_notes}</p>
            </div>
          )}

          {canManage && change.status !== 'closed' && change.status !== 'rejected' && (
            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs font-medium text-gray-500 mb-3">Update status</p>
              <div className="flex flex-wrap gap-2">
                {change.status === 'submitted' && (
                  <button
                    onClick={() => updateStatus('under_review')}
                    disabled={saving}
                    className="text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Mark under review
                  </button>
                )}

                {canApprove && change.status === 'under_review' && (
                  <>
                    <button
                      onClick={() => updateStatus('approved')}
                      disabled={saving}
                      className="text-sm bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus('rejected')}
                      disabled={saving}
                      className="text-sm bg-red-100 hover:bg-red-200 text-red-700 font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}

                {change.status === 'approved' && (
                  <button
                    onClick={() => updateStatus('implementing')}
                    disabled={saving}
                    className="text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Mark implementing
                  </button>
                )}

                {change.status === 'implementing' && (
                  <div className="w-full space-y-3">
                    <textarea
                      value={closureNotes}
                      onChange={(e) => setClosureNotes(e.target.value)}
                      placeholder="Add closure notes — what was done, any issues encountered..."
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                    <button
                      onClick={() => updateStatus('closed')}
                      disabled={saving}
                      className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Close change
                    </button>
                  </div>
                )}
              </div>

              {message && (
                <p className="text-sm text-emerald-600 mt-3">{message}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}