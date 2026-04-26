// src/middlewares/auth.middleware.ts
import { Elysia } from "elysia";
import type { JWTPayload } from "../types/jwt.d";
import { verifyToken } from "../utils/jwt.util";
import { errorResponse } from "../utils/responses";

/**
 * Middleware de autenticación que verifica el token JWT
 * Extrae el token del header Authorization y lo verifica
 * Si es válido, agrega el usuario al context
 */
export const authMiddleware = new Elysia({ name: "auth" }).derive({ as: "scoped" }, async (context) => {
  // Extraer token del header Authorization
  const authHeader = context.headers.authorization;

  if (!authHeader) {
    (context as any).set.status = 401;
    throw new Error("Token no proporcionado");
  }

  // Verificar formato Bearer
  if (!authHeader.startsWith("Bearer ")) {
    (context as any).set.status = 401;
    throw new Error("Formato de token inválido");
  }

  // Extraer token
  const token = authHeader.substring(7);

  // Verificar token
  const payload = await verifyToken(token);

  if (!payload) {
    (context as any).set.status = 401;
    throw new Error("Token inválido o expirado");
  }

  // Retornar el payload para agregarlo al context
  return {
    user: payload as JWTPayload,
  };
});
