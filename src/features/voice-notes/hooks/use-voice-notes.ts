import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { voiceNotesService, voiceNotesDetailsService } from "../services/voice-notes.service"
import type { PaginationDTO } from "@/types/api"
import type {
  VoiceNote,
  VoiceNoteRequest,
  VoiceNotePageAndFilter,
  VoiceNoteDetail,
  VoiceNoteDetailRequest,
  VoiceNoteDetailPageAndFilter,
} from "../types/voice-notes-list.types"
import { JobInitResponse } from "../types/voice-notes.types"
interface UseVoiceNotesOptions {
  page?: number
  size?: number
  filter?: VoiceNotePageAndFilter["filter"]
  sortBy?: string
  sortDirection?: "ASC" | "DESC"
  autoFetch?: boolean
}

interface UseVoiceNotesReturn {
  data: PaginationDTO<VoiceNote> | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useVoiceNotes(options: UseVoiceNotesOptions = {}): UseVoiceNotesReturn {
  const { page = 0, size = 10, filter, sortBy, sortDirection, autoFetch = true } = options
  const [data, setData] = useState<PaginationDTO<VoiceNote> | null>(null)
  const [loading, setLoading] = useState<boolean>(autoFetch)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params: VoiceNotePageAndFilter = {
        page,
        size,
        filter,
        sortBy,
        sortDirection,
      }
      const result = await voiceNotesService.getAll(params)
      setData(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch voice notes")
      setError(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [page, size, filter, sortBy, sortDirection])

  const refetch = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [autoFetch, fetchData])

  return { data, loading, error, refetch }
}

export function useVoiceNote(id: number | null) {
  const [data, setData] = useState<VoiceNote | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      const result = await voiceNotesService.getById(id)
      setData(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch voice note")
      setError(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetch()
    }
  }, [id, fetch])

  return { data, loading, error, refetch: fetch }
}

export function useCreateVoiceNote() {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const create = useCallback(async (data: VoiceNoteRequest): Promise<VoiceNote | null> => {
    try {
      setLoading(true)
      setError(null)
      const result = await voiceNotesService.create(data)
      toast.success("Voice note created successfully")
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to create voice note")
      setError(error)
      toast.error(error.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { create, loading, error }
}

export function useUpdateVoiceNote() {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const update = useCallback(
    async (id: number, data: VoiceNoteRequest): Promise<VoiceNote | null> => {
      try {
        setLoading(true)
        setError(null)
        const result = await voiceNotesService.update(id, data)
        toast.success("Voice note updated successfully")
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to update voice note")
        setError(error)
        toast.error(error.message)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { update, loading, error }
}

export function useDeleteVoiceNote() {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const remove = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      await voiceNotesService.delete(id)
      toast.success("Voice note deleted successfully")
      return true
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to delete voice note")
      setError(error)
      toast.error(error.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { remove, loading, error }
}

// Voice Notes Details Hooks
export function useVoiceNoteDetails(voiceNoteId: number | null) {
  const [data, setData] = useState<VoiceNoteDetail[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    if (!voiceNoteId) return
    try {
      setLoading(true)
      setError(null)
      const result = await voiceNotesDetailsService.getByVoiceNoteId(voiceNoteId)
      setData(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch voice note details")
      setError(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [voiceNoteId])

  useEffect(() => {
    if (voiceNoteId) {
      fetch()
    }
  }, [voiceNoteId, fetch])

  return { data, loading, error, refetch: fetch }
}

export function useCreateVoiceNoteDetail() {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const create = useCallback(
    async (data: VoiceNoteDetailRequest): Promise<VoiceNoteDetail | null> => {
      try {
        setLoading(true)
        setError(null)
        const result = await voiceNotesDetailsService.create(data)
        toast.success("Voice note detail created successfully")
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to create voice note detail")
        setError(error)
        toast.error(error.message)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { create, loading, error }
}

export function useSummarizeText() {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const summarize = useCallback(
    async (voiceNoteDetailId: number, style: any): Promise<JobInitResponse | null> => {
      try {
        setLoading(true)
        setError(null)
        
        // Call the service we just updated
        const result = await voiceNotesService.summarizeText({ 
          voiceNoteDetailId, 
          style 
        })
        
        toast.info("Summarization started...")
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to start summarization")
        setError(error)
        toast.error(error.message)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { summarize, loading, error }
}