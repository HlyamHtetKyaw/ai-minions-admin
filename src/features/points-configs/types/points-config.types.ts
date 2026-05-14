export type PointsMetricType =
  | "TOKEN_IN"
  | "TOKEN_OUT"
  | "VOICE_OVER_TOKEN"
  | "MB_AUDIO"
  | "MB_VIDEO"
  | "IMAGE_GEN"

export interface PointsConfig {
  id: number
  metricType: PointsMetricType
  basePointCost: string | number
  profitMultiplier: string | number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  /** Present on admin overview rows; illustrative USD per metric unit. */
  estimatedUsdPerUnit?: string | number | null
}

export interface AdminPointsPricingOverview {
  usdPerPoint: string | number | null
  rows: PointsConfig[]
}

export interface PointsPricingUsdReference {
  usdPerPoint: string | number | null
}

export interface PointsConfigUpdateRequest {
  metricType: PointsMetricType
  basePointCost: string
  profitMultiplier: string
  isActive: boolean
}

