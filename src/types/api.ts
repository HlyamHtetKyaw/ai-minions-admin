export interface ApiResponse<T = any> {
  success: number
  code: number
  meta: ApiMetaResponse
  data: T
  message: string
}

export interface ApiMetaResponse {
  endpoint: string
  method: string
  totalItems?: number
  totalPages?: number
  currentPage?: number
}

// Pagination Types
export interface PaginationDTO<T> {
  content: T[]
  totalItems: number
  totalPages: number
  currentPage: number
  pageSize: number
}

export interface PageAndFilterDTO<T = any> {
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: "ASC" | "DESC"
  filter?: T
}

// Master Data Types
export interface MasterData {
  createdBy?: string
  updatedBy?: string
  createdAt?: string
  updatedAt?: string
}
