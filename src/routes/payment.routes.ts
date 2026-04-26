// src/routes/payment.routes.ts
import { Elysia, t } from "elysia";
import { createCheckoutSessionHandler, verifyCheckoutSessionHandler } from "../controllers/payment.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createCheckoutSessionSchema } from "../schemas/payment.schema";

/**
 * Rutas de pagos con Stripe
 * Todas las rutas están protegidas con autenticación JWT
 */
export const paymentRoutes = new Elysia({ prefix: "/payments" })
  .use(authMiddleware)
  // POST /payments/create-checkout-session - Crear sesión de Stripe Checkout
  .post("/create-checkout-session", createCheckoutSessionHandler, {
    body: t.Object({
      eventId: t.Number({ minimum: 1 }),
      quantity: t.Number({ minimum: 1, maximum: 10 }),
      successUrl: t.Optional(t.String({ format: "uri" })),
      cancelUrl: t.Optional(t.String({ format: "uri" })),
    }),
    detail: {
      tags: ["Payments"],
      summary: "Crear sesión de pago Stripe",
      description: "Crea una sesión de Stripe Checkout para comprar tickets de un evento",
      security: [{ bearerAuth: [] }],
    },
  })
  // GET /payments/verify/:sessionId - Verificar estado de sesión de pago
  .get("/verify/:sessionId", verifyCheckoutSessionHandler, {
    params: t.Object({
      sessionId: t.String({ minLength: 1 }),
    }),
    detail: {
      tags: ["Payments"],
      summary: "Verificar sesión de pago",
      description: "Verifica el estado de una sesión de pago de Stripe",
      security: [{ bearerAuth: [] }],
    },
  });
