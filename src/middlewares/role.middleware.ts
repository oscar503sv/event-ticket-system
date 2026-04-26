// src/middlewares/role.middleware.ts
import { Elysia } from "elysia";
import type { JWTPayload } from "../types/jwt.d";
import { errorResponse } from "../utils/responses";

/**
 * Middleware que verifica que el usuario sea ADMIN
 * Debe usarse después de authMiddleware
 */
export const adminMiddleware = new Elysia({ name: "admin" }).onBeforeHandle({ as: "scoped" }, async (context) => {
  const payload = (context as any).user as JWTPayload;

  if (!payload || payload.role !== "ADMIN") {
    (context as any).set.status = 403;
    return errorResponse("Acceso denegado: se requiere rol de administrador", 403);
  }
});

/**
 * Middleware que verifica que el usuario sea ORGANIZER
 * Debe usarse después de authMiddleware
 */
export const organizerMiddleware = new Elysia({ name: "organizer" }).onBeforeHandle(
  { as: "scoped" },
  async (context) => {
    const payload = (context as any).user as JWTPayload;

    if (!payload || payload.role !== "ORGANIZER") {
      (context as any).set.status = 403;
      return errorResponse("Acceso denegado: se requiere rol de organizador", 403);
    }
  },
);

/**
 * Middleware que verifica que el usuario sea VALIDATOR
 * Debe usarse después de authMiddleware
 */
export const validatorMiddleware = new Elysia({ name: "validator" }).onBeforeHandle(
  { as: "scoped" },
  async (context) => {
    const payload = (context as any).user as JWTPayload;

    if (!payload || payload.role !== "VALIDATOR") {
      (context as any).set.status = 403;
      return errorResponse("Acceso denegado: se requiere rol de validador", 403);
    }
  },
);

/**
 * Middleware que verifica que el usuario sea ADMIN o ORGANIZER
 * Útil para endpoints de gestión de eventos
 */
export const organizerOrAdminMiddleware = new Elysia({ name: "organizer-or-admin" }).onBeforeHandle(
  { as: "scoped" },
  async (context) => {
    const payload = (context as any).user as JWTPayload;

    if (!payload || (payload.role !== "ADMIN" && payload.role !== "ORGANIZER")) {
      (context as any).set.status = 403;
      return errorResponse("Acceso denegado: se requiere rol de administrador u organizador", 403);
    }
  },
);

/**
 * Middleware que verifica que el usuario sea ADMIN o VALIDATOR
 * Útil para endpoints de validación de tickets
 */
export const validatorOrAdminMiddleware = new Elysia({ name: "validator-or-admin" }).onBeforeHandle(
  { as: "scoped" },
  async (context) => {
    const payload = (context as any).user as JWTPayload;

    if (!payload || (payload.role !== "ADMIN" && payload.role !== "VALIDATOR")) {
      (context as any).set.status = 403;
      return errorResponse("Acceso denegado: se requiere rol de administrador o validador", 403);
    }
  },
);
