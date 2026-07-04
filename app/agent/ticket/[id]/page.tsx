'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
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
  sla_breach_at: string | null
  ai_suggested_category: string | null
  ai_suggested_priority: string | null
  profiles: { full_name: string; department: string | null }[] | null
  categories: { name: string }[] | null
}

type Comment = {
  id: string
  content: string
  is_internal: boolean
  created_at: string
  profiles: { full_name: string }[] | null
}

export default function AgentTicketPage() {
  const { id } = useParams()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: ticketData } = await supabase
        .from('tickets')
        .select(`
          *,
          profiles!tickets_submitted_by_fkey(full_name, department),
          categories(name)
        `)
        .eq('id', id)
        .single()

      const { data: commentData } = await supabase
        .from('ticket_comments')
        .select('*, profiles(full_name)')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true })

      setTicket(ticketData)
      setComments(commentData || [])
      setLoading(false)
    }
    fetchData()
  }, [id, supabase])

  const updateTicket = async (updates: Partial<Ticket>) => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    // If resolving, set resolved_at timestamp
    if (updates.status === 'resolved') {
      updates.resolved_at = new Date().toISOString()
    }

    await supabase.from('tickets').update(updates).eq('id', id)

    // Log to audit trail
    await supabase.from('audit_logs').insert({
      ticket_id: id,
      action: `Status updated to ${updates.status || updates.priority}`,
      performed_by: user?.id,
      new_value: JSON.stringify(updates),
    })

    setTicket((prev) => prev ? { ...prev, ...updates } : prev)
    setSaving(false)
  }

  const addComment = async () => {
    if (!newComment.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { data } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id: id,
        author_id: user?.id,
        content: newComment.trim(),
        is_internal: isInternal,
      })
      .select('*, profiles(full_name)')
      .single()

    if (data) setComments((prev) => [...prev, data])
    setNewComment('')
    setSaving(false)
  }

  if (loading) return <p className="text-gray-400 py-20 text-center">Loading ticket...</p>
  if (!ticket) return <p className="text-gray-400 py-20 text-center">Ticket not found.</p>

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/agent"
        className="text-sm text-emerald-600 hover:underline mb-6 inline-block"
      >
        ← Back to Queue
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {ticket.type === 'incident' && (
                <span className="text-xs bg-red-100 text-red-700 font-medium px-2 py-0.5 rounded-full">
                  Incident
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{ticket.title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Submitted by {ticket.profiles?.[0]?.full_name || 'Unknown'}
              {ticket.profiles?.[0]?.department ? ` · ${ticket.profiles[0].department}` : ''} ·{' '}
              {new Date(ticket.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-gray-50 rounded-xl p-4 mb-5">
          <p className="text-sm text-gray-700 leading-relaxed">{ticket.description}</p>
        </div>

        {/* AI suggestion banner */}
        {ticket.ai_suggested_priority && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
            <p className="text-xs font-medium text-emerald-700 mb-1">AI Triage Suggestion</p>
            <p className="text-sm text-emerald-800">
              Category: {ticket.ai_suggested_category} · Priority: {ticket.ai_suggested_priority}
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={ticket.status}
              onChange={(e) => updateTicket({ status: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
            <select
              value={ticket.priority || ''}
              onChange={(e) => updateTicket({ priority: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Not set</option>
              <option value="P1">P1 — Critical</option>
              <option value="P2">P2 — High</option>
              <option value="P3">P3 — Medium</option>
              <option value="P4">P4 — Low</option>
            </select>
          </div>
        </div>

        {saving && (
          <p className="text-xs text-emerald-600 mt-2">Saving...</p>
        )}
      </div>

      {/* Comments section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Notes & Updates
        </h3>

        {comments.length === 0 ? (
          <p className="text-sm text-gray-400 mb-4">No notes yet</p>
        ) : (
          <div className="space-y-3 mb-5">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`rounded-xl p-4 text-sm ${
                  comment.is_internal
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-700">
                    {comment.profiles?.[0]?.full_name || 'Agent'}
                  </span>
                  <div className="flex items-center gap-2">
                    {comment.is_internal && (
                      <span className="text-xs text-yellow-600 font-medium">
                        Internal note
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700">{comment.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add comment */}
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a note or update..."
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none mb-3"
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="rounded"
            />
            Internal note (agents only)
          </label>

          <button
            onClick={addComment}
            disabled={saving || !newComment.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            Add note
          </button>
        </div>
      </div>
    </div>
  )
}