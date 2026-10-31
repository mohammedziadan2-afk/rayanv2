export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export const DEFAULT_PAGE_SIZE = 50
export const MAX_PAGE_SIZE = 200

export function validatePaginationParams(params: PaginationParams): {
  page: number
  pageSize: number
} {
  const page = Math.max(1, params.page || 1)
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize || DEFAULT_PAGE_SIZE))

  return { page, pageSize }
}

export function calculatePagination(
  page: number,
  pageSize: number,
  totalCount: number,
): PaginationResult<never>["pagination"] {
  const totalPages = Math.ceil(totalCount / pageSize)

  return {
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}

export function getPageRange(page: number, pageSize: number): { from: number; to: number } {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  return { from, to }
}
