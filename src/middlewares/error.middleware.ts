// src/middlewares/error.middleware.ts
import type { Elysia } from 'elysia';
import { logger } from '../config/logger';
import { errorResponse } from '../utils/responses';

type ErrorCode = 
  | 'VALIDATION' 
  | 'NOT_FOUND' 
  | 'UNAUTHORIZED' 
  | 'FORBIDDEN' 
  | 'INTERNAL_SERVER_ERROR' 
  | 'PARSE' 
  | 'UNKNOWN';

export function errorMiddleware(app: Elysia) {
  return app.onError(({ code, error, set }) => {
    logger.error(`Error [${code}]: ${error.message}`, { stack: error.stack });
    
    // Manejar diferentes tipos de errores
    switch (code as ErrorCode) {
      case 'VALIDATION':
        set.status = 400;
        return errorResponse('Error de validación', [error.message]);
      case 'NOT_FOUND':
        set.status = 404;
        return errorResponse('Recurso no encontrado');
      case 'UNAUTHORIZED':
        set.status = 401;
        return errorResponse('No autorizado');
      case 'FORBIDDEN':
        set.status = 403;
        return errorResponse('Acceso denegado');
      default:
        set.status = 500;
        return errorResponse('Error interno del servidor');
    }
  });
}