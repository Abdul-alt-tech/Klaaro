import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { name, plan, contactEmail } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Organisation name is required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create the organisation
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organisations')
      .insert({
        name,
        plan: plan || 'professional',
        status: 'active',
        contact_email: contactEmail || null
      })
      .select()
      .single()

    if (orgError) {
      return NextResponse.json({ error: orgError.message }, { status: 400 })
    }

    // Seed default categories
    const { error: catError } = await supabaseAdmin.from('categories').insert([
      { name: 'Account Access', department: 'IT', organisation_id: org.id },
      { name: 'Network & Connectivity', department: 'IT', organisation_id: org.id },
      { name: 'Hardware & Equipment', department: 'IT', organisation_id: org.id },
      { name: 'Software & Applications', department: 'IT', organisation_id: org.id },
      { name: 'Email & Communication', department: 'IT', organisation_id: org.id },
      { name: 'HR Request', department: 'HR', organisation_id: org.id },
      { name: 'Finance Request', department: 'Finance', organisation_id: org.id },
      { name: 'Facilities', department: 'Facilities', organisation_id: org.id },
      { name: 'Other', department: 'General', organisation_id: org.id },
    ])

    if (catError) {
      console.error('Category seeding error:', catError)
    }

    // Seed default SLA rules
    const { error: slaError } = await supabaseAdmin.from('sla_rules').insert([
      { priority: 'P1', response_time_minutes: 15, resolution_time_minutes: 240, organisation_id: org.id },
      { priority: 'P2', response_time_minutes: 30, resolution_time_minutes: 480, organisation_id: org.id },
      { priority: 'P3', response_time_minutes: 120, resolution_time_minutes: 1440, organisation_id: org.id },
      { priority: 'P4', response_time_minutes: 240, resolution_time_minutes: 2880, organisation_id: org.id },
    ])

    if (slaError) {
      console.error('SLA seeding error:', slaError)
    }

    return NextResponse.json({ success: true, organisation: org })

  } catch (error) {
    console.error('Create organisation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
