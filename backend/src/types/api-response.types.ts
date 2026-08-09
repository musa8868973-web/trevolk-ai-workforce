/**
 * Shared shape every API response conforms to, so the frontend can rely on
 * a single, predictable envelope regardless of endpoint (per the Backend
 * Specification's requirement that the API Gateway Layer returns a
 * "consistently shaped response").
 */
export interface ApiSuccessResponse<TData = unknown> {
  success: true;
  message: string;
  data: TData;
  meta?: Record<string, unknown>;
  requestId?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errorCode: string;
  details?: unknown;
  requestId?: string;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiPaginatedResponse<TItem = unknown> {
  success: true;
  message: string;
  data: TItem[];
  pagination: PaginationMeta;
  requestId?: string;
  timestamp: string;
}
