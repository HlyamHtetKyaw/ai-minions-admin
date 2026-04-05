import { apiClient } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"

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

const BASE_URL = "/api/profiles"

export const profileService = {
  /**
   * Get profile by ID
   */
  async getById(id: number): Promise<Profile> {
    const response = await apiClient.get<ApiResponse<Profile>>(`${BASE_URL}/${id}`)
    return response.data
  },

  /**
   * Get profile by user ID
   */
  async getByUserId(userId: number): Promise<Profile> {
    const response = await apiClient.get<ApiResponse<Profile>>(`${BASE_URL}/users/${userId}`)
    return response.data
  },

  /**
   * Update profile
   */
  async update(id: number, data: ProfileRequest): Promise<Profile> {
    const response = await apiClient.put<ApiResponse<Profile>>(`${BASE_URL}/${id}`, data)
    return response.data
  },

  /**
   * Update API key settings
   */
  async updateApiKey(data: ApiKeyUpdateRequest): Promise<Profile> {
    const response = await apiClient.patch<ApiResponse<Profile>>(`${BASE_URL}/api-key`, data)
    return response.data
  },
}
