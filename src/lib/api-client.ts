export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://localhost:8080"

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: number,
    public message: string,
    public data?: any
  ) {
    super(message)
    this.name = "ApiError"
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("token")
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  
  return headers
}

function clearAuthAndRedirect() {
  localStorage.removeItem("token")
  localStorage.removeItem("refreshToken")
  localStorage.removeItem("user")
  window.dispatchEvent(new Event("auth-logout"))
  window.location.href = "/signin"
}

/**
 * Try to refresh the access token using the stored refresh token.
 * Returns true if a new token was stored, false otherwise.
 */
async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem("refreshToken")
  if (!refreshToken) return false
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
    if (!response.ok) return false
    const json = await response.json().catch(() => null)
    const data = json?.data ?? json
    const newToken = data?.token
    if (!newToken) return false
    localStorage.setItem("token", newToken)
    if (data?.refreshToken != null) {
      localStorage.setItem("refreshToken", data.refreshToken)
    }
    return true
  } catch {
    return false
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(
      response.status,
      errorData.code || response.status,
      errorData.message || response.statusText,
      errorData.data
    )
  }

  // Handle 204 No Content - no body to parse
  if (response.status === 204) {
    return undefined as T
  }

  // Check if response has content to parse
  const contentType = response.headers.get("content-type")
  if (!contentType || !contentType.includes("application/json")) {
    return undefined as T
  }

  // Check if response has body
  const text = await response.text()
  if (!text || text.trim() === "") {
    return undefined as T
  }

  return JSON.parse(text)
}

async function requestWithAuthRetry<T>(
  doRequest: () => Promise<Response>
): Promise<T> {
  let response = await doRequest()
  if (response.status === 401) {
    const refreshed = await tryRefreshToken()
    if (refreshed) response = await doRequest()
    if (response.status === 401) {
      clearAuthAndRedirect()
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(
        401,
        errorData.code ?? 401,
        errorData.message || "Unauthorized",
        errorData.data
      )
    }
  }
  return handleResponse<T>(response)
}

export const apiClient = {
  async get<T>(url: string): Promise<T> {
    return requestWithAuthRetry<T>(() =>
      fetch(`${API_BASE_URL}${url}`, {
        method: "GET",
        headers: getAuthHeaders(),
      })
    )
  },

  async post<T>(url: string, data?: any): Promise<T> {
    const isFormData = data instanceof FormData
    const token = localStorage.getItem("token")
    
    // For FormData, we need to manually set Authorization header
    // The browser will set Content-Type with boundary automatically
    const headers: Record<string, string> = isFormData
      ? {} // Let browser set Content-Type with boundary for FormData
      : getAuthHeaders()
    
    // Add Authorization header for FormData requests
    if (isFormData && token) {
      headers["Authorization"] = `Bearer ${token}`
    }
    
    return requestWithAuthRetry<T>(() =>
      fetch(`${API_BASE_URL}${url}`, {
        method: "POST",
        headers,
        body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
      })
    )
  },

  async put<T>(url: string, data?: any): Promise<T> {
    return requestWithAuthRetry<T>(() =>
      fetch(`${API_BASE_URL}${url}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      })
    )
  },

  async delete<T>(url: string): Promise<T> {
    return requestWithAuthRetry<T>(() =>
      fetch(`${API_BASE_URL}${url}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
    )
  },

  async patch<T>(url: string, data?: any): Promise<T> {
    return requestWithAuthRetry<T>(() =>
      fetch(`${API_BASE_URL}${url}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      })
    )
  },
}
