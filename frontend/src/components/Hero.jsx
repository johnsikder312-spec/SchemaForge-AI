import Container from './Container'
import IdeaComposer from './IdeaComposer'
import ExampleGrid from './ExampleGrid'
import SchemaViewer from './schema/SchemaViewer'
import ERDiagram from './er/ERDiagram'
import SqlView from './sql/SqlView'
import AssistantChat from './assistant/AssistantChat'
import SchemaEditor from './editor/SchemaEditor'
import AnalysisPanel from './analysis/AnalysisPanel'
import ProjectsBar from './projects/ProjectsBar'

// Homepage hero: heading, description, idea composer, result, and example cards.
export default function Hero({
  idea,
  onIdeaChange,
  onGenerate,
  loading,
  error,
  schema,
  sqlDialect,
  onSqlDialectChange,
  messages,
  assistantLoading,
  assistantError,
  onSendMessage,
  onEdit,
  editorSyncing,
  editorError,
  analysis,
  projects,
  onLoadProject,
}) {
  return (
    <section id="home" className="relative overflow-hidden">
      {/* Very subtle radial backdrop — no loud gradients. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12),transparent_60%)]"
      />
      <Container className="relative py-20 sm:py-28">
        <div className="animate-fade-up mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-400">
            Turn your ideas into databases.
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Turn Your Ideas Into Databases
          </h1>
          <p className="mt-5 text-base leading-relaxed text-slate-400 sm:text-lg">
            Describe your application in plain language and SchemaForge AI designs
            the database for you — tables, relationships, an ER diagram, and
            ready-to-run SQL.
          </p>
        </div>

        {projects ? (
          <div className="mx-auto mt-10 max-w-2xl">
            <ProjectsBar
              projects={projects}
              schema={schema}
              description={idea}
              sqlDialect={sqlDialect}
              onLoadProject={onLoadProject}
              onNewProject={() => {}}
            />
          </div>
        ) : null}

        <div
          className="animate-fade-up mx-auto mt-6 max-w-2xl"
          style={{ animationDelay: '80ms' }}
        >
          <IdeaComposer
            value={idea}
            onChange={onIdeaChange}
            onGenerate={onGenerate}
            loading={loading}
            error={error}
          />
        </div>

        <div className="mt-10">
          <SchemaViewer schema={schema} loading={loading} />
        </div>

        {!loading && schema ? (
          <div className="mt-8">
            <AnalysisPanel
              findings={analysis.findings}
              counts={analysis.counts}
              loading={analysis.loading}
              error={analysis.error}
              onRefresh={analysis.refresh}
            />
          </div>
        ) : null}

        {!loading && schema ? (
          <div className="mt-8">
            <SchemaEditor
              schema={schema}
              onEdit={onEdit}
              syncing={editorSyncing}
              error={editorError}
            />
          </div>
        ) : null}

        {!loading && schema ? (
          <div className="mt-8">
            <AssistantChat
              messages={messages}
              loading={assistantLoading}
              error={assistantError}
              onSend={onSendMessage}
            />
          </div>
        ) : null}

        {!loading && schema ? (
          <div className="mt-8">
            <ERDiagram schema={schema} />
          </div>
        ) : null}

        {!loading && schema?.sql && Object.keys(schema.sql).length > 0 ? (
          <div className="mt-8">
            <SqlView
              sql={schema.sql}
              dialect={sqlDialect}
              onDialectChange={onSqlDialectChange}
            />
          </div>
        ) : null}

        <div
          className="animate-fade-up mt-14"
          style={{ animationDelay: '160ms' }}
        >
          <ExampleGrid onPick={onIdeaChange} />
        </div>
      </Container>
    </section>
  )
}
