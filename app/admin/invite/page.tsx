'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function InvitePage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('end_user')
  const [department, setDepartment] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [organisationId, setOrganisationId] = useState('')
  const [invites, setInvites] = useState<any[]>([])

  const supabase = createClient()

  useEffect(() => {
    const fetchOrgId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organisation_id')
        .eq('id', user.id)
        .single()

      if (profile?.organisation_id) {
        setOrganisationId(profile.organisation_id)
        fetchInvites(profile.organisation_id)
      }
    }
    fetchOrgId()
  }, [])

  const fetchInvites = async (orgId: string) => {
    const { data } = await supabase
      .from('invitations')
      .select('*')
      .eq('organisation_id', orgId)
      .order('created_at', { ascending: false })
    setInvites(data || [])
  }

  const sendInvite = async () => {
    if (!fullName.trim() || !email.trim() || !organisationId) return
    setSaving(true)
    setMessage('')
    setError('')

    const response = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        fullName: fullName.trim(),
        role,
        department: department.trim() || null,
        organisationId
      })
    })

    const result = await response.json()

    if (!response.ok) {
      setError('Error sending invite: ' + result.error)
      setSaving(false)
      return
    }

    setMessage(`Invite sent to ${email} successfully.`)
    setFullName('')
    setEmail('')
    setRole('end_user')
    setDepartment('')
    fetchInvites(organisationId)
    setSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin"
          className="text-sm text-emerald-600 hover:underline"
        >
          ← Back to overview
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-1">Invite team member</h2>
      <p className="text-gray-500 text-sm mb-6">
        They will receive an email with a link to set their password and join your organisation.
      </p>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Mwansa Banda"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mwansa@company.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="end_user">End user</option>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="IT, HR, Finance..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {message && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <p className="text-sm text-emerald-700">{message}</p>
            </div>
          )}

          <button
            onClick={sendInvite}
            disabled={saving || !fullName.trim() || !email.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {saving ? 'Sending invite...' : 'Send invite'}
          </button>
        </div>
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Sent invites</h3>
          <div className="space-y-2">
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{invite.email}</p>
                  <p className="text-xs text-gray-500">
                    {invite.role.replace('_', ' ')} ·{' '}
                    {invite.accepted ? 'Accepted' : 'Pending'} ·{' '}
                    Expires {new Date(invite.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  invite.accepted
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {invite.accepted ? 'accepted' : 'pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}