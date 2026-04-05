import { apiClient, API_V1_PREFIX } from "@/lib/api-client"

export interface DashboardStats {
  totalUsers: number
  memberLevels: number
  voiceNotes: number
}

export interface DashboardResponse {
  code: number
  message: string
  data: DashboardStats
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardResponse>(
      `${API_V1_PREFIX}/dashboard`
    )
    return response.data
  },
}
