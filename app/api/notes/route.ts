import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase(token: string) {
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

// GET notes
export async function GET(req: Request) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const { searchParams } = new URL(req.url)
  const subject_id = searchParams.get('subject_id')

  if (!token || !subject_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase(token)

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('subject_id', subject_id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// CREATE note
// CREATE note
export async function POST(req: Request) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase(token)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { subject_id, content } = await req.json()

  if (!subject_id || !content) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 })
  }

  const { error } = await supabase.from('notes').insert({
    subject_id,
    content,
    user_id: user.id
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Created' })
}
// DELETE note
export async function DELETE(req: Request) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase(token)

  const { id } = await req.json()

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Deleted' })
}
