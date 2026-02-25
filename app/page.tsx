'use client'

import { useState } from 'react'

export default function Home() {
  const [question, setQuestion] = useState('')
  const [marks, setMarks] = useState(5)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)

  const askQuestion = async () => {
    setLoading(true)
    setAnswer('')

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, marks }),
    })

    const data = await res.json()
    setAnswer(data.answer || data.error)
    setLoading(false)
  }

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Exam AI Platform</h1>

      <textarea
        rows={4}
        placeholder="Enter your question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        style={{ width: '100%', marginBottom: 20 }}
      />

      <select
        value={marks}
        onChange={(e) => setMarks(Number(e.target.value))}
      >
        <option value={2}>2 Marks</option>
        <option value={5}>5 Marks</option>
        <option value={10}>10 Marks</option>
      </select>

      <button
        onClick={askQuestion}
        style={{ marginLeft: 20 }}
      >
        Ask
      </button>

      {loading && <p>Generating...</p>}

      <pre style={{ whiteSpace: 'pre-wrap', marginTop: 30 }}>
        {answer}
      </pre>
    </div>
  )
}
