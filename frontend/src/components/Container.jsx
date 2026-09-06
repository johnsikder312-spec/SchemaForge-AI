// Centered, width-constrained page wrapper used by every section.
export default function Container({ className = '', children }) {
  return (
    <div className={`mx-auto w-full max-w-5xl px-6 ${className}`}>{children}</div>
  )
}
