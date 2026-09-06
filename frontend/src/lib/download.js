// Client-side file download helpers. Everything here runs in the browser on
// data already present on the page — no backend call, no secrets involved.

/**
 * Turn a project name into a safe, meaningful filename stem.
 * "Food Delivery Platform" -> "food-delivery-platform"
 */
export function slugify(name, fallback = 'schema') {
  const slug = String(name ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || fallback
}

/**
 * Trigger a browser download of `content` as `filename`.
 */
export function downloadText(filename, content, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
