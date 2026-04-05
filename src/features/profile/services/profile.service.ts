import { apiClient, API_V1_PREFIX } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"

/** Raw ProfileDto from main-service (camelCase JSON). */
interface ProfileDto {
  id: number
  userId?: number
  memberLevelId?: number | null
  fullname?: string | null
  name?: string | null
  phoneNumber?: string | null
  geminiApiKey?: string | null
  openAiApiKey?: string | null
  useDefaultApiKey?: boolean
  createdAt?: string
  updatedAt?: string
}

function mapProfileDto(d: ProfileDto): Profile {
  const rawName = d.fullname ?? d.name
  const name =
    typeof rawName === "string" ? rawName.trim() : ""
  return {
    id: d.id,
    name,
    apiKey: d.openAiApiKey ?? d.geminiApiKey ?? undefined,
    useDefaultApiKey: d.useDefaultApiKey,
    memberLevelCodeId: undefined,
    masterData:
      d.createdAt != null || d.updatedAt != null
        ? { createdAt: d.createdAt, updatedAt: d.updatedAt }
        : undefined,
  }
}

function unwrapProfileResponse(response: ApiResponse<ProfileDto>): Profile {
  if (response?.data == null) {
    throw new Error("Invalid profile response")
  }
  return mapProfileDto(response.data)
}

export interface Profile {
  id: number
  name: string
  apiKey?: string
  useDefaultApiKey?: boolean
  memberLevelCodeId?: number
  masterData?: {
    createdBy?: string
    updatedBy?: string
    createdAt?: string
    updatedAt?: string
  }
}

export interface ProfileRequest {
  name: string
  apiKey?: string
  useDefaultApiKey?: boolean
  memberLevelCodeId?: number
}

export interface ApiKeyUpdateRequest {
  useDefaultApiKey: boolean
  apiKey?: string
}

const BASE_URL = `${API_V1_PREFIX}/profiles`

export const profileService = {
  /**
   * Get profile by ID
   */
  async getById(id: number): Promise<Profile> {
    const response = await apiClient.get<ApiResponse<ProfileDto>>(`${BASE_URL}/${id}`)
    return unwrapProfileResponse(response)
  },

  /**
   * Get profile by user ID
   */
  async getByUserId(userId: number): Promise<Profile> {
    const response = await apiClient.get<ApiResponse<ProfileDto>>(
      `${BASE_URL}/users/${userId}`
    )
    return unwrapProfileResponse(response)
  },

  /**
   * Update profile
   */
  async update(id: number, data: ProfileRequest): Promise<Profile> {
    const response = await apiClient.put<ApiResponse<ProfileDto>>(`${BASE_URL}/${id}`, data)
    return unwrapProfileResponse(response)
  },

  /**
   * Update API key settings
   */
  async updateApiKey(data: ApiKeyUpdateRequest): Promise<Profile> {
    const response = await apiClient.patch<ApiResponse<ProfileDto>>(
      `${BASE_URL}/api-key`,
      data
    )
    return unwrapProfileResponse(response)
  },
}
