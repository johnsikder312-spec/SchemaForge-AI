import { useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import About from './components/About'
import Footer from './components/Footer'
import { generateSchema } from './lib/api'

export default function App() {
  const [idea, setIdea] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [schema, setSchema] = useState(null)

  // Phase 3: send the description to the backend, which returns a dummy schema.
  const handleGenerate = async () => {
    const description = idea.trim()
    if (!description || loading) return

    setLoading(true)
    setError('')
    setSchema(null)
    try {
      const result = await generateSchema(description)
      setSchema(result)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main>
        <Hero
          idea={idea}
          onIdeaChange={setIdea}
          onGenerate={handleGenerate}
          loading={loading}
          error={error}
          schema={schema}
        />
        <HowItWorks />
        <About />
      </main>
      <Footer />
    </div>
  )
}
