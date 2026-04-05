import { useState, useEffect } from "react"
import { memberLevelsService } from "../services/member-levels.service"
import type {
  PaginationDTO,
  PageAndFilterDTO,
} from "@/types/api"
import type {
  MemberLevel,
  MemberLevelRequest,
  MemberLevelFilter,
} from "../types/member-levels.types"

interface UseMemberLevelsOptions {
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: "ASC" | "DESC"
  filter?: MemberLevelFilter
  autoFetch?: boolean
}

export function useMemberLevels(options: UseMemberLevelsOptions = {}) {
  const {
    page = 0,
    size = 10,
    sortBy,
    sortDirection = "ASC",
    filter,
    autoFetch = true,
  } = options

  const [data, setData] = useState<PaginationDTO<MemberLevel> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchMemberLevels = async () => {
    setLoading(true)
    setError(null)
    try {
      const pageAndFilter: PageAndFilterDTO<MemberLevelFilter> = {
        page,
        size,
        sortBy,
        sortDirection,
        filter,
      }
      const result = await memberLevelsService.getAll(pageAndFilter)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch member levels"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoFetch) {
      fetchMemberLevels()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, sortBy, sortDirection, filter, autoFetch])

  return {
    data,
    loading,
    error,
    refetch: fetchMemberLevels,
  }
}

export function useMemberLevel(id: number | null) {
  const [data, setData] = useState<MemberLevel | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!id) {
      setData(null)
      return
    }

    const fetchMemberLevel = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await memberLevelsService.getById(id)
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch member level"))
      } finally {
        setLoading(false)
      }
    }

    fetchMemberLevel()
  }, [id])

  return {
    data,
    loading,
    error,
  }
}

export function useCreateMemberLevel() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const create = async (data: MemberLevelRequest) => {
    setLoading(true)
    setError(null)
    try {
      const result = await memberLevelsService.create(data)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to create member level")
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    create,
    loading,
    error,
  }
}

export function useUpdateMemberLevel() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = async (id: number, data: MemberLevelRequest) => {
    setLoading(true)
    setError(null)
    try {
      const result = await memberLevelsService.update(id, data)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to update member level")
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    update,
    loading,
    error,
  }
}

export function useDeleteMemberLevel() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deleteMemberLevel = async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await memberLevelsService.delete(id)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to delete member level")
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    delete: deleteMemberLevel,
    loading,
    error,
  }
}
