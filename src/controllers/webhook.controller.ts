// src/controllers/webhook.controller.ts
import type Stripe from "stripe";
import { logger } from "../config/logger";
import { STRIPE_WEBHOOK_SECRET, stripe } from "../config/stripe.config";
import { paymentService } from "../services/payment.service";
import { errorResponse } from "../utils/responses";

/**
 * POST /webhooks/stripe
 *
 * Recibe y procesa eventos de webhooks de Stripe
 * CRÍTICO: Verifica la firma del webhook para seguridad
 *
 * Este endpoint NO requiere autenticación JWT, la autenticación
 * se hace mediante la verificación de la firma de Stripe
 */
export async function handleStripeWebhookHandler(context: any) {
  // Obtener firma del header
  const signature = context.headers["stripe-signature"];

  if (!signature) {
    logger.error("Webhook recibido sin firma de Stripe");
    context.set.status = 400;
    return errorResponse("Falta firma del webhook");
  }

  // El body debe ser raw string (no JSON parseado)
  const rawBody = context.body;

  if (!rawBody || typeof rawBody !== "string") {
    logger.error("Webhook recibido con body inválido", { bodyType: typeof rawBody });
    context.set.status = 400;
    return errorResponse("Body del webhook inválido");
  }

  let event: Stripe.Event;

  try {
    // CRÍTICO: Verificar la firma del webhook
    // Esto asegura que el evento realmente viene de Stripe
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error: any) {
    logger.error("Error verificando firma de webhook de Stripe", {
      error: error.message,
      signature: signature.substring(0, 20),
    });
    context.set.status = 400;
    return errorResponse("Firma de webhook inválida");
  }

  // Procesar el evento según su tipo
  try {
    logger.info(`Webhook recibido: ${event.type}`, { eventId: event.id });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        logger.info(`Procesando checkout completado: ${session.id}`, {
          paymentStatus: session.payment_status,
          metadata: session.metadata,
        });

        // Crear ticket desde el pago exitoso
        await paymentService.handleCheckoutComplete(session);

        logger.info(`Checkout procesado exitosamente: ${session.id}`);
        break;
      }

      case "checkout.session.expired": {
        const expiredSession = event.data.object as Stripe.Checkout.Session;

        logger.info(`Checkout expirado: ${expiredSession.id}`, {
          metadata: expiredSession.metadata,
        });

        // No hacer nada, la sesión simplemente expiró
        // En el futuro, aquí podrías liberar reservas de capacidad si las implementas
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const asyncSession = event.data.object as Stripe.Checkout.Session;

        logger.info(`Pago asíncrono exitoso: ${asyncSession.id}`);

        // Algunos métodos de pago (como Boleto en Brasil) son asíncronos
        await paymentService.handleCheckoutComplete(asyncSession);
        break;
      }

      case "checkout.session.async_payment_failed": {
        const failedSession = event.data.object as Stripe.Checkout.Session;

        logger.warn(`Pago asíncrono falló: ${failedSession.id}`, {
          metadata: failedSession.metadata,
        });

        // No hacer nada, el pago falló
        break;
      }

      default:
        logger.info(`Evento no manejado: ${event.type}`);
    }

    // IMPORTANTE: Siempre retornar 200 a Stripe
    // Esto confirma que recibimos el webhook
    // Incluso si hay errores en el procesamiento, retornamos 200
    // para evitar que Stripe reintente indefinidamente
    return { received: true, eventType: event.type };
  } catch (error: any) {
    logger.error(`Error procesando webhook ${event.type}`, {
      error: error.message,
      stack: error.stack,
      eventId: event.id,
    });

    // Retornar 200 de todos modos para confirmar recepción
    // Los errores se manejan internamente mediante logs
    return {
      received: true,
      eventType: event.type,
      error: "Error procesando webhook, revisa los logs",
    };
  }
}
