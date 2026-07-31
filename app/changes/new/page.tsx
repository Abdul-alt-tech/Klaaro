'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NewChangePage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('standard')
  const [priority, setPriority] = useState('P3')
  const [implementationDate, setImplementationDate] = useState('')
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
      .from('change_requests')
      .insert({
        title: title.trim(),
        description: description.trim(),
        type,
        priority,
        status: 'submitted',
        submitted_by: user.id,
        submitted_by_name: profile?.full_name,
        organisation_id: profile?.organisation_id,
        implementation_date: implementationDate || null,
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/changes')
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/changes"
          className="text-sm text-emerald-600 hover:underline"
        >
          ← Back to Changes
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-1">
        Request a Change
      </h2>
      <p className="text-gray-500 text-sm mb-6">
        Submit a formal request for a change to IT systems or processes.
      </p>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        {/* Change type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Change type
          </label>
          <div className="flex gap-3">
            {['standard', 'normal', 'emergency'].map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors capitalize ${
                  type === t
                    ? t === 'emergency'
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Standard — routine low risk change. Normal — requires review and approval. Emergency — urgent change needed immediately.
          </p>
        </div>

        {/* Priority */}
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

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief summary of the change"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what is changing, why it is needed, what the impact will be, and how it can be reversed if something goes wrong"
            rows={5}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        {/* Implementation date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Planned implementation date
          </label>
          <input
            type="datetime-local"
            value={implementationDate}
            onChange={(e) => setImplementationDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Change Request'}
        </button>
      </div>
    </div>
  )
}