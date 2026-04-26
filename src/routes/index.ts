// src/routes/index.ts
import { Elysia } from "elysia";
import { authRoutes } from "./auth.routes";
import { eventRoutes } from "./event.routes";
import { ticketRoutes } from "./ticket.routes";

/**
 * Router principal que agrupa todas las rutas de la aplicación
 */
export const routes = new Elysia().use(authRoutes).use(eventRoutes).use(ticketRoutes);
