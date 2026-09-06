import Container from './Container'
import IdeaComposer from './IdeaComposer'
import ExampleGrid from './ExampleGrid'

// Homepage hero: heading, description, idea composer, and example cards.
export default function Hero({ idea, onIdeaChange, onGenerate }) {
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

        <div
          className="animate-fade-up mx-auto mt-10 max-w-2xl"
          style={{ animationDelay: '80ms' }}
        >
          <IdeaComposer
            value={idea}
            onChange={onIdeaChange}
            onGenerate={onGenerate}
          />
        </div>

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
