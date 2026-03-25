import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const subjectId = searchParams.get('subject_id') || undefined

    let subjectRows
    let subjectError

    if (subjectId) {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .eq('user_id', user.id)
        .limit(1)

      subjectRows = data
      subjectError = error
    } else {
        const { data, error } = await supabase
          .from('subjects')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        subjectRows = data
        subjectError = error
    }

    if (subjectError || !subjectRows || subjectRows.length === 0) {
      return NextResponse.json(
        { error: 'Could not fetch active subject for user' },
        { status: 500 }
      )
    }

    const subject = subjectRows[0]

    const { data: preps, error: prepsError } = await supabase
        .from('preps')
        .select('id, unit, content, created_at')
        .eq('subject_id', subject.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

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

