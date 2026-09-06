import { useCallback, useState } from 'react'

const STORAGE_KEY = 'schemaforge-theme'

function currentTheme() {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.getAttribute('data-theme') === 'light'
    ? 'light'
    : 'dark'
}

/**
 * Light / dark theme. The initial value is set in index.html before paint
 * (stored choice, else OS preference); this hook toggles and persists it.
 */
export default function useTheme() {
  const [theme, setTheme] = useState(currentTheme)

  const setThemeValue = useCallback((next) => {
    setTheme(next)
    try {
      document.documentElement.setAttribute('data-theme', next)
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* storage unavailable — the attribute change still applies */
    }
  }, [])

  const toggle = useCallback(() => {
    setThemeValue(currentTheme() === 'light' ? 'dark' : 'light')
  }, [setThemeValue])

  return { theme, toggle }
}
