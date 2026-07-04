'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Metrics = {
  totalOpen: number
  totalInProgress: number
  totalResolvedToday: number
  totalAll: number
  p1Count: number
  p2Count: number
  slaBreached: number
  avgResolutionHours: number | null
}

type RecentTicket = {
  id: string
  title: string
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

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchDashboard = async () => {
      // Fetch all tickets for metric calculation
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id, status, priority, created_at, resolved_at, sla_breach_at')

      if (!tickets) return

      const now = new Date()
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const totalOpen = tickets.filter(t => t.status === 'open').length
      const totalInProgress = tickets.filter(t => t.status === 'in_progress').length
      const totalResolvedToday = tickets.filter(t =>
        t.status === 'resolved' &&
        t.resolved_at &&
        new Date(t.resolved_at) >= todayStart
      ).length
      const totalAll = tickets.length
      const p1Count = tickets.filter(t => t.priority === 'P1').length
      const p2Count = tickets.filter(t => t.priority === 'P2').length
      const slaBreached = tickets.filter(t =>
        t.sla_breach_at && new Date(t.sla_breach_at) < now
      ).length

      // Average resolution time in hours
      const resolved = tickets.filter(t => t.resolved_at && t.created_at)
      const avgMs = resolved.length > 0
        ? resolved.reduce((sum, t) => {
            return sum + (new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime())
          }, 0) / resolved.length
        : null
      const avgResolutionHours = avgMs ? Math.round(avgMs / (1000 * 60 * 60) * 10) / 10 : null

      setMetrics({
        totalOpen,
        totalInProgress,
        totalResolvedToday,
        totalAll,
        p1Count,
        p2Count,
        slaBreached,
        avgResolutionHours
      })

      // Fetch 5 most recent tickets for the activity feed
      const { data: recent } = await supabase
        .from('tickets')
        .select('id, title, status, priority, created_at, categories(name)')
        .order('created_at', { ascending: false })
        .limit(5)

      const normalizedRecent = (recent || []).map((ticket) => ({
        ...ticket,
        categories: Array.isArray(ticket.categories)
          ? ticket.categories[0] ?? null
          : ticket.categories,
      }))

      setRecentTickets(normalizedRecent)
      setLoading(false)
    }

    fetchDashboard()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    )
  }

  const slaComplianceRate = metrics && metrics.totalAll > 0
    ? Math.round(((metrics.totalAll - metrics.slaBreached) / metrics.totalAll) * 100)
    : 100

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Operations Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">
            Live overview of IT service desk performance
          </p>
        </div>
        <Link
          href="/agent"
          className="text-sm text-emerald-600 hover:underline"
        >
          ← Back to queue
        </Link>
      </div>

      {/* Key metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
            Open Tickets
          </p>
          <p className="text-3xl font-bold text-gray-900">{metrics?.totalOpen}</p>
          <p className="text-xs text-gray-400 mt-1">awaiting action</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
            In Progress
          </p>
          <p className="text-3xl font-bold text-yellow-600">{metrics?.totalInProgress}</p>
          <p className="text-xs text-gray-400 mt-1">being worked on</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
            Resolved Today
          </p>
          <p className="text-3xl font-bold text-emerald-600">{metrics?.totalResolvedToday}</p>
          <p className="text-xs text-gray-400 mt-1">since midnight</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
            SLA Compliance
          </p>
          <p className={`text-3xl font-bold ${slaComplianceRate >= 80 ? 'text-emerald-600' : 'text-red-500'}`}>
            {slaComplianceRate}%
          </p>
          <p className="text-xs text-gray-400 mt-1">of all tickets</p>
        </div>
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <p className="text-xs text-red-600 font-medium uppercase tracking-wide mb-1">
            P1 Critical
          </p>
          <p className="text-3xl font-bold text-red-600">{metrics?.p1Count}</p>
          <p className="text-xs text-red-400 mt-1">critical tickets</p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <p className="text-xs text-orange-600 font-medium uppercase tracking-wide mb-1">
            P2 High
          </p>
          <p className="text-3xl font-bold text-orange-600">{metrics?.p2Count}</p>
          <p className="text-xs text-orange-400 mt-1">high priority</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
            SLA Breached
          </p>
          <p className={`text-3xl font-bold ${metrics?.slaBreached ? 'text-red-500' : 'text-gray-900'}`}>
            {metrics?.slaBreached}
          </p>
          <p className="text-xs text-gray-400 mt-1">past deadline</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
            Avg Resolution
          </p>
          <p className="text-3xl font-bold text-gray-900">
            {metrics?.avgResolutionHours !== null ? `${metrics?.avgResolutionHours}h` : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">hours per ticket</p>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {recentTickets.length === 0 ? (
          <p className="text-gray-400 text-sm">No tickets yet</p>
        ) : (
          <div className="space-y-3">
            {recentTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/agent/ticket/${ticket.id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {ticket.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {ticket.categories?.name || 'Uncategorised'} ·{' '}
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  {ticket.priority && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityColors[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  )}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[ticket.status]}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}