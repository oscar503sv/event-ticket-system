// src/routes/webhook.routes.ts
import { Elysia } from "elysia";
import { handleStripeWebhookHandler } from "../controllers/webhook.controller";

/**
 * Rutas de webhooks
 * IMPORTANTE: El endpoint de webhook NO debe tener autenticación JWT
 * La autenticación se realiza mediante verificación de firma de Stripe
 *
 * NOTA: Usamos onRequest para capturar el raw body ANTES de que Elysia lo parsee
 */
export const webhookRoutes = new Elysia({ prefix: "/webhooks" })
  .onRequest(async ({ request }) => {
    // Solo capturar raw body para el endpoint de webhook de Stripe
    const url = new URL(request.url);
    if (url.pathname === "/webhooks/stripe" && request.method === "POST") {
      // Capturar el raw body antes de que Elysia lo parsee
      const rawBody = await request.text();
      // Almacenar en una propiedad custom del request
      (request as any).rawBody = rawBody;
    }
  })
  .post("/stripe", handleStripeWebhookHandler, {
    detail: {
      tags: ["Webhooks"],
      summary: "Webhook de Stripe",
      description:
        "Endpoint para recibir eventos de Stripe (checkout.session.completed, etc). Requiere verificación de firma.",
    },
  });
