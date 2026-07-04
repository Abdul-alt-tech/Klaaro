'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Ticket = {
  id: string
  title: string
  description: string
  type: string
  status: string
  priority: string | null
  created_at: string
  resolved_at: string | null
  categories: { name: string } | null
  ai_suggested_category: string | null
  ai_suggested_priority: string | null
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
}

export default function TicketDetailPage() {
  const { id } = useParams()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchTicket = async () => {
      const { data } = await supabase
        .from('tickets')
        .select('*, categories(name)')
        .eq('id', id)
        .single()

      setTicket(data)
      setLoading(false)
    }
    fetchTicket()
  }, [id, supabase])

  if (loading) {
    return <p className="text-gray-400 py-20 text-center">Loading ticket...</p>
  }

  if (!ticket) {
    return <p className="text-gray-400 py-20 text-center">Ticket not found.</p>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/portal"
        className="text-sm text-emerald-600 hover:underline mb-6 inline-block"
      >
        ← Back to My Requests
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900">{ticket.title}</h2>
          <span className={`text-xs font-medium px-3 py-1 rounded-full flex-shrink-0 ${statusColors[ticket.status]}`}>
            {ticket.status.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-gray-500">Type</p>
            <p className="font-medium text-gray-900 capitalize">
              {ticket.type.replace('_', ' ')}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Category</p>
            <p className="font-medium text-gray-900">
              {ticket.categories?.name || 'Uncategorised'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Priority</p>
            <p className="font-medium text-gray-900">
              {ticket.priority || 'Pending triage'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Submitted</p>
            <p className="font-medium text-gray-900">
              {new Date(ticket.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <p className="text-sm text-gray-500 mb-2">Description</p>
          <p className="text-gray-800 text-sm leading-relaxed">
            {ticket.description}
          </p>
        </div>

        {ticket.ai_suggested_category && (
          <div className="mt-5 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-xs font-medium text-emerald-700 mb-1">
              AI Triage Suggestion
            </p>
            <p className="text-sm text-emerald-800">
              Category: {ticket.ai_suggested_category} · Priority: {ticket.ai_suggested_priority}
            </p>
          </div>
        )}

        {ticket.resolved_at && (
          <div className="mt-5 bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Resolved</p>
            <p className="text-sm text-gray-700">
              {new Date(ticket.resolved_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}