// src/utils/responses.ts
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, unknown> | string[];
  statusCode?: number;
}

export function successResponse<T>(data: T, message = "Operación exitosa", statusCode?: number): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    statusCode,
  };
}

export function errorResponse(
  message = "Ha ocurrido un error",
  statusCode?: number,
  errors?: Record<string, unknown> | string[],
): ApiResponse {
  return {
    success: false,
    message,
    statusCode,
    errors,
  };
}
