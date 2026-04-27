// src/controllers/payment.controller.ts
import { logger } from "../config/logger";
import { paymentService } from "../services/payment.service";
import { errorResponse, successResponse } from "../utils/responses";

/**
 * POST /payments/create-checkout-session
 * Body: { eventId: number }
 * Headers: Authorization Bearer token
 *
 * Crea una sesión de Stripe Checkout para comprar un ticket de evento
 */
export async function createCheckoutSessionHandler(context: any) {
  try {
    const { eventId } = context.body;
    const userId = context.user.sub; // Del authMiddleware

    // Validación adicional (Zod ya valida, pero por seguridad)
    if (!eventId || typeof eventId !== "number") {
      context.set.status = 400;
      return errorResponse("eventId es requerido y debe ser un número");
    }

    // Crear sesión de checkout
    const session = await paymentService.createCheckoutSession(eventId, userId);

    return successResponse(session, "Sesión de checkout creada exitosamente", 201);
  } catch (error: any) {
    logger.error("Error en createCheckoutSessionHandler:", error);

    // Determinar status code según el error
    if (error.message.includes("capacidad")) {
      context.set.status = 409;
    } else if (error.message.includes("Ya tienes un ticket")) {
      context.set.status = 409;
    } else if (error.message.includes("no está disponible")) {
      context.set.status = 404;
    } else {
      context.set.status = 500;
    }

    return errorResponse(error.message || "Error creando sesión de checkout");
  }
}

/**
 * GET /payments/verify/:sessionId
 * Headers: Authorization Bearer token
 *
 * Verifica el estado de una sesión de checkout
 * Usado por el frontend para confirmar que el pago fue exitoso
 */
export async function verifyCheckoutSessionHandler(context: any) {
  try {
    const { sessionId } = context.params;
    const userId = context.user.sub;

    if (!sessionId) {
      context.set.status = 400;
      return errorResponse("sessionId es requerido");
    }

    // Verificar estado de la sesión
    const sessionData = await paymentService.verifyCheckoutSession(sessionId);

    logger.info(`Sesión verificada: ${sessionId} por usuario ${userId}`);

    return successResponse(sessionData, "Estado de sesión obtenido");
  } catch (error: any) {
    logger.error("Error en verifyCheckoutSessionHandler:", error);
    context.set.status = 404;
    return errorResponse(error.message || "Sesión no encontrada");
  }
}
