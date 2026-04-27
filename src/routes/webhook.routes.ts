// src/routes/webhook.routes.ts
import { Elysia } from "elysia";
import { handleStripeWebhookHandler } from "../controllers/webhook.controller";

/**
 * Webhook routes
 * IMPORTANT: Webhook endpoint does NOT use JWT authentication
 * Authentication is performed via Stripe signature verification
 *
 * NOTE: We use onRequest to capture raw body BEFORE Elysia parses it
 */
export const webhookRoutes = new Elysia({ prefix: "/webhooks" })
  .onRequest(async ({ request }) => {
    // Only capture raw body for Stripe webhook endpoint
    const url = new URL(request.url);
    if (url.pathname === "/webhooks/stripe" && request.method === "POST") {
      // Capture raw body before Elysia parses it
      const rawBody = await request.text();
      // Store in custom request property
      (request as any).rawBody = rawBody;
    }
  })
  .post("/stripe", handleStripeWebhookHandler, {
    detail: {
      tags: ["Webhooks"],
      summary: "Stripe webhook endpoint",
      description:
        "Receives and processes Stripe webhook events (checkout.session.completed, etc). " +
        "This endpoint does NOT require JWT authentication. Instead, it uses Stripe signature verification " +
        "via the 'stripe-signature' header. Automatically creates tickets after successful payments.",
    },
  });
