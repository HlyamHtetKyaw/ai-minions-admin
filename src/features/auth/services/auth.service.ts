import { apiClient, API_V1_PREFIX } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"

/** Matches `LoginRequest` in ai-minions-main-service */
export interface LoginRequest {
  usernameOrEmail: string
  password: string
}

/** Matches `AuthTokenDto` in the login response `data` field */
interface AuthTokenDto {
  accessToken: string
  refreshToken: string
}

/** Matches `CurrentUserDto` from GET /api/v1/auth/me */
export interface MeDto {
  userId: number
  username: string
  email: string
  role: string
}

/** Role required to access the admin dashboard */
export const ADMIN_ROLE = "ADMIN"

export interface StoredUser {
  email: string
  userId: number
  role?: string
}

const AUTH_BASE_URL = `${API_V1_PREFIX}/auth`

export const authService = {
  async login(credentials: LoginRequest): Promise<{ token: string; refreshToken?: string }> {
    const response = await apiClient.post<ApiResponse<AuthTokenDto>>(
      `${AUTH_BASE_URL}/login`,
      {
        usernameOrEmail: credentials.usernameOrEmail.trim(),
        password: credentials.password,
      }
    )
    const data = response.data
    return {
      token: data.accessToken,
      refreshToken: data.refreshToken,
    }
  },

  /**
   * Current user from DB (no Profile row required). Call after storing the access token.
   */
  async fetchMe(): Promise<MeDto> {
    const response = await apiClient.get<ApiResponse<MeDto>>(`${AUTH_BASE_URL}/me`)
    const data = response.data
    if (data == null) {
      throw new Error("Invalid session: empty /auth/me response")
    }
    return data
  },

  logout(): void {
    localStorage.removeItem("token")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("user")
    window.dispatchEvent(new Event("auth-logout"))
  },

  getToken(): string | null {
    return localStorage.getItem("token")
  },

  setToken(token: string): void {
    localStorage.setItem("token", token)
  },

  getRefreshToken(): string | null {
    return localStorage.getItem("refreshToken")
  },

  setRefreshToken(refreshToken: string): void {
    localStorage.setItem("refreshToken", refreshToken)
  },

  getUser(): StoredUser | null {
    const userStr = localStorage.getItem("user")
    if (!userStr) return null
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  },

  setUser(user: StoredUser): void {
    localStorage.setItem("user", JSON.stringify(user))
  },

  isAuthenticated(): boolean {
    return !!this.getToken()
  },

  /** True only if the current user has the admin role (allowed to use dashboard). */
  isAdmin(): boolean {
    const user = this.getUser()
    return user?.role === ADMIN_ROLE
  },

  /**
   * Validates the access token via GET /api/v1/auth/me (does not require a Profile).
   * Refreshes stored user from the server when successful.
   */
  async validateSession(): Promise<boolean> {
    const token = this.getToken()
    if (!token) return false
    try {
      const me = await this.fetchMe()
      this.setUser({
        email: me.email,
        userId: me.userId,
        role: me.role,
      })
      return true
    } catch {
      this.logout()
      return false
    }
  },
}
