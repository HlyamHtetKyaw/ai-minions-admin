import { apiClient, API_V1_PREFIX } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"
import type { AdminPointsPricingOverview, PointsPricingUsdReference } from "../types/points-config.types"

const BASE_URL = `${API_V1_PREFIX}/admin/points-pricing`

export const adminPointsPricingService = {
  async getOverview(): Promise<AdminPointsPricingOverview> {
    const raw = await apiClient.get<ApiResponse<AdminPointsPricingOverview>>(BASE_URL)
    if (raw.data == null) {
      throw new Error("Invalid points pricing overview response")
    }
    return raw.data
  },

  async updateUsdReference(usdPerPoint: number | null): Promise<PointsPricingUsdReference> {
    const raw = await apiClient.put<ApiResponse<PointsPricingUsdReference>>(BASE_URL, { usdPerPoint })
    if (raw.data == null) {
      throw new Error("Invalid update response")
    }
    return raw.data
  },
}
