import Navbar from './components/Navbar'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import About from './components/About'
import Footer from './components/Footer'
import useSchemaGenerator from './hooks/useSchemaGenerator'
import useSchemaAnalysis from './hooks/useSchemaAnalysis'

export default function App() {
  const {
    idea,
    setIdea,
    loading,
    error,
    schema,
    generate,
    messages,
    assistantLoading,
    assistantError,
    sendMessage,
    applyEdit,
    editorSyncing,
    editorError,
  } = useSchemaGenerator()

  const analysis = useSchemaAnalysis(schema)

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
          messages={messages}
          assistantLoading={assistantLoading}
          assistantError={assistantError}
          onSendMessage={sendMessage}
          onEdit={applyEdit}
          editorSyncing={editorSyncing}
          editorError={editorError}
          analysis={analysis}
        />
        <HowItWorks />
        <About />
      </main>
      <Footer />
    </div>
  )
}
