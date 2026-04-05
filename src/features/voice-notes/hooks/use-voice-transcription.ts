import { useState, useCallback } from "react"
import { voiceService } from "../services/voice.service"
import type {
  JobInitResponse,
  JobStatusResponse,
  TaskType,
  SummaryStyle,
} from "../types/voice-notes.types"

export function useVoiceTranscription() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)

  const uploadAudio = useCallback(
    async (file: File, type: TaskType, style?: SummaryStyle) => {
      setLoading(true)
      setError(null)
      try {
        const response = await voiceService.uploadAudio(file, type, style)
        setJobId(response.jobId)
        return response
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to upload audio")
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    uploadAudio,
    loading,
    error,
    jobId,
  }
}

export function useJobStatus(jobId: string | null) {
  const [status, setStatus] = useState<JobStatusResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const checkStatus = useCallback(async () => {
    if (!jobId) return null

    setLoading(true)
    setError(null)
    try {
      const response = await voiceService.checkStatus(jobId)
      setStatus(response)
      return response
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to check job status")
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [jobId])

  return {
    status,
    loading,
    error,
    checkStatus,
  }
}
