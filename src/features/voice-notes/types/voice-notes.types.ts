export type TaskType = "TRANSCRIBE" | "SUMMARIZE"

export type SummaryStyle = "FORMAL" | "INFORMAL" | "NARRATIVE" | "BULLET_POINTS" | "NONE"

export type JobStatus = "PROCESSING" | "COMPLETED" | "FAILED" | "PENDING"

export interface JobInitResponse {
  jobId: string
  status: JobStatus
  message: string
}

export interface JobStatusResponse {
  status: JobStatus
  title?: string
  result?: string
  error?: string
}
