'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Note {
  id: string;
  title: string;
  created_at?: string;
  full_text?: string;
  content?: string;
}

export default function SubjectDetail({ params }: { params: { id: string } }) {
  const router = useRouter()

  const subjectId = params.id as string

  const [notes, setNotes] = useState<Note[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchNotes(token: string) {
    try {
      const res = await fetch(`/api/notes?subject_id=${subjectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) throw new Error("Request failed")

      const data = await res.json()
      setNotes(data.data || [])
    } catch (err) {
      console.error(err)
      setError("Something went wrong. Retry.")
    }
  }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  async function addNote() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) return

    try {
      const res = await fetch('/api/notes', {
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
      if (!res.ok) throw new Error("Request failed")
    } catch (err) {
      console.error(err)
      setError("Something went wrong. Retry.")
    }

    setContent('')
    fetchNotes(session.access_token)
  }

  async function deleteNote(noteId: string) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) return

    try {
      const res = await fetch('/api/notes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ id: noteId }),
      })
      if (!res.ok) throw new Error("Request failed")
    } catch (err) {
      console.error(err)
      setError("Something went wrong. Retry.")
    }

    fetchNotes(session.access_token)
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return (
    <div className="p-8 max-w-2xl mx-auto flex flex-col items-start gap-4">
      <p className="text-red-500 font-bold">{error}</p>
      <button onClick={() => window.location.reload()} className="bg-blue-500 text-white px-4 py-2 rounded">Retry</button>
    </div>
  )

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
