import Container from './Container'

export default function About() {
  return (
    <section id="about" className="border-t border-slate-900 py-20 sm:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            About
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base">
            SchemaForge AI is a developer tool for turning application ideas into
            well-structured relational database designs. It is built to remove the
            blank-page problem at the start of a project — so you can spend your
            time building features instead of drawing tables.
          </p>
        </div>
      </Container>
    </section>
  )
}
