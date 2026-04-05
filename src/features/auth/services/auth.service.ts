import { apiClient, API_BASE_URL, API_V1_PREFIX } from "@/lib/api-client"
import { decodeJwtPayload } from "@/lib/jwt"
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

/** Normalized for the admin UI after login */
export interface LoginResponse {
  token: string
  refreshToken?: string
  email: string
  userId: number
  role?: string
}

/** Role required to access the admin dashboard */
export const ADMIN_ROLE = "ADMIN"

export interface StoredUser {
  email: string
  userId: number
  role?: string
}

const AUTH_BASE_URL = `${API_V1_PREFIX}/auth`

let logoutCallback: (() => void) | null = null

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<AuthTokenDto>>(
      `${AUTH_BASE_URL}/login`,
      {
        usernameOrEmail: credentials.usernameOrEmail.trim(),
        password: credentials.password,
      }
    )
    const data = response.data
    const token = data.accessToken
    const refreshToken = data.refreshToken

    const claims = decodeJwtPayload(token)
    const sub = claims?.sub
    const userId =
      typeof sub === "string"
        ? parseInt(sub, 10)
        : typeof sub === "number"
          ? sub
          : 0
    const role = typeof claims?.role === "string" ? claims.role : undefined
    const usernameFromJwt =
      typeof claims?.username === "string" ? claims.username : undefined

    const typed = credentials.usernameOrEmail.trim()
    const email =
      typed.includes("@") ? typed : (usernameFromJwt ?? typed)

    return {
      token,
      refreshToken,
      email,
      userId,
      role,
    }
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

  setLogoutCallback(callback: (() => void) | null): void {
    logoutCallback = callback
  },

  /**
   * Check if the current token is still valid by calling a protected endpoint.
   * Returns true if the session is valid, false if token is missing/expired/invalid.
   * Clears storage on 401 so the app can show sign-in.
   */
  async validateSession(): Promise<boolean> {
    const user = this.getUser()
    const token = this.getToken()
    if (!token || !user?.userId) return false
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_V1_PREFIX}/profiles/users/${user.userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (response.status === 401) {
        this.logout()
        return false
      }
      return response.ok
    } catch {
      return false
    }
  },
}
