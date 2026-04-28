import type { MasterData } from "@/types/api"

export interface TopupCode {
  id: number
  code: string
  points: number
  activatedAt?: string
  expiredAt?: string
  assignedUserId?: number
  assignedUserName?: string
  masterData?: MasterData
}

export interface TopupCodeFilter {
  code?: string
  userId?: number
  activated?: boolean
}

export interface TopupCodeGenerateRequest {
  points: number
  count?: number
  prefix?: string
  expiredAt?: string
}
