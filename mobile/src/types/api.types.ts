export interface ApiResponse<T = void> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  statusCode: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}
