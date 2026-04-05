/** Matches `MemberLevel` / `MemberLevelDto` / `MemberLevelRequest` in ai-minions-main-service. */
export interface MemberLevel {
  id: number
  name: string
  durationDays: number
  creditPoints: number
  isBestValue: boolean
  /** BigDecimal from API — serialized as number in JSON */
  price: number
  createdAt?: string
  updatedAt?: string
}

export interface MemberLevelRequest {
  name: string
  durationDays: number
  creditPoints: number
  isBestValue: boolean
  price: number
}

export interface MemberLevelFilter {
  name?: string
}
