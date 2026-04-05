import type { MasterData } from "@/types/api"
import type { CodeValueListResponse } from "@/features/code-values/services/code-values.service"

export interface MemberLevel {
  id: number
  name: string
  durationDays?: number
  durationMonths?: number
  maxJob?: number
  amount?: number
  currency?: CodeValueListResponse
  masterData?: MasterData
}

export interface MemberLevelRequest {
  name: string
  durationDays?: number
  durationMonths?: number
  maxJob?: number
  amount?: number
  currencyId?: number | null
}

export interface MemberLevelFilter {
  name?: string
  durationDays?: number
  durationMonths?: number
  maxJob?: number
  amount?: number
  currencyId?: number
}
