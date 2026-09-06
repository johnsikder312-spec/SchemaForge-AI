import { useState } from 'react'
import { generateSchema } from '../lib/api'

/**
 * Owns all schema-generation state in one place:
 * the idea text, request status, error message, and the returned schema.
 */
export default function useSchemaGenerator() {
  const [idea, setIdea] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [schema, setSchema] = useState(null)

  const generate = async () => {
    const description = idea.trim()
    if (!description || loading) return

    setLoading(true)
    setError('')
    setSchema(null)
    try {
      const result = await generateSchema(description)
      setSchema(result)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return { idea, setIdea, loading, error, schema, generate }
}
