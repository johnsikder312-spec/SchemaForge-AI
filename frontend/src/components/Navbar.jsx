import Container from './Container'

const anchors = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
]

function Logo({ onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-indigo-500 text-sm font-bold text-white">
        S
      </span>
      <span className="text-base font-semibold tracking-tight text-white">
        SchemaForge AI
      </span>
    </button>
  )
}

export default function Navbar({ view = 'workspace', onNavigate = () => {} }) {
  const navBtn = (target, label) => (
    <button
      type="button"
      onClick={() => onNavigate(target)}
      aria-current={view === target ? 'page' : undefined}
      className={`rounded-md px-3 py-2 text-sm transition-colors ${
        view === target
          ? 'bg-slate-800 text-white'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {label}
    </button>
  )

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Logo onClick={() => onNavigate('workspace')} />
        <nav className="flex items-center gap-1 sm:gap-2">
          {navBtn('workspace', 'Workspace')}
          {navBtn('dashboard', 'Projects')}
          {view === 'workspace' &&
            anchors.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hidden rounded-md px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white sm:block"
              >
                {link.label}
              </a>
            ))}
        </nav>
      </Container>
    </header>
  )
}
