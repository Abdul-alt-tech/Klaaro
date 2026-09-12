import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email, fullName, role, department, organisationId } = await request.json()

    if (!email || !fullName || !role || !organisationId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Generate a unique token for this invite
    const token = randomBytes(32).toString('hex')

    // Store the invitation in the database
    const { error: inviteError } = await supabaseAdmin
      .from('invitations')
      .insert({
        email,
        role,
        organisation_id: organisationId,
        token,
        accepted: false,
      })

    if (inviteError) {
      return NextResponse.json(
        { error: inviteError.message },
        { status: 400 }
      )
    }

    // Send the invite email using Supabase Auth
    const { error: emailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: 'https://klaaro-ashy.vercel.app/auth/callback',
      data: {
        full_name: fullName,
        role,
        department,
        organisation_id: organisationId,
        invite_token: token,
      }
    })

    if (emailError) {
      return NextResponse.json(
        { error: emailError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Invite error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}