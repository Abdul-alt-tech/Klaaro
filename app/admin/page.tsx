'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Organisation = {
  id: string
  name: string
  plan: string
}

type Category = {
  id: string
  name: string
  department: string | null
}

type SlaRule = {
  id: string
  priority: string
  response_time_minutes: number
  resolution_time_minutes: number
}

type TeamMember = {
  id: string
  full_name: string
  role: string
  department: string | null
}

export default function AdminPage() {
  const [organisation, setOrganisation] = useState<Organisation | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [slaRules, setSlaRules] = useState<SlaRule[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Category form
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDept, setNewCategoryDept] = useState('')

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('organisation_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organisation_id) return

    const [orgData, catData, slaData, teamData] = await Promise.all([
      supabase.from('organisations').select('id, name, plan').eq('id', profile.organisation_id).single(),
      supabase.from('categories').select('*').eq('organisation_id', profile.organisation_id).order('name'),
      supabase.from('sla_rules').select('*').eq('organisation_id', profile.organisation_id).order('priority'),
      supabase.from('profiles').select('id, full_name, role, department').eq('organisation_id', profile.organisation_id).order('full_name'),
    ])

    setOrganisation(orgData.data)
    setCategories(catData.data || [])
    setSlaRules(slaData.data || [])
    setTeamMembers(teamData.data || [])
    setLoading(false)
  }

  const addCategory = async () => {
    if (!newCategoryName.trim()) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
      .from('profiles')
      .select('organisation_id')
      .eq('id', user!.id)
      .single()

    const { error } = await supabase.from('categories').insert({
      name: newCategoryName.trim(),
      department: newCategoryDept.trim() || null,
      organisation_id: profile?.organisation_id
    })

    if (error) {
      setMessage('Error adding category: ' + error.message)
    } else {
      setNewCategoryName('')
      setNewCategoryDept('')
      setMessage('Category added successfully.')
      fetchData()
    }
    setSaving(false)
  }

  const deleteCategory = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id)
    fetchData()
  }

  const updateSlaRule = async (id: string, field: string, value: number) => {
    await supabase.from('sla_rules').update({ [field]: value }).eq('id', id)
    fetchData()
  }

  const planColors: Record<string, string> = {
    starter: 'bg-gray-100 text-gray-600',
    professional: 'bg-blue-100 text-blue-700',
    business: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-emerald-100 text-emerald-700',
  }

  const roleColors: Record<string, string> = {
    end_user: 'bg-gray-100 text-gray-600',
    agent: 'bg-blue-100 text-blue-700',
    admin: 'bg-purple-100 text-purple-700',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {organisation?.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${planColors[organisation?.plan || 'professional']}`}>
              {organisation?.plan}
            </span>
            <span className="text-sm text-gray-500">
              {teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <Link
          href="/admin/invite"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Invite team member
        </Link>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-sm text-emerald-700">{message}</p>
        </div>
      )}

      {/* Team members */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Team members</h3>
        {teamMembers.length === 0 ? (
          <p className="text-sm text-gray-400">No team members yet. Invite your first team member to get started.</p>
        ) : (
          <div className="space-y-2">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.full_name}</p>
                  <p className="text-xs text-gray-500">{member.department || 'No department'}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColors[member.role]}`}>
                  {member.role.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Ticket categories</h3>
        <div className="space-y-2 mb-4">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                <p className="text-xs text-gray-500">{cat.department || 'No department'}</p>
              </div>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Add category form */}
        <div className="flex gap-3 pt-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Category name"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="text"
            value={newCategoryDept}
            onChange={(e) => setNewCategoryDept(e.target.value)}
            placeholder="Department (optional)"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={addCategory}
            disabled={saving || !newCategoryName.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* SLA Rules */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-1">SLA rules</h3>
        <p className="text-xs text-gray-500 mb-4">Set response and resolution time targets in minutes for each priority level.</p>
        <div className="space-y-3">
          {slaRules.map((rule) => (
            <div key={rule.id} className="grid grid-cols-3 gap-4 items-center py-2 border-b border-gray-100 last:border-0">
              <div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  rule.priority === 'P1' ? 'bg-red-100 text-red-700' :
                  rule.priority === 'P2' ? 'bg-orange-100 text-orange-700' :
                  rule.priority === 'P3' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {rule.priority}
                </span>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Response (minutes)</label>
                <input
                  type="number"
                  defaultValue={rule.response_time_minutes}
                  onBlur={(e) => updateSlaRule(rule.id, 'response_time_minutes', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Resolution (minutes)</label>
                <input
                  type="number"
                  defaultValue={rule.resolution_time_minutes}
                  onBlur={(e) => updateSlaRule(rule.id, 'resolution_time_minutes', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}