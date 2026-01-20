export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
  timestamp?: string;
}

export interface PaginatedResponse<T = any> {
  statusCode: number;
  message: string;
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  timestamp?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
  timestamp?: string;
}

export type Role = 'admin' | 'staff' | 'user' | 'vendor';

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface ImportResult {
  totalRows: number;
  successCount: number;
  failedCount: number;
  successRecords?: any[];
  failedRecords?: Array<{
    row: number;
    data: any;
    errors: string[];
  }>;
}
