import type { MasterData } from "@/types/api"

export interface User {
  id: number
  email: string
  loginCode?: string
  profileId?: number
  name?: string
  masterData?: MasterData
}

export interface UserRequest {
  email: string
  password?: string
  otp?: string
  otpExpiredAt?: string
  profile?: ProfileRequest
}

export interface ProfileRequest {
  name: string
  apiKey?: string
  memberLevelCodeId?: number
}

export interface UserFilter {
  email?: string
  profileId?: number
}

export interface CreateUserWithLoginCodeRequest {
  loginCode: string
  memberLevelId: number
}