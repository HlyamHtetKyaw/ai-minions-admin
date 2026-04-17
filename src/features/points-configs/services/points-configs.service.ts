import { apiClient, API_V1_PREFIX } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"
import type {
  PointsConfig,
  PointsConfigUpdateRequest,
} from "../types/points-config.types"

/** Base path matches `PointsConfigController` in ai-minions-main-service */
const BASE_URL = `${API_V1_PREFIX}/points-configs`

export const pointsConfigsService = {
  async getAll(): Promise<PointsConfig[]> {
    const raw = await apiClient.get<ApiResponse<PointsConfig[]>>(BASE_URL)
    return Array.isArray(raw.data) ? raw.data : []
  },

  async update(id: number, body: PointsConfigUpdateRequest): Promise<PointsConfig> {
    const raw = await apiClient.put<ApiResponse<PointsConfig>>(`${BASE_URL}/${id}`, body)
    return raw.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`${BASE_URL}/${id}`)
  },
}

