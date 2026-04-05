import { apiClient, API_V1_PREFIX } from "@/lib/api-client"
import type {
  ApiResponse,
  PaginationDTO,
  PageAndFilterDTO,
} from "@/types/api"
import type {
  User,
  UserRequest,
  UserFilter,
  CreateUserWithLoginCodeRequest,
} from "../types/users.types"

const BASE_URL = `${API_V1_PREFIX}/users`

export const usersService = {
  /**
   * Get all users with pagination
   */
  async getAll(
    pageAndFilter?: PageAndFilterDTO<UserFilter>
  ): Promise<PaginationDTO<User>> {
    const response = await apiClient.post<
      ApiResponse<PaginationDTO<User>>
    >(`${BASE_URL}/pageable`, pageAndFilter)
    return response.data
  },

  /**
   * Get user by ID
   */
  async getById(id: number): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      `${BASE_URL}/${id}`
    )
    return response.data
  },

  /**
   * Create a new user
   */
  async create(data: UserRequest): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>(
      BASE_URL,
      data
    )
    return response.data
  },

  /**
   * Update an existing user
   */
  async update(id: number, data: UserRequest): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(
      `${BASE_URL}/${id}`,
      data
    )
    return response.data
  },

  /**
   * Delete a user
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`${BASE_URL}/${id}`)
  },

  /**
   * Create a user with login code
   */
  async createWithLoginCode(
    data: CreateUserWithLoginCodeRequest
  ): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>(
      `${BASE_URL}/with-login-code`,
      data
    )
    return response.data
  },
}
