import { useState } from 'react'
import { generateSchema, modifySchema } from '../lib/api'

let messageId = 0
const nextId = () => `m${++messageId}`

/**
 * Owns all schema state in one place: the idea text, the generated schema,
 * request status, and the AI assistant's chat history for this session.
 */
export default function useSchemaGenerator() {
  const [idea, setIdea] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [schema, setSchema] = useState(null)

  // AI assistant (schema modification) — separate status from generation.
  const [messages, setMessages] = useState([])
  const [assistantLoading, setAssistantLoading] = useState(false)
  const [assistantError, setAssistantError] = useState('')

  const generate = async () => {
    const description = idea.trim()
    if (!description || loading) return

    setLoading(true)
    setError('')
    setSchema(null)
    setMessages([]) // fresh schema -> fresh assistant conversation
    setAssistantError('')
    try {
      const result = await generateSchema(description)
      setSchema(result)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Send a modification request to the AI assistant.
  const sendMessage = async (text) => {
    const request = text.trim()
    if (!request || !schema || assistantLoading) return

    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: 'user', text: request },
    ])
    setAssistantLoading(true)
    setAssistantError('')
    try {
      const updated = await modifySchema(schema, request)
      setSchema(updated) // drives the viewer, ER diagram and SQL
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'assistant',
          text: 'Done. Updated the schema.',
        },
      ])
    } catch (err) {
      const message = err.message || 'Could not apply that change.'
      setAssistantError(message)
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'error', text: message },
      ])
    } finally {
      setAssistantLoading(false)
    }
  }

  return {
    idea,
    setIdea,
    loading,
    error,
    schema,
    generate,
    // assistant
    messages,
    assistantLoading,
    assistantError,
    sendMessage,
  }
}
