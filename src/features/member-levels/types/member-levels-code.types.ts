import type { MasterData } from "@/types/api"

export interface MemberLevelCode {
  id: number
  code: string
  activatedAt?: string
  activatedUserName?: string
  expiredAt?: string
  memberLevelId: number
  purchasedUserName?: string
  masterData?: MasterData
}

export interface MemberLevelCodeRequest {
  code: string
  activatedAt?: string
  expiredAt?: string
  memberLevelId: number
  /** Omit or 0 for open codes (any user may redeem). */
  userId?: number
}

/** Response from POST /api/v1/member-levels-codes/activate */
export interface MemberLevelActivationResult {
  memberLevelCode: MemberLevelCode
  /** Server `ProfileDto` (fullname, memberLevelId, …). */
  profile: {
    id: number
    userId?: number
    memberLevelId?: number
    fullname?: string
    phoneNumber?: string
    geminiApiKey?: string
    openAiApiKey?: string
    createdAt?: string
    updatedAt?: string
  }
}

/** Payload for update; omit userId so activated user is not changed */
export type MemberLevelCodeUpdateRequest = Omit<MemberLevelCodeRequest, "userId">

export interface MemberLevelCodeFilter {
  code?: string
  memberLevelId?: number
  userId?: number
}
