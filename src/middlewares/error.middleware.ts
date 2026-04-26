// src/middlewares/error.middleware.ts
import type { Elysia } from "elysia";
import { logger } from "../config/logger";
import { errorResponse } from "../utils/responses";

type ErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INTERNAL_SERVER_ERROR"
  | "PARSE"
  | "UNKNOWN";

export function errorMiddleware(app: Elysia) {
  return app.onError({ as: "global" }, ({ code, error, set }) => {
    // Obtener mensaje y stack de manera segura
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error(`Error [${code}]: ${errorMessage}`, { stack: errorStack });

    // Manejar diferentes tipos de errores
    switch (code as ErrorCode) {
      case "VALIDATION":
        set.status = 400;
        return errorResponse("Error de validación", 400, [errorMessage]);
      case "NOT_FOUND":
        set.status = 404;
        return errorResponse("Recurso no encontrado");
      case "UNAUTHORIZED":
        set.status = 401;
        return errorResponse("No autorizado");
      case "FORBIDDEN":
        set.status = 403;
        return errorResponse("Acceso denegado");
      default:
        set.status = 500;
        return errorResponse("Error interno del servidor");
    }
  });
}
