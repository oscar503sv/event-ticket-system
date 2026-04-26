// src/middlewares/stripe-webhook.middleware.ts
import { Elysia } from "elysia";

/**
 * Middleware para webhooks de Stripe
 * Preserva el raw body necesario para la verificación de firma
 *
 * IMPORTANTE: Stripe requiere el raw body (no JSON parseado) para
 * verificar la firma del webhook con stripe.webhooks.constructEvent()
 */
export const stripeWebhookMiddleware = new Elysia({ name: "stripe-webhook" }).derive(
  { as: "scoped" },
  async (context) => {
    // El raw body ya está disponible en context.body para webhooks
    // Elysia preserva el raw body cuando el Content-Type es application/json
    return {
      rawBody: context.body,
    };
  },
);
