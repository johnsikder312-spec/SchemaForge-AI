import { useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import About from './components/About'
import Footer from './components/Footer'

export default function App() {
  const [idea, setIdea] = useState('')

  // Phase 2: no backend / AI yet. Generation is a placeholder.
  const handleGenerate = () => {
    console.log('Generate Database clicked. Idea:', idea)
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main>
        <Hero idea={idea} onIdeaChange={setIdea} onGenerate={handleGenerate} />
        <HowItWorks />
        <About />
      </main>
      <Footer />
    </div>
  )
}
