'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Subject {
  id: string;
  name: string;
  document_count?: number;
}

export default function Dashboard() {
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check session
  async function fetchSubjects(token: string) {
    try {
      const res = await fetch('/api/subjects', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) throw new Error("Request failed")
      
      const data = await res.json()
      setSubjects(data.data || [])
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

      fetchSubjects(session.access_token)
      setLoading(false)
    }

    init()
  }, [router])

  async function createSubject() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) return

    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error("Request failed")
    } catch (err) {
      console.error(err)
      setError("Something went wrong. Retry.")
    }

    setName('')
    fetchSubjects(session.access_token)
  }

  async function deleteSubject(id: string) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) return

    try {
      const res = await fetch('/api/subjects', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error("Request failed")
    } catch (err) {
      console.error(err)
      setError("Something went wrong. Retry.")
    }

    fetchSubjects(session.access_token)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
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
      <h1 className="text-2xl font-bold mb-6">Subjects</h1>

      <div className="flex gap-2 mb-6">
        <input
          className="border p-2 flex-1"
          placeholder="New Subject"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          onClick={createSubject}
          className="bg-blue-500 text-white px-4"
        >
          Add
        </button>
      </div>

      <ul className="space-y-2 mb-8">
        {subjects.map((s) => (
          <li
            key={s.id}
            className="border p-3 flex justify-between items-center"
          >
            <span
              onClick={() => router.push(`/subjects/${s.id}`)}
              className="cursor-pointer text-blue-600"
            >
              {s.name}
            </span>
            <button
              onClick={() => deleteSubject(s.id)}
              className="text-red-500"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={logout}
        className="bg-gray-800 text-white px-4 py-2"
      >
        Logout
      </button>
    </div>
  )
}
