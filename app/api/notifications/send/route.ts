import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html } = await request.json()

    if (
      typeof to !== 'string' ||
      !to.trim() ||
      typeof subject !== 'string' ||
      !subject.trim() ||
      typeof html !== 'string' ||
      !html.trim()
    ) {
      return NextResponse.json(
        { error: 'to, subject, and html are required' },
        { status: 400 }
      )
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Klaaro <klaaro@cradleaxis.com>',
        to,
        subject,
        html,
      }),
    })

    const responseData = await resendResponse.json()

    if (!resendResponse.ok) {
      return NextResponse.json(
        { error: responseData },
        { status: 500 }
      )
    }

    return NextResponse.json(responseData, { status: 200 })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
