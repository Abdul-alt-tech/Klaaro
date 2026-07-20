import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { token, email, password, fullName, role, organisationId } = await request.json()

    if (!token || !email || !password || !fullName || !role || !organisationId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify token is valid and not accepted
    const { data: invite } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('accepted', false)
      .single()

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid or already used invite token' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    let userId: string

    if (existingUser) {
      // Update their password
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password })
      userId = existingUser.id
    } else {
      // Create new auth user
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      userId = data.user.id
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingProfile) {
      // Update existing profile
      await supabaseAdmin
        .from('profiles')
        .update({
          full_name: fullName,
          role,
          organisation_id: organisationId,
        })
        .eq('id', userId)
    } else {
      // Create new profile
      await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          full_name: fullName,
          role,
          organisation_id: organisationId,
        })
    }

    // Mark invitation as accepted
    await supabaseAdmin
      .from('invitations')
      .update({ accepted: true })
      .eq('token', token)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Accept invite error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}