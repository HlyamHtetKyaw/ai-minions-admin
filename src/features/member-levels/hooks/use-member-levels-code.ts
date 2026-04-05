import { useState, useEffect } from "react"
import { memberLevelsCodeService } from "../services/member-levels-code.service"
import type {
  MemberLevelCode,
  MemberLevelCodeFilter,
} from "../types/member-levels-code.types"
import type { PaginationDTO, PageAndFilterDTO } from "@/types/api"

interface UseMemberLevelsCodeOptions {
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: "ASC" | "DESC"
  filter?: MemberLevelCodeFilter
  autoFetch?: boolean
}

export function useMemberLevelsCode(options: UseMemberLevelsCodeOptions = {}) {
  const {
    page = 0,
    size = 10,
    sortBy,
    sortDirection = "ASC",
    filter,
    autoFetch = true,
  } = options

  const [data, setData] = useState<PaginationDTO<MemberLevelCode> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchMemberLevelsCode = async () => {
    setLoading(true)
    setError(null)
    try {
      const pageAndFilter: PageAndFilterDTO<MemberLevelCodeFilter> = {
        page,
        size,
        sortBy,
        sortDirection,
        filter,
      }
      const result = await memberLevelsCodeService.getAll(pageAndFilter)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch member level codes"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoFetch) {
      fetchMemberLevelsCode()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, sortBy, sortDirection, filter, autoFetch])

  return {
    data,
    loading,
    error,
    refetch: fetchMemberLevelsCode,
  }
}
