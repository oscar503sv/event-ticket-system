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
  // All ticket routes require authentication
  .use(authMiddleware)
  // GET /tickets/my-tickets - Get user's tickets
  .get("/my-tickets", getMyTicketsHandler, {
    detail: {
      tags: ["Tickets"],
      summary: "Get my tickets",
      description:
        "Returns all tickets owned by the authenticated user, including ticket code, QR code, " +
        "event details, purchase date, and usage status.",
      security: [{ bearerAuth: [] }],
    },
  })
  // GET /tickets/:code - Get ticket by code
  .get("/:code", getTicketByCodeHandler, {
    params: t.Object({
      code: t.String(),
    }),
    detail: {
      tags: ["Tickets"],
      summary: "Get ticket by code",
      description:
        "Returns detailed information about a specific ticket using its unique code. " +
        "User can only access their own tickets.",
      security: [{ bearerAuth: [] }],
    },
  })
  // POST /tickets - Manual ticket creation (ADMIN ONLY - DEPRECATED)
  .use(adminMiddleware)
  .post("/", createTicketHandler, {
    body: t.Object({
      eventId: t.Number(),
    }),
    detail: {
      tags: ["Tickets"],
      summary: "[ADMIN ONLY - DEPRECATED] Create ticket manually",
      description:
        "⚠️ DEPRECATED: Manually creates a ticket without payment (admin only). " +
        "Users should use the payment flow instead (/payments/create-checkout-session). " +
        "This endpoint exists only for administrative purposes and testing.",
      security: [{ bearerAuth: [] }],
      deprecated: true,
    },
  })
  // POST /tickets/validate/:code - Validate ticket (VALIDATOR/ADMIN)
  .use(validatorOrAdminMiddleware)
  .post("/validate/:code", validateTicketHandler, {
    params: t.Object({
      code: t.String(),
    }),
    detail: {
      tags: ["Tickets"],
      summary: "Validate ticket",
      description:
        "Marks a ticket as used for event entry. Can only be done once per ticket. " +
        "Requires VALIDATOR or ADMIN role. Records validation timestamp.",
      security: [{ bearerAuth: [] }],
    },
  });
