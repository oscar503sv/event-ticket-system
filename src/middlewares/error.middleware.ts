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
  return app.onError({ as: "global" }, ({ code, error, set, request }) => {
    // Obtener mensaje y stack de manera segura
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const path = new URL(request.url).pathname;

    // Lista de rutas que se deben ignorar en logs (assets comunes del navegador)
    const ignoredPaths = [
      "/favicon.ico",
      "/manifest.json",
      "/robots.txt",
      "/apple-touch-icon.png",
      "/site.webmanifest",
    ];

    // Manejar diferentes tipos de errores
    switch (code as ErrorCode) {
      case "VALIDATION":
        logger.error(`Error de validación en ${path}: ${errorMessage}`, { stack: errorStack });
        set.status = 400;
        return errorResponse("Error de validación", 400, [errorMessage]);

      case "NOT_FOUND":
        // Solo loguear 404s que NO sean assets comunes del navegador
        if (!ignoredPaths.includes(path)) {
          logger.warn(`404 - Ruta no encontrada: ${path}`);
        }
        set.status = 404;
        return errorResponse("Recurso no encontrado");

      case "UNAUTHORIZED":
        logger.warn(`401 - No autorizado: ${path}`);
        set.status = 401;
        return errorResponse("No autorizado");

      case "FORBIDDEN":
        logger.warn(`403 - Acceso denegado: ${path}`, { message: errorMessage });
        set.status = 403;
        return errorResponse("Acceso denegado");

      default:
        logger.error(`Error [${code}] en ${path}: ${errorMessage}`, {
          stack: errorStack,
          code,
        });
        set.status = 500;
        return errorResponse("Error interno del servidor");
    }
  });
}
