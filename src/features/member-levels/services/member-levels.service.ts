import { apiClient } from "@/lib/api-client"
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

const BASE_URL = "/api/member-levels"

export const memberLevelsService = {
  /**
   * Get all member levels with pagination
   */
  async getAll(
    pageAndFilter?: PageAndFilterDTO<MemberLevelFilter>
  ): Promise<PaginationDTO<MemberLevel>> {
    const response = await apiClient.post<
      ApiResponse<PaginationDTO<MemberLevel>>
    >(`${BASE_URL}/pageable`, pageAndFilter)
    return response.data
  },

  /**
   * Get member level by ID
   */
  async getById(id: number): Promise<MemberLevel> {
    const response = await apiClient.get<ApiResponse<MemberLevel>>(
      `${BASE_URL}/${id}`
    )
    return response.data
  },

  /**
   * Create a new member level
   */
  async create(data: MemberLevelRequest): Promise<MemberLevel> {
    const response = await apiClient.post<ApiResponse<MemberLevel>>(
      BASE_URL,
      data
    )
    return response.data
  },

  /**
   * Update an existing member level
   */
  async update(id: number, data: MemberLevelRequest): Promise<MemberLevel> {
    const response = await apiClient.put<ApiResponse<MemberLevel>>(
      `${BASE_URL}/${id}`,
      data
    )
    return response.data
  },

  /**
   * Delete a member level
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`${BASE_URL}/${id}`)
  },
}
