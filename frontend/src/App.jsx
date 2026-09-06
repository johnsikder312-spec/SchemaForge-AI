import { useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import About from './components/About'
import Footer from './components/Footer'
import Dashboard from './components/dashboard/Dashboard'
import useSchemaGenerator from './hooks/useSchemaGenerator'
import useSchemaAnalysis from './hooks/useSchemaAnalysis'
import useProjects from './hooks/useProjects'
import useTheme from './hooks/useTheme'

export default function App() {
  const {
    idea,
    setIdea,
    loading,
    error,
    schema,
    generate,
    reset,
    sqlDialect,
    setSqlDialect,
    loadSchema,
    messages,
    assistantLoading,
    assistantError,
    sendMessage,
    applyEdit,
    editorSyncing,
    editorError,
  } = useSchemaGenerator()

  const analysis = useSchemaAnalysis(schema)
  const projects = useProjects()
  const { theme, toggle: toggleTheme } = useTheme()
  const [view, setView] = useState('workspace')

  const loadProject = (project) => {
    setIdea(project.description || '')
    loadSchema(project.schema_data, project.sql_dialect)
  }

  const openProject = async (id) => {
    const project = await projects.open(id)
    loadProject(project)
    setView('workspace')
  }

  const createNewProject = () => {
    projects.clearCurrent()
    reset()
    setView('workspace')
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar
        view={view}
        onNavigate={setView}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <main>
        {view === 'dashboard' ? (
          <Dashboard
            projects={projects}
            onOpen={openProject}
            onCreateNew={createNewProject}
          />
        ) : (
          <>
            <Hero
              idea={idea}
              onIdeaChange={setIdea}
              onGenerate={generate}
              loading={loading}
              error={error}
              schema={schema}
              sqlDialect={sqlDialect}
              onSqlDialectChange={setSqlDialect}
              messages={messages}
              assistantLoading={assistantLoading}
              assistantError={assistantError}
              onSendMessage={sendMessage}
              onEdit={applyEdit}
              editorSyncing={editorSyncing}
              editorError={editorError}
              analysis={analysis}
              projects={projects}
              onLoadProject={loadProject}
              onNewProject={createNewProject}
            />
            <HowItWorks />
            <About />
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
