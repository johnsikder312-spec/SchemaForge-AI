import Container from './Container'

export default function Footer() {
  return (
    <footer className="border-t border-slate-900 py-8">
      <Container className="flex flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row">
        <span>SchemaForge AI</span>
        <span>Turn your ideas into databases.</span>
      </Container>
    </footer>
  )
}
