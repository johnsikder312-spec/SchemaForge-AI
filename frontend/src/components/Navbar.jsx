import Container from './Container'

const links = [
  { label: 'Home', href: '#home' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
]

function Logo() {
  return (
    <a href="#home" className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-indigo-500 text-sm font-bold text-white">
        S
      </span>
      <span className="text-base font-semibold tracking-tight text-white">
        SchemaForge AI
      </span>
    </a>
  )
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </Container>
    </header>
  )
}
