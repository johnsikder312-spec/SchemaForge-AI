// Reusable button. `variant` controls styling; all other props pass through.
const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium ' +
  'transition-colors duration-200 focus:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed ' +
  'disabled:opacity-50'

const variants = {
  primary: 'bg-indigo-500 text-white hover:bg-indigo-400',
  secondary:
    'border border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-600 hover:bg-slate-800',
  ghost: 'text-slate-300 hover:text-white hover:bg-slate-800',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
