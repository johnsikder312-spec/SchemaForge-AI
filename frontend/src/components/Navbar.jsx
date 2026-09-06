import Container from './Container'

const anchors = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
]

function Logo({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2"
      aria-label="SchemaForge AI — go to workspace"
    >
      <span className="grid h-8 w-8 place-items-center rounded-md bg-indigo-500 text-sm font-bold text-white">
        S
      </span>
      <span className="text-base font-semibold tracking-tight text-white">
        SchemaForge AI
      </span>
    </button>
  )
}

function ThemeToggle({ theme, onToggle }) {
  const next = theme === 'light' ? 'dark' : 'light'
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="rounded-md p-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
    >
      {theme === 'light' ? (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      )}
    </button>
  )
}

export default function Navbar({
  view = 'workspace',
  onNavigate = () => {},
  theme = 'dark',
  onToggleTheme = () => {},
}) {
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
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Primary">
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
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </nav>
      </Container>
    </header>
  )
}
