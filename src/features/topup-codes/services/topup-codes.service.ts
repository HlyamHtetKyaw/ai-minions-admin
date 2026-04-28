import { apiClient, API_V1_PREFIX } from "@/lib/api-client"
import type { ApiResponse, PaginationDTO, PageAndFilterDTO } from "@/types/api"
import type { TopupCode, TopupCodeFilter, TopupCodeGenerateRequest } from "../types/topup-codes.types"

const BASE_URL = `${API_V1_PREFIX}/topup-codes`

export const topupCodesService = {
  async getAll(
    pageAndFilter?: PageAndFilterDTO<TopupCodeFilter>
  ): Promise<PaginationDTO<TopupCode>> {
    const response = await apiClient.post<
      ApiResponse<PaginationDTO<TopupCode>>
    >(`${BASE_URL}/pageable`, pageAndFilter)
    return response.data
  },

  async generate(data: TopupCodeGenerateRequest): Promise<TopupCode[]> {
    const response = await apiClient.post<ApiResponse<TopupCode[]>>(
      `${BASE_URL}/generate`,
      data
    )
    return response.data
  },
}
