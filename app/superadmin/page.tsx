'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Organisation = {
  id: string
  name: string
  plan: string
  status: string
  contact_email: string | null
  created_at: string
}

export default function SuperAdminPage() {
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [loading, setLoading] = useState(true)
  const [showOrgForm, setShowOrgForm] = useState(false)
  const [showUserForm, setShowUserForm] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<Organisation | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Org form state
  const [orgName, setOrgName] = useState('')
  const [orgPlan, setOrgPlan] = useState('professional')
  const [orgEmail, setOrgEmail] = useState('')

  // Admin user form state
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')

  const supabase = createClient()

  useEffect(() => {
    fetchOrganisations()
  }, [])

  const fetchOrganisations = async () => {
    const { data } = await supabase
      .from('organisations')
      .select('*')
      .order('created_at', { ascending: false })
    setOrganisations(data || [])
    setLoading(false)
  }

  const createOrganisation = async () => {
    if (!orgName.trim()) return
    setSaving(true)
    setMessage('')

    const response = await fetch('/api/admin/create-organisation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: orgName.trim(),
        plan: orgPlan,
        contactEmail: orgEmail.trim() || null
      })
    })

    const result = await response.json()

    if (!response.ok) {
      setMessage('Error creating organisation: ' + result.error)
      setSaving(false)
      return
    }

    setMessage('Organisation created successfully with default categories and SLA rules.')
    setOrgName('')
    setOrgEmail('')
    setOrgPlan('professional')
    setShowOrgForm(false)
    fetchOrganisations()
    setSaving(false)
  }

  const suspendOrganisation = async (orgId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
    await supabase
      .from('organisations')
      .update({ status: newStatus })
      .eq('id', orgId)
    fetchOrganisations()
  }

  const planColors: Record<string, string> = {
    starter: 'bg-gray-100 text-gray-600',
    professional: 'bg-blue-100 text-blue-700',
    business: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-emerald-100 text-emerald-700',
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Organisations</h2>
          <p className="text-gray-500 text-sm mt-1">
            {organisations.length} organisation{organisations.length !== 1 ? 's' : ''} on the platform
          </p>
        </div>
        <button
          onClick={() => { setShowOrgForm(true); setMessage('') }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New Organisation
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-emerald-700">{message}</p>
        </div>
      )}

      {/* Create organisation form */}
      {showOrgForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">New Organisation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Organisation name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="First National Bank"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Contact email
              </label>
              <input
                type="email"
                value={orgEmail}
                onChange={(e) => setOrgEmail(e.target.value)}
                placeholder="it@company.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Plan
              </label>
              <select
                value={orgPlan}
                onChange={(e) => setOrgPlan(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="business">Business</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={createOrganisation}
              disabled={saving || !orgName.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Organisation'}
            </button>
            <button
              onClick={() => setShowOrgForm(false)}
              className="bg-white border border-gray-300 text-gray-600 text-sm font-medium px-4 py-2 rounded-lg hover:border-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Organisations list */}
      {loading ? (
        <p className="text-gray-400 py-20 text-center">Loading organisations...</p>
      ) : organisations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400">No organisations yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Create your first organisation to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {organisations.map((org) => (
            <div
              key={org.id}
              className={`bg-white rounded-xl border p-5 ${
                org.status === 'suspended'
                  ? 'border-red-200 bg-red-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900">{org.name}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${planColors[org.plan]}`}>
                      {org.plan}
                    </span>
                    {org.status === 'suspended' && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        suspended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {org.contact_email || 'No contact email'} ·{' '}
                    Created {new Date(org.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">{org.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedOrg(org)
                      setShowUserForm(true)
                      setMessage('')
                    }}
                    className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Add admin user
                  </button>
                  <button
                    onClick={() => suspendOrganisation(org.id, org.status)}
                    className={`text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                      org.status === 'active'
                        ? 'border-red-300 text-red-600 hover:bg-red-50'
                        : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {org.status === 'active' ? 'Suspend' : 'Reactivate'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add admin user modal */}
      {showUserForm && selectedOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-md">
            <h3 className="font-semibold text-gray-900 mb-1">
              Add admin user
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Creating admin for {selectedOrg.name}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="John Banda"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Temporary password
                </label>
                <input
                  type="text"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {message && (
                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  {message}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={async () => {
                    if (!adminName.trim() || !adminEmail.trim() || !adminPassword.trim()) return
                    setSaving(true)
                    setMessage('')

                    const response = await fetch('/api/admin/create-user', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        email: adminEmail.trim(),
                        password: adminPassword.trim(),
                        fullName: adminName.trim(),
                        organisationId: selectedOrg.id
                      })
                    })

                    const result = await response.json()

                    if (!response.ok) {
                      setMessage('Error creating user: ' + result.error)
                      setSaving(false)
                      return
                    }

                    setMessage(`Admin account created. Email: ${adminEmail} — share the temporary password with them securely.`)
                    setAdminName('')
                    setAdminEmail('')
                    setAdminPassword('')
                    setSaving(false)
                  }}
                  disabled={saving || !adminName.trim() || !adminEmail.trim() || !adminPassword.trim()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create admin'}
                </button>
                <button
                  onClick={() => {
                    setShowUserForm(false)
                    setSelectedOrg(null)
                    setAdminName('')
                    setAdminEmail('')
                    setAdminPassword('')
                    setMessage('')
                  }}
                  className="flex-1 bg-white border border-gray-300 text-gray-600 text-sm font-medium py-2 rounded-lg hover:border-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}