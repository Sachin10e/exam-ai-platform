import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET notes
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const subject_id = searchParams.get('subject_id')

  if (!subject_id) {
    return NextResponse.json({ error: 'Missing subject' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
export async function POST(req: Request) {
  const supabase = await createClient()

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await req.json()

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Deleted' })
}
