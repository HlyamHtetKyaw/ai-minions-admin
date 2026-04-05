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

/** Matches `UserDto` from ai-minions-main-service (password always null in JSON). */
interface UserDtoRaw {
  id: number
  username?: string
  email: string
  loginCode?: string
  roleId?: number
  roleName?: string
  profileId?: number
  profileFullname?: string | null
  createdAt?: string
  updatedAt?: string
}

function mapUser(raw: UserDtoRaw): User {
  return {
    id: raw.id,
    email: raw.email,
    username: raw.username,
    roleName: raw.roleName,
    loginCode: raw.loginCode ?? undefined,
    profileId: raw.profileId ?? undefined,
    name: raw.profileFullname ?? undefined,
    masterData: {
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
  }
}

export const usersService = {
  /**
   * Lists users via GET /api/v1/users; applies client-side filter + pagination (same pattern as member levels).
   */
  async getAll(
    pageAndFilter?: PageAndFilterDTO<UserFilter>
  ): Promise<PaginationDTO<User>> {
    const raw = await apiClient.get<ApiResponse<UserDtoRaw[]>>(BASE_URL)
    let list = Array.isArray(raw.data) ? raw.data.map(mapUser) : []

    const q = pageAndFilter?.filter?.email?.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.username && u.username.toLowerCase().includes(q)) ||
          (u.name && u.name.toLowerCase().includes(q))
      )
    }

    const page = pageAndFilter?.page ?? 0
    const size = pageAndFilter?.size ?? 10
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

  async getById(id: number): Promise<User> {
    const raw = await apiClient.get<ApiResponse<UserDtoRaw>>(`${BASE_URL}/${id}`)
    return mapUser(raw.data)
  },

  async create(data: UserRequest): Promise<User> {
    const raw = await apiClient.post<ApiResponse<UserDtoRaw>>(BASE_URL, data)
    return mapUser(raw.data)
  },

  async update(id: number, data: UserRequest): Promise<User> {
    const raw = await apiClient.put<ApiResponse<UserDtoRaw>>(
      `${BASE_URL}/${id}`,
      data
    )
    return mapUser(raw.data)
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${id}`)
  },

  async createWithLoginCode(
    data: CreateUserWithLoginCodeRequest
  ): Promise<User> {
    const raw = await apiClient.post<ApiResponse<UserDtoRaw>>(
      `${BASE_URL}/with-login-code`,
      data
    )
    return mapUser(raw.data)
  },
}
