import Navbar from './components/Navbar'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import About from './components/About'
import Footer from './components/Footer'
import useSchemaGenerator from './hooks/useSchemaGenerator'

export default function App() {
  const { idea, setIdea, loading, error, schema, generate } =
    useSchemaGenerator()

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main>
        <Hero
          idea={idea}
          onIdeaChange={setIdea}
          onGenerate={generate}
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
