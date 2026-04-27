// src/routes/index.ts
import { Elysia } from "elysia";
import { authRoutes } from "./auth.routes";
import { eventRoutes } from "./event.routes";
import { paymentRoutes } from "./payment.routes";
import { ticketRoutes } from "./ticket.routes";
import { webhookRoutes } from "./webhook.routes";

/**
 * Router principal que agrupa todas las rutas de la aplicación
 */
export const routes = new Elysia()
  .use(authRoutes)
  .use(eventRoutes)
  .use(ticketRoutes)
  .use(paymentRoutes)
  .use(webhookRoutes);
