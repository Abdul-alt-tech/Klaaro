'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Problem = {
  id: string
  title: string
  status: string
  priority: string | null
  submitted_by_name: string | null
  workaround: string | null
  created_at: string
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  investigating: 'bg-yellow-100 text-yellow-700',
  known_error: 'bg-orange-100 text-orange-700',
  resolved: 'bg-emerald-100 text-emerald-700',
}

const priorityColors: Record<string, string> = {
  P1: 'bg-red-100 text-red-700',
  P2: 'bg-orange-100 text-orange-700',
  P3: 'bg-yellow-100 text-yellow-700',
  P4: 'bg-gray-100 text-gray-600',
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true)

      let query = supabase
        .from('problems')
        .select('id, title, status, priority, submitted_by_name, workaround, created_at')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data } = await query
      setProblems(data || [])
      setLoading(false)
    }

    fetchProblems()
  }, [filter, supabase])

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
              const supabase = createClient()
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}
            className="text-sm text-gray-500 hover:text-red-500"
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Problems</h2>
            <p className="text-gray-500 text-sm mt-1">
              {problems.length} problem{problems.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/problems/new"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Raise Problem
          </Link>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'open', 'investigating', 'known_error', 'resolved'].map((f) => (
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
          <p className="text-gray-400 py-20 text-center">Loading problems...</p>
        ) : problems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-lg">No problems found</p>
            <p className="text-gray-400 text-sm mt-1">
              Raise a problem record to start investigating recurring issues
            </p>
            <Link
              href="/problems/new"
              className="inline-block mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Raise a problem
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {problems.map((problem) => (
              <Link
                key={problem.id}
                href={`/problems/${problem.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-emerald-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {problem.workaround && (
                        <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">
                          Workaround available
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900 truncate">{problem.title}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Raised by {problem.submitted_by_name || 'Unknown'} ·{' '}
                      {new Date(problem.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {problem.priority && (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${priorityColors[problem.priority]}`}>
                        {problem.priority}
                      </span>
                    )}
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[problem.status]}`}>
                      {problem.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}