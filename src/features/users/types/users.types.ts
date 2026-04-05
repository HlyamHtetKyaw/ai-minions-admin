import type { MasterData } from "@/types/api"

export interface User {
  id: number
  email: string
  username?: string
  roleName?: string
  loginCode?: string
  profileId?: number
  /** Profile full name from main-service `profileFullname`. */
  name?: string
  masterData?: MasterData
}

export interface UserRequest {
  email: string
  password?: string
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