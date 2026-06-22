export interface ApiResponse<T = any> {
  data: T | null;
  meta?: Record<string, any>;
  error: ApiError | null;
  requestId: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  fieldErrors?: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
  nextCursor?: string;
  prevCursor?: string;
}

export class ApiResponseBuilder {
  static success<T>(data: T, requestId: string, meta?: Record<string, any>): ApiResponse<T> {
    return {
      data,
      meta,
      error: null,
      requestId,
    };
  }

  static error(
    code: string,
    message: string,
    requestId: string,
    details?: Record<string, any>,
    fieldErrors?: FieldError[]
  ): ApiResponse {
    return {
      data: null,
      error: {
        code,
        message,
        details,
        fieldErrors,
      },
      requestId,
    };
  }

  static paginated<T>(
    items: T[],
    total: number,
    requestId: string,
    meta?: Record<string, any>
  ): ApiResponse<PaginatedResponse<T>> {
    return this.success(
      {
        items,
        total,
        ...meta,
      },
      requestId,
      meta
    );
  }
}
