import { apiClient, API_V1_PREFIX } from "@/lib/api-client"
import type {
  ApiResponse,
  PaginationDTO,
  PageAndFilterDTO,
} from "@/types/api"
import type {
  MemberLevel,
  MemberLevelRequest,
  MemberLevelFilter,
} from "../types/member-levels.types"

/** Base path matches `MemberLevelController` in ai-minions-main-service */
const BASE_URL = `${API_V1_PREFIX}/member-levels`

export const memberLevelsService = {
  /**
   * Lists all member levels (backend exposes GET /api/v1/member-levels).
   * Applies optional client-side filter + pagination to match existing hooks.
   */
  async getAll(
    pageAndFilter?: PageAndFilterDTO<MemberLevelFilter>
  ): Promise<PaginationDTO<MemberLevel>> {
    const raw = await apiClient.get<ApiResponse<MemberLevel[]>>(BASE_URL)
    let list = (Array.isArray(raw.data) ? raw.data : []).map((l) => ({
      ...l,
      isTopup: l.isTopup ?? false,
    }))

    const nameQ = pageAndFilter?.filter?.name?.trim().toLowerCase()
    if (nameQ) {
      list = list.filter((l) => l.name.toLowerCase().includes(nameQ))
    }

    const page = pageAndFilter?.page ?? 0
    const size = pageAndFilter?.size ?? 100
    const start = page * size
    const content = list.slice(start, start + size)

    return {
      content,
      totalItems: list.length,
      totalPages: Math.max(1, Math.ceil(list.length / size) || 1),
      currentPage: page,
      pageSize: size,
    }
  },

  async getById(id: number): Promise<MemberLevel> {
    const raw = await apiClient.get<ApiResponse<MemberLevel>>(`${BASE_URL}/${id}`)
    const l = raw.data
    return { ...l, isTopup: l.isTopup ?? false }
  },

  async create(data: MemberLevelRequest): Promise<MemberLevel> {
    const raw = await apiClient.post<ApiResponse<MemberLevel>>(BASE_URL, data)
    return raw.data
  },

  async update(id: number, data: MemberLevelRequest): Promise<MemberLevel> {
    const raw = await apiClient.put<ApiResponse<MemberLevel>>(
      `${BASE_URL}/${id}`,
      data
    )
    return raw.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`${BASE_URL}/${id}`)
  },
}
