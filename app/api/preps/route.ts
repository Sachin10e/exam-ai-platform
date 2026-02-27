import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getUserSupabase(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  )
}

export async function GET(req: Request) {
  try {
    const token =
      req.headers.get('authorization')?.replace('Bearer ', '') || ''
    const { searchParams } = new URL(req.url)
    const subjectId = searchParams.get('subject_id') || undefined

    // Prefer explicit subject_id, then current user's latest subject, then latest global
    let subjectRows
    let subjectError

    if (subjectId) {
      const { data, error } = await serviceSupabase
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .limit(1)

      subjectRows = data
      subjectError = error
    }

    if ((!subjectRows || subjectRows.length === 0) && token) {
      const userSupabase = getUserSupabase(token)

      const {
        data: { user },
      } = await userSupabase.auth.getUser()

      if (user) {
        const { data, error } = await userSupabase
          .from('subjects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        subjectRows = data
        subjectError = error
      }
    }

    if (!subjectRows || subjectRows.length === 0) {
      const { data, error } = await serviceSupabase
        .from('subjects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)

      subjectRows = data
      subjectError = error
    }

    if (subjectError || !subjectRows || subjectRows.length === 0) {
      return NextResponse.json(
        { error: 'Could not fetch latest subject' },
        { status: 500 }
      )
    }

    const subject = subjectRows[0]

    let preps
    let prepsError

    if (token) {
      const userSupabase = getUserSupabase(token)
      const { data, error } = await userSupabase
        .from('preps')
        .select('id, unit, content, created_at')
        .eq('subject_id', subject.id)
        .order('created_at', { ascending: false })
        .limit(10)

      preps = data
      prepsError = error
    } else {
      const { data, error } = await serviceSupabase
        .from('preps')
        .select('id, unit, content, created_at')
        .eq('subject_id', subject.id)
        .order('created_at', { ascending: false })
        .limit(10)

      preps = data
      prepsError = error
    }

    if (prepsError) {
      return NextResponse.json(
        { error: 'Could not fetch preps' },
        { status: 500 }
      )
    }

    return NextResponse.json({ preps: preps || [] })
  } catch (err) {
    console.error('Preps fetch error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

