import Container from './Container'

const steps = [
  {
    step: '01',
    title: 'Describe your idea',
    body: 'Write a plain-language description of the application you want to build.',
  },
  {
    step: '02',
    title: 'AI designs the schema',
    body: 'SchemaForge identifies entities, fields, and how everything relates.',
  },
  {
    step: '03',
    title: 'Export and build',
    body: 'Review the ER diagram and copy production-ready SQL for your database.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-slate-900 py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            How It Works
          </h2>
          <p className="mt-3 text-sm text-slate-400 sm:text-base">
            Three steps from a sentence to a schema.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.step}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-6"
            >
              <span className="text-xs font-semibold text-indigo-400">
                {s.step}
              </span>
              <h3 className="mt-3 text-base font-semibold text-white">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
