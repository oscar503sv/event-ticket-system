// src/routes/payment.routes.ts
import { Elysia, t } from "elysia";
import { createCheckoutSessionHandler, verifyCheckoutSessionHandler } from "../controllers/payment.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createCheckoutSessionSchema } from "../schemas/payment.schema";

/**
 * Payment routes with Stripe
 * All routes are protected with JWT authentication
 */
export const paymentRoutes = new Elysia({ prefix: "/payments" })
  .use(authMiddleware)
  // POST /payments/create-checkout-session - Create Stripe Checkout session
  .post("/create-checkout-session", createCheckoutSessionHandler, {
    body: t.Object({
      eventId: t.Number({ minimum: 1 }),
    }),
    detail: {
      tags: ["Payments"],
      summary: "Create Stripe Checkout session",
      description:
        "Creates a Stripe Checkout Session for purchasing event tickets. " +
        "Returns sessionId and clientSecret for redirecting user to Stripe's hosted checkout page. " +
        "After successful payment, a webhook automatically creates the ticket.",
      security: [{ bearerAuth: [] }],
    },
  })
  // GET /payments/verify/:sessionId - Verify checkout session status
  .get("/verify/:sessionId", verifyCheckoutSessionHandler, {
    params: t.Object({
      sessionId: t.String({ minLength: 1 }),
    }),
    detail: {
      tags: ["Payments"],
      summary: "Verify payment session",
      description:
        "Verifies the status of a Stripe Checkout Session. " +
        "Returns payment status and session details. Use this to confirm successful payment.",
      security: [{ bearerAuth: [] }],
    },
  });
