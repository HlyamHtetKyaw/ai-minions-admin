import { apiClient, API_V1_PREFIX } from "@/lib/api-client"
import type { ApiResponse, PaginationDTO } from "@/types/api"
import type {
  VoiceNote,
  VoiceNoteRequest,
  VoiceNotePageAndFilter,
  VoiceNoteDetail,
  VoiceNoteDetailRequest,
  VoiceNoteDetailPageAndFilter,
} from "../types/voice-notes-list.types"
import { SummaryStyle,JobInitResponse } from "../types/voice-notes.types"

export interface TextSummaryRequest {
  voiceNoteDetailId: number
  style: SummaryStyle
}

const BASE_URL = `${API_V1_PREFIX}/voice-notes`
const DETAILS_BASE_URL = `${API_V1_PREFIX}/voice-notes-details`
const BASE_URL_FOR_VOICE = `${API_V1_PREFIX}/voice`
// Voice Notes Services
export const voiceNotesService = {
  getAll: async (params?: VoiceNotePageAndFilter): Promise<PaginationDTO<VoiceNote>> => {
    const response = await apiClient.post<ApiResponse<PaginationDTO<VoiceNote>>>(
      `${BASE_URL}/pageable`,
      params || {}
    )
    return response.data
  },

  getById: async (id: number): Promise<VoiceNote> => {
    const response = await apiClient.get<ApiResponse<VoiceNote>>(`${BASE_URL}/${id}`)
    return response.data
  },

  create: async (data: VoiceNoteRequest): Promise<VoiceNote> => {
    const response = await apiClient.post<ApiResponse<VoiceNote>>(BASE_URL, data)
    return response.data
  },

  update: async (id: number, data: VoiceNoteRequest): Promise<VoiceNote> => {
    const response = await apiClient.put<ApiResponse<VoiceNote>>(`${BASE_URL}/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`${BASE_URL}/${id}`)
  },
  summarizeText: async (data: TextSummaryRequest): Promise<JobInitResponse> => {
    const response = await apiClient.post<ApiResponse<JobInitResponse>>(
      `${BASE_URL_FOR_VOICE}/summarize-text`,
      data
    )
    return response as any;
  },
}

// Voice Notes Details Services
export const voiceNotesDetailsService = {
  getAll: async (params?: VoiceNoteDetailPageAndFilter): Promise<PaginationDTO<VoiceNoteDetail>> => {
    const response = await apiClient.post<ApiResponse<PaginationDTO<VoiceNoteDetail>>>(
      `${DETAILS_BASE_URL}/pageable`,
      params || {}
    )
    return response.data
  },

  getById: async (id: number): Promise<VoiceNoteDetail> => {
    const response = await apiClient.get<ApiResponse<VoiceNoteDetail>>(`${DETAILS_BASE_URL}/${id}`)
    return response.data
  },

  getByVoiceNoteId: async (voiceNoteId: number): Promise<VoiceNoteDetail[]> => {
    const response = await apiClient.get<ApiResponse<VoiceNoteDetail[]>>(
      `${DETAILS_BASE_URL}/voice-notes/${voiceNoteId}`
    )
    return response.data
  },

  create: async (data: VoiceNoteDetailRequest): Promise<VoiceNoteDetail> => {
    const response = await apiClient.post<ApiResponse<VoiceNoteDetail>>(DETAILS_BASE_URL, data)
    return response.data
  },

  update: async (id: number, data: VoiceNoteDetailRequest): Promise<VoiceNoteDetail> => {
    const response = await apiClient.put<ApiResponse<VoiceNoteDetail>>(`${DETAILS_BASE_URL}/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`${DETAILS_BASE_URL}/${id}`)
  },
}
