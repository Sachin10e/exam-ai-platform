'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SubjectPage() {
  const params = useParams()
  const router = useRouter()

  const subjectId = params.id as string

  const [notes, setNotes] = useState<any[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      fetchNotes(session.access_token)
      setLoading(false)
    }

    init()
  }, [router])

  async function fetchNotes(token: string) {
    const res = await fetch(`/api/notes?subject_id=${subjectId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await res.json()
    setNotes(data.data || [])
  }

  async function addNote() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) return

    await fetch('/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        subject_id: subjectId,
        content,
      }),
    })

    setContent('')
    fetchNotes(session.access_token)
  }

  async function deleteNote(noteId: string) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) return

    await fetch('/api/notes', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ id: noteId }),
    })

    fetchNotes(session.access_token)
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notes</h1>

      <textarea
        className="border p-2 w-full mb-4"
        placeholder="Write note..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <button
        onClick={addNote}
        className="bg-blue-500 text-white px-4 py-2 mb-6"
      >
        Add Note
      </button>

      <ul className="space-y-2">
        {notes.map((note) => (
          <li
            key={note.id}
            className="border p-3 flex justify-between items-center"
          >
            <span className="truncate max-w-xs">
              {note.content}
            </span>
            <button
              onClick={() => deleteNote(note.id)}
              className="text-red-500"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
