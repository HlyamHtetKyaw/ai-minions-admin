import { apiClient } from "@/lib/api-client"
import type {
  JobInitResponse,
  JobStatusResponse,
  TaskType,
  SummaryStyle,
} from "../types/voice-notes.types"

const BASE_URL = "/api/voice"

export const voiceService = {
  /**
   * Upload audio file for transcription or summarization
   */
  async uploadAudio(
    file: File,
    type: TaskType,
    style?: SummaryStyle
  ): Promise<JobInitResponse> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", type)
    if (style && style !== "NONE") {
      formData.append("style", style)
    }

    // Use apiClient to include JWT token
    return apiClient.post<JobInitResponse>(BASE_URL, formData)
  },

  /**
   * Check job status
   */
  async checkStatus(jobId: string): Promise<JobStatusResponse> {
    const response = await apiClient.get<JobStatusResponse>(
      `${BASE_URL}/status/${jobId}`
    )
    return response
  },
}
