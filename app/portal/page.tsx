'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Ticket = {
  id: string
  title: string
  type: string
  status: string
  priority: string | null
  created_at: string
  categories: { name: string } | null
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
}

const priorityColors: Record<string, string> = {
  P1: 'bg-red-100 text-red-700',
  P2: 'bg-orange-100 text-orange-700',
  P3: 'bg-yellow-100 text-yellow-700',
  P4: 'bg-gray-100 text-gray-600',
}

export default function PortalPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchTickets = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('tickets')
        .select('id, title, type, status, priority, created_at, categories(name)')
        .eq('submitted_by', user.id)
        .order('created_at', { ascending: false })

      const normalized = (data || []).map((ticket) => ({
        ...ticket,
        categories: Array.isArray(ticket.categories)
          ? ticket.categories[0] ?? null
          : ticket.categories,
      }))

      setTickets(normalized)
      setLoading(false)
    }

    fetchTickets()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">Loading your requests...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Requests</h2>
          <p className="text-gray-500 text-sm mt-1">
            Track all your submitted requests and incidents
          </p>
        </div>
        <Link
          href="/portal/new"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New Request
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-lg">No requests yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Submit your first request to get started
          </p>
          <Link
            href="/portal/new"
            className="inline-block mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Submit a request
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/portal/ticket/${ticket.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-emerald-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {ticket.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {ticket.categories?.name || 'Uncategorised'} ·{' '}
                    {ticket.type === 'incident' ? 'Incident' : 'Service Request'} ·{' '}
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {ticket.priority && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${priorityColors[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  )}
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[ticket.status]}`}>
                    {ticket.status.replace('_', ' ')}
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