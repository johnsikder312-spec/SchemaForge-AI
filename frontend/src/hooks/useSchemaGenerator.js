import { useRef, useState } from 'react'
import { generateSchema, modifySchema, regenerateSql } from '../lib/api'

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

  // Manual schema editor — separate from the AI assistant.
  const [editorSyncing, setEditorSyncing] = useState(false)
  const [editorError, setEditorError] = useState('')
  const editSeqRef = useRef(0)

  const generate = async () => {
    const description = idea.trim()
    if (!description || loading) return

    setLoading(true)
    setError('')
    setSchema(null)
    setMessages([]) // fresh schema -> fresh assistant conversation
    setAssistantError('')
    setEditorError('')
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

  // Apply a manual edit. `edit` is a function (schema) => newSchema | { error }.
  // The local change lands immediately (viewer + ER diagram update); the
  // backend then re-validates and returns fresh SQL.
  const applyEdit = async (edit) => {
    if (!schema || editorSyncing) return

    const result = edit(schema)
    if (!result || result.error) {
      setEditorError(result?.error || 'That change could not be applied.')
      return
    }
    setEditorError('')

    const seq = ++editSeqRef.current
    setSchema((prev) => ({ ...prev, ...result }))
    setEditorSyncing(true)
    try {
      const compiled = await regenerateSql(result)
      if (seq === editSeqRef.current) {
        setSchema((prev) => ({ ...prev, ...compiled }))
      }
    } catch (err) {
      if (seq === editSeqRef.current) {
        setEditorError(
          err.message || 'The schema is invalid — SQL was not regenerated.',
        )
      }
    } finally {
      if (seq === editSeqRef.current) setEditorSyncing(false)
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
    // manual editor
    applyEdit,
    editorSyncing,
    editorError,
  }
}
