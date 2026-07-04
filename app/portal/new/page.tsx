'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Category = {
  id: string
  name: string
  department: string
}

export default function NewRequestPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('service_request')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*').order('name')
      setCategories(data || [])
    }
    fetchCategories()
  }, [supabase])

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !categoryId) {
      setError('Please fill in all fields before submitting.')
      return
    }

    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Step 1 — Call AI triage
    let aiCategory = 'Other'
    let aiPriority = 'P3'

    try {
      const triageResponse = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: title.trim(), 
          description: description.trim() 
        })
      })

      const triageData = await triageResponse.json()
      console.log('Triage response:', triageData)

      if (triageData.category) aiCategory = triageData.category
      if (triageData.priority) aiPriority = triageData.priority

    } catch (e) {
      console.error('Triage failed:', e)
    }

    // Step 2 — Insert ticket using the user selected categoryId
    // AI suggestion stored separately for reference
    const { error: insertError } = await supabase.from('tickets').insert({
      title: title.trim(),
      description: description.trim(),
      type,
      category_id: categoryId,
      submitted_by: user.id,
      status: 'open',
      priority: aiPriority,
      ai_suggested_category: aiCategory,
      ai_suggested_priority: aiPriority,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/portal')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Submit a Request</h2>
        <p className="text-gray-500 text-sm mt-1">
          Describe your issue or request and we&apos;ll get back to you
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        {/* Request type toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Request type
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setType('service_request')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                type === 'service_request'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'
              }`}
            >
              Service Request
            </button>
            <button
              onClick={() => setType('incident')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                type === 'incident'
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-red-400'
              }`}
            >
              Incident
            </button>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief summary of your request"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your issue in detail — what happened, when it started, what you've already tried"
            rows={5}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {loading ? 'Analysing and submitting...' : 'Submit Request'}
        </button>
      </div>
    </div>
  )
}