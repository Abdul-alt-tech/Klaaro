'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type ChangeRequest = {
  id: string
  title: string
  type: string
  status: string
  priority: string | null
  submitted_by_name: string | null
  implementation_date: string | null
  created_at: string
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

const priorityColors: Record<string, string> = {
  P1: 'bg-red-100 text-red-700',
  P2: 'bg-orange-100 text-orange-700',
  P3: 'bg-yellow-100 text-yellow-700',
  P4: 'bg-gray-100 text-gray-600',
}

export default function ChangesPage() {
  const [changes, setChanges] = useState<ChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    const fetchChanges = async () => {
      setLoading(true)

      let query = supabase
        .from('change_requests')
        .select('id, title, type, status, priority, submitted_by_name, implementation_date, created_at')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data } = await query
      setChanges(data || [])
      setLoading(false)
    }

    fetchChanges()
  }, [filter, supabase])

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Change Requests</h2>
          <p className="text-gray-500 text-sm mt-1">
            {changes.length} change request{changes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/changes/new"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New Change Request
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'submitted', 'under_review', 'approved', 'implementing', 'closed', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === f
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-400'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 py-20 text-center">Loading change requests...</p>
      ) : changes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-lg">No change requests found</p>
          <p className="text-gray-400 text-sm mt-1">
            Submit a change request to get started
          </p>
          <Link
            href="/changes/new"
            className="inline-block mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            New change request
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {changes.map((change) => (
            <Link
              key={change.id}
              href={`/changes/${change.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-emerald-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${typeColors[change.type]}`}>
                      {change.type}
                    </span>
                    {change.type === 'emergency' && (
                      <span className="text-xs bg-red-500 text-white font-medium px-2 py-0.5 rounded-full">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-gray-900 truncate">{change.title}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Submitted by {change.submitted_by_name || 'Unknown'} ·{' '}
                    {new Date(change.created_at).toLocaleDateString()}
                    {change.implementation_date && (
                      <> · Planned {new Date(change.implementation_date).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {change.priority && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${priorityColors[change.priority]}`}>
                      {change.priority}
                    </span>
                  )}
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[change.status]}`}>
                    {change.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}