// src/types/context.d.ts
import type { JWTPayload } from "./jwt.d";

/**
 * Extensión del contexto de Elysia para incluir el usuario autenticado
 * Esta interfaz se usa para tipar el contexto después de pasar por authMiddleware
 */
export interface AuthContext {
  user: JWTPayload;
}
