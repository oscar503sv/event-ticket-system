// src/utils/responses.ts
export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    errors?: Record<string, unknown> | string[];
  }
  
  export function successResponse<T>(data: T, message = 'Operación exitosa'): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
    };
  }
  
  export function errorResponse(
    message = 'Ha ocurrido un error',
    errors?: Record<string, unknown> | string[]
  ): ApiResponse {
    return {
      success: false,
      message,
      errors,
    };
  }