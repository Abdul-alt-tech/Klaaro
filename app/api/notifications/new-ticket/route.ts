import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { newTicketEmail } from '@/lib/emailTemplates'

export async function POST(request: NextRequest) {
  try {
    const {
      ticketId,
      ticketTitle,
      category,
      priority,
      submittedByName,
      organisationId,
    } = await request.json()

    if (
      !ticketId ||
      !ticketTitle ||
      !category ||
      !priority ||
      !submittedByName ||
      !organisationId
    ) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('organisation_id', organisationId)
      .in('role', ['agent', 'admin'])

    if (profilesError) {
      throw profilesError
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ skipped: true, reason: 'no agents found' })
    }

    // Set NEXT_PUBLIC_SITE_URL in production; this fallback is for local development.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const ticketUrl = `${siteUrl}/agent`
    const { subject, html } = newTicketEmail({
      ticketTitle,
      category,
      priority,
      submittedByName,
      ticketUrl,
    })

    let sent = 0

    for (const profile of profiles) {
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id)

        if (userError || !userData.user?.email) {
          continue
        }

        const sendResponse = await fetch(`${siteUrl}/api/notifications/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: userData.user.email,
            subject,
            html,
          }),
        })

        if (sendResponse.ok) {
          sent += 1
        }
      } catch {
        // Ignore individual recipient failures so other notifications can continue.
      }
    }

    return NextResponse.json({ sent })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
