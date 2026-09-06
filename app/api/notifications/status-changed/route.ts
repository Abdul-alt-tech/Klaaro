import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { statusChangedEmail } from '@/lib/emailTemplates'

export async function POST(request: NextRequest) {
  try {
    const { submittedById, recipientName, ticketTitle, newStatus } = await request.json()

    if (!submittedById || !recipientName || !ticketTitle || !newStatus) {
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

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(submittedById)

    if (userError) {
      throw userError
    }

    const recipientEmail = userData.user?.email

    if (!recipientEmail) {
      return NextResponse.json({ skipped: true, reason: 'no email found' })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const ticketUrl = `${siteUrl}/portal`
    const { subject, html } = statusChangedEmail({
      ticketTitle,
      newStatus,
      recipientName,
      ticketUrl,
    })

    const sendResponse = await fetch(`${siteUrl}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: recipientEmail,
        subject,
        html,
      }),
    })

    return NextResponse.json({ sent: sendResponse.ok })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
