// src/routes/ticket.routes.ts
import { Elysia, t } from "elysia";
import {
  createTicketHandler,
  getMyTicketsHandler,
  getTicketByCodeHandler,
  validateTicketHandler,
} from "../controllers/ticket.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware, validatorOrAdminMiddleware } from "../middlewares/role.middleware";

export const ticketRoutes = new Elysia({ prefix: "/tickets" })
  // Todas las rutas de tickets requieren autenticación
  .use(authMiddleware)
  // GET /tickets/my-tickets - Obtener tickets del usuario
  .get("/my-tickets", getMyTicketsHandler, {
    detail: {
      tags: ["Tickets"],
      summary: "Mis tickets",
      description: "Retorna todos los tickets del usuario autenticado",
      security: [{ bearerAuth: [] }],
    },
  })
  // GET /tickets/:code - Obtener ticket por código
  .get("/:code", getTicketByCodeHandler, {
    params: t.Object({
      code: t.String(),
    }),
    detail: {
      tags: ["Tickets"],
      summary: "Obtener ticket por código",
      description: "Retorna detalle de un ticket específico (debe pertenecer al usuario)",
      security: [{ bearerAuth: [] }],
    },
  })
  // POST /tickets - Crear ticket manual (SOLO ADMIN - DEPRECADO)
  .use(adminMiddleware)
  .post("/", createTicketHandler, {
    body: t.Object({
      eventId: t.Number(),
    }),
    detail: {
      tags: ["Tickets"],
      summary: "[ADMIN ONLY - DEPRECADO] Crear ticket manual",
      description:
        "Crea un ticket manualmente (solo para administradores). DEPRECADO: Los usuarios deben usar el flujo de pagos con Stripe (/payments/create-checkout-session)",
      security: [{ bearerAuth: [] }],
      deprecated: true,
    },
  })
  // POST /tickets/validate/:code - Validar ticket (VALIDATOR/ADMIN)
  .use(validatorOrAdminMiddleware)
  .post("/validate/:code", validateTicketHandler, {
    params: t.Object({
      code: t.String(),
    }),
    detail: {
      tags: ["Tickets"],
      summary: "Validar ticket",
      description: "Marca un ticket como usado (requiere rol VALIDATOR o ADMIN)",
      security: [{ bearerAuth: [] }],
    },
  });
