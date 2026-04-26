// src/routes/webhook.routes.ts
import { Elysia, t } from "elysia";
import { handleStripeWebhookHandler } from "../controllers/webhook.controller";
import { stripeWebhookMiddleware } from "../middlewares/stripe-webhook.middleware";

/**
 * Rutas de webhooks
 * IMPORTANTE: El endpoint de webhook NO debe tener autenticación JWT
 * La autenticación se realiza mediante verificación de firma de Stripe
 */
export const webhookRoutes = new Elysia({ prefix: "/webhooks" })
  // POST /webhooks/stripe - Webhook de Stripe (sin auth JWT, usa firma)
  .use(stripeWebhookMiddleware)
  .post("/stripe", handleStripeWebhookHandler, {
    body: t.Any(), // Raw body preservado para verificación de firma
    headers: t.Object({
      "stripe-signature": t.String(),
    }),
    detail: {
      tags: ["Webhooks"],
      summary: "Webhook de Stripe",
      description:
        "Endpoint para recibir eventos de Stripe (checkout.session.completed, etc). Requiere verificación de firma.",
    },
  });
