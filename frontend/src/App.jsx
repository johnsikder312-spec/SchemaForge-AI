import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [status, setStatus] = useState('checking...')

  useEffect(() => {
    fetch(`${API_URL}/`)
      .then((res) => res.json())
      .then((data) => setStatus(data.message))
      .catch(() => setStatus('backend unreachable'))
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold tracking-tight">SchemaForge AI</h1>
      <p className="text-slate-400">
        Describe an app idea in natural language. Schema generation comes later.
      </p>
      <span className="rounded-full bg-slate-800 px-4 py-1 text-sm">
        Backend: {status}
      </span>
    </div>
  )
}

export default App
