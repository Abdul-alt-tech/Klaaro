import { NextRequest, NextResponse } from 'next/server'

const CATEGORIES = [
  'Account Access',
  'Network & Connectivity',
  'Hardware & Equipment',
  'Software & Applications',
  'Email & Communication',
  'HR Request',
  'Finance Request',
  'Facilities',
  'Other'
]

export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json()

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    const prompt = `You are an IT service desk triage assistant.

A user submitted this support ticket:
Title: ${title}
Description: ${description}

Respond with ONLY a valid JSON object, no markdown, no extra text, no explanation:
{
  "category": "<category>",
  "priority": "<priority>",
  "reasoning": "<one sentence>"
}

Category must be exactly one of:
${CATEGORIES.map(c => `- ${c}`).join('\n')}

Priority must be exactly one of:
- P1 (Critical - system down, many users affected, business cannot operate)
- P2 (High - major feature broken, significant impact on work)
- P3 (Medium - issue affects work but workaround exists)
- P4 (Low - minor issue or general question)`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 200,
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Groq API error:', errText)
      throw new Error(`Groq API returned ${response.status}`)
    }

    const groqData = await response.json()
    const text = groqData.choices?.[0]?.message?.content || ''

    console.log('Raw Groq response:', text)

    const cleaned = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    const validCategory = CATEGORIES.includes(parsed.category)
      ? parsed.category
      : 'Other'

    // Extract just the P1/P2/P3/P4 part in case AI returns the full description
    const priorityMatch = parsed.priority?.match(/^(P[1-4])/)
    const validPriority = priorityMatch ? priorityMatch[1] : 'P3'

    return NextResponse.json({
      category: validCategory,
      priority: validPriority,
      reasoning: parsed.reasoning || ''
    })

  } catch (error) {
    console.error('Triage error:', error)
    return NextResponse.json({
      category: 'Other',
      priority: 'P3',
      reasoning: 'Auto-triage unavailable'
    })
  }
}