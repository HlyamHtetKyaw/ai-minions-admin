import { apiClient, API_V1_PREFIX } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"

export interface CodeValueListResponse {
  id: number
  codeId: number
  codeValue: string
  description: string
}

const BASE_URL = `${API_V1_PREFIX}/code-values`

export const codeValuesService = {
  /**
   * Get code values by constant value
   */
  async getByConstantValue(constantValue: string): Promise<CodeValueListResponse[]> {
    const response = await apiClient.get<ApiResponse<CodeValueListResponse[]>>(
      `${BASE_URL}/constant-value/${constantValue}`
    )
    return response.data
  },
}
