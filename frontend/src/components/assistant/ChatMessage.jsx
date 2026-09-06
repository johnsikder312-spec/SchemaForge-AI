// One message in the assistant chat. Roles: 'user', 'assistant', 'error'.
export default function ChatMessage({ role, text }) {
  const isUser = role === 'user'
  const isError = role === 'error'

  const base =
    'max-w-[85%] whitespace-pre-line rounded-lg px-3 py-2 text-sm leading-relaxed'
  const styles = isUser
    ? 'self-end bg-indigo-500 text-white'
    : isError
      ? 'self-start border border-red-900/60 bg-red-950/40 text-red-300'
      : 'self-start bg-slate-800 text-slate-200'

  return <div className={`${base} ${styles}`}>{text}</div>
}
