'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Ticket = {
  id: string
  title: string
  type: string
  status: string
  priority: string | null
  created_at: string
  sla_breach_at: string | null
  submitted_by: string
  profiles: { full_name: string }[] | null
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

const priorityOrder: Record<string, number> = {
  P1: 1, P2: 2, P3: 3, P4: 4
}

export default function AgentQueuePage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('open')
  const supabase = createClient()

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true)

      let query = supabase
        .from('tickets')
        .select(`
          id, title, type, status, priority, created_at, sla_breach_at, submitted_by,
          profiles!tickets_submitted_by_fkey(full_name),
          categories(name)
        `)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data } = await query
      
      const normalized = (data || []).map((ticket) => ({
        ...ticket,
        categories: Array.isArray(ticket.categories)
          ? ticket.categories[0] ?? null
          : ticket.categories,
      }))

      // Sort by priority then date
      const sorted = normalized.sort((a, b) => {
        const pa = priorityOrder[a.priority || 'P4'] || 4
        const pb = priorityOrder[b.priority || 'P4'] || 4
        return pa - pb
      })

      setTickets(sorted)
      setLoading(false)
    }

    fetchTickets()
  }, [filter, supabase])

  const isSlaBreached = (breachAt: string | null) => {
    if (!breachAt) return false
    return new Date(breachAt) < new Date()
  }

  const isSlaWarning = (breachAt: string | null) => {
    if (!breachAt) return false
    const diff = new Date(breachAt).getTime() - new Date().getTime()
    return diff > 0 && diff < 60 * 60 * 1000 // within 1 hour
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ticket Queue</h2>
          <p className="text-gray-500 text-sm mt-1">
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} · sorted by priority
          </p>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2">
          {['open', 'in_progress', 'resolved', 'all'].map((f) => (
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
      </div>

      {loading ? (
        <p className="text-gray-400 py-20 text-center">Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400">No tickets found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/agent/ticket/${ticket.id}`}
              className={`block bg-white rounded-xl border p-5 hover:shadow-sm transition-all ${
                isSlaBreached(ticket.sla_breach_at)
                  ? 'border-red-300 bg-red-50'
                  : isSlaWarning(ticket.sla_breach_at)
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-gray-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {ticket.type === 'incident' && (
                      <span className="text-xs bg-red-100 text-red-700 font-medium px-2 py-0.5 rounded-full">
                        Incident
                      </span>
                    )}
                    {isSlaBreached(ticket.sla_breach_at) && (
                      <span className="text-xs bg-red-500 text-white font-medium px-2 py-0.5 rounded-full">
                        SLA Breached
                      </span>
                    )}
                    {isSlaWarning(ticket.sla_breach_at) && (
                      <span className="text-xs bg-orange-400 text-white font-medium px-2 py-0.5 rounded-full">
                        SLA Warning
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {ticket.categories?.name || 'Uncategorised'} ·{' '}
                    Submitted by {ticket.profiles?.[0]?.full_name || 'Unknown'} ·{' '}
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