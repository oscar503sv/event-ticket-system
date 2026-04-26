import { logger } from "../config/logger";
// src/controllers/auth.controller.ts
import { authService } from "../services/auth.service";
import { errorResponse, successResponse } from "../utils/responses";

/**
 * Controlador para registro de usuarios
 */
export async function registerHandler({ body }: { body: any }) {
  try {
    const user = await authService.register(body);

    return successResponse(user, "Usuario registrado exitosamente", 201);
  } catch (error) {
    logger.error("Error en registerHandler:", error);

    if (error instanceof Error && error.message === "El email ya está registrado") {
      return errorResponse(error.message, 409);
    }

    return errorResponse("Error al registrar usuario", 500);
  }
}

/**
 * Controlador para login de usuarios
 */
export async function loginHandler({ body }: { body: any }) {
  try {
    const { user, token } = await authService.login(body.email, body.password);

    return successResponse(
      {
        user,
        token,
      },
      "Login exitoso",
    );
  } catch (error) {
    logger.error("Error en loginHandler:", error);

    if (error instanceof Error && error.message === "Credenciales inválidas") {
      return errorResponse(error.message, 401);
    }

    if (error instanceof Error && error.message === "Usuario inactivo") {
      return errorResponse(error.message, 403);
    }

    return errorResponse("Error al iniciar sesión", 500);
  }
}

/**
 * Controlador para obtener perfil del usuario actual
 */
export async function getMeHandler(context: any) {
  try {
    const profile = await authService.getProfile(context.user.sub);

    return successResponse(profile, "Perfil obtenido exitosamente");
  } catch (error) {
    logger.error("Error en getMeHandler:", error);

    if (error instanceof Error && error.message === "Usuario no encontrado") {
      return errorResponse(error.message, 404);
    }

    return errorResponse("Error al obtener perfil", 500);
  }
}
