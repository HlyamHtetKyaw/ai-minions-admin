import { apiClient, API_BASE_URL } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"

export interface LoginRequest {
  email: string
  password: string
}

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

const AUTH_BASE_URL = "/api/auth"

let logoutCallback: (() => void) | null = null

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      `${AUTH_BASE_URL}/login`,
      credentials
    )
    return response.data
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
        `${API_BASE_URL}/api/profiles/users/${user.userId}`,
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
