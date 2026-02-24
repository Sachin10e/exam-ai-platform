'use client'

import { useEffect, useState } from 'react'
import { getSession, signOut } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkSession() {
      const { data } = await getSession()

      if (!data.session) {
        router.push('/login')
      } else {
        setLoading(false)
      }
    }

    checkSession()
  }, [router])

  async function handleLogout() {
    await signOut()
    router.push('/login')
  }

  if (loading) return <p>Checking session...</p>

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2"
      >
        Logout
      </button>
    </div>
  )
}
