// src/services/payment.service.ts
import type Stripe from "stripe";
import { logger } from "../config/logger";
import { stripe } from "../config/stripe.config";
import type { CheckoutSessionStatus, CreateCheckoutSessionResponse } from "../types/stripe";
import { eventService } from "./event.service";
import { ticketService } from "./ticket.service";

/**
 * Servicio de gestión de pagos con Stripe
 */
class PaymentService {
  /**
   * Crea una Checkout Session de Stripe para comprar un ticket
   *
   * Flow:
   * 1. Validar que el evento existe y está disponible
   * 2. Verificar capacidad disponible
   * 3. Verificar que el usuario no tiene ya un ticket para este evento
   * 4. Crear Checkout Session en Stripe con metadata
   * 5. Retornar sessionId y clientSecret para el frontend
   *
   * @param eventId - ID del evento
   * @param userId - ID del usuario comprando
   * @returns Session ID y Client Secret para inicializar Embedded Checkout
   */
  async createCheckoutSession(eventId: number, userId: number): Promise<CreateCheckoutSessionResponse> {
    try {
      // 1. Obtener datos del evento
      const event = await eventService.getEventById(eventId);

      if (!event.isPublished) {
        throw new Error("El evento no está disponible para compra");
      }

      // 2. Verificar capacidad disponible
      const { available } = await eventService.checkEventCapacity(eventId);

      if (available <= 0) {
        throw new Error("No hay capacidad disponible para este evento");
      }

      // 3. Verificar que el usuario no tenga ya un ticket completado
      const hasExistingTicket = await ticketService.checkExistingTicket(eventId, userId);

      if (hasExistingTicket) {
        throw new Error("Ya tienes un ticket completado para este evento");
      }

      // 4. Calcular precio en centavos (Stripe usa centavos)
      const priceInCents = Math.round(Number.parseFloat(event.price.toString()) * 100);

      if (priceInCents <= 0) {
        throw new Error("El precio del evento no es válido");
      }

      // 5. Crear Checkout Session con Stripe
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: event.name,
                description: event.description || `Ticket para ${event.name}`,
                images: event.imageUrl ? [event.imageUrl] : [],
              },
              unit_amount: priceInCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/cancel`,
        metadata: {
          eventId: eventId.toString(),
          userId: userId.toString(),
          eventName: event.name,
        },
        // Expirar sesión después de 30 minutos
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      });

      logger.info(`Checkout session creada: ${session.id} para evento ${eventId} usuario ${userId}`);

      return {
        sessionId: session.id,
        clientSecret: session.client_secret,
      };
    } catch (error) {
      logger.error("Error creando checkout session:", error);
      throw error;
    }
  }

  /**
   * Verifica el estado de una sesión de checkout
   * Usado por el frontend para confirmar que el pago fue exitoso
   *
   * @param sessionId - ID de la sesión de Stripe
   * @returns Estado de la sesión
   */
  async verifyCheckoutSession(sessionId: string): Promise<CheckoutSessionStatus> {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      return {
        status: session.status || "complete",
        paymentStatus: session.payment_status || "unpaid",
        customerEmail: session.customer_details?.email,
      };
    } catch (error) {
      logger.error("Error verificando checkout session:", error);
      throw new Error("No se pudo verificar la sesión de pago");
    }
  }

  /**
   * Procesa el evento de webhook cuando un checkout se completa exitosamente
   * CRÍTICO: Solo debe crear el ticket si el pago fue exitoso
   *
   * Este método es llamado desde el webhook handler después de verificar
   * la firma del webhook de Stripe.
   *
   * @param session - Sesión de Stripe del webhook
   * @returns Ticket creado
   */
  async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    try {
      const { metadata } = session;

      // Validar que la metadata está completa
      if (!metadata || !metadata.eventId || !metadata.userId) {
        logger.error("Metadata incompleta en session", { sessionId: session.id });
        throw new Error("Metadata inválida en la sesión");
      }

      const eventId = Number.parseInt(metadata.eventId);
      const userId = Number.parseInt(metadata.userId);

      // Validar que los IDs son válidos
      if (isNaN(eventId) || isNaN(userId)) {
        logger.error("IDs inválidos en metadata", { eventId: metadata.eventId, userId: metadata.userId });
        throw new Error("IDs inválidos en metadata");
      }

      // Verificar que el pago fue exitoso
      if (session.payment_status !== "paid") {
        logger.warn(`Pago no completado para session ${session.id}`, {
          paymentStatus: session.payment_status,
        });
        throw new Error(`El pago no está completado: ${session.payment_status}`);
      }

      // Obtener payment_intent ID
      const paymentId =
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

      if (!paymentId) {
        logger.error("No se pudo obtener payment_intent de la sesión", { sessionId: session.id });
        throw new Error("No se pudo obtener el ID del pago");
      }

      // Crear ticket con el pago confirmado
      const ticket = await ticketService.createTicketFromPayment({
        eventId,
        userId,
        paymentId,
        paymentStatus: "completed",
      });

      logger.info(`Ticket creado exitosamente desde pago`, {
        sessionId: session.id,
        ticketCode: ticket.ticketCode,
        eventId,
        userId,
      });

      return ticket;
    } catch (error) {
      logger.error("Error procesando checkout completado:", error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
