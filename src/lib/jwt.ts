/** Decode JWT payload (no signature verification — for client-side claims only). */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1]
    if (!part) return null
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/")
    const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4))
    const json = atob(base64 + pad)
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}
