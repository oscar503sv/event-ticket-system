// src/routes/event.routes.ts
import { Elysia, t } from "elysia";
import {
  createEventHandler,
  deleteEventHandler,
  getEventHandler,
  listEventsHandler,
  listUpcomingEventsHandler,
  updateEventHandler,
} from "../controllers/event.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { organizerOrAdminMiddleware } from "../middlewares/role.middleware";

export const eventRoutes = new Elysia({ prefix: "/events" })
  // GET /events - Listar todos los eventos (público)
  .get("/", listEventsHandler, {
    detail: {
      tags: ["Events"],
      summary: "Listar todos los eventos",
      description: "Retorna lista de eventos publicados",
    },
  })
  // GET /events/upcoming - Listar eventos futuros (público)
  .get("/upcoming", listUpcomingEventsHandler, {
    detail: {
      tags: ["Events"],
      summary: "Listar eventos futuros",
      description: "Retorna eventos con fecha de inicio futura",
    },
  })
  // GET /events/:id - Obtener evento por ID (público)
  .get("/:id", getEventHandler, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      tags: ["Events"],
      summary: "Obtener evento por ID",
      description: "Retorna detalle de un evento específico",
    },
  })
  // Rutas protegidas - requieren autenticación y rol ORGANIZER o ADMIN
  .use(authMiddleware)
  .use(organizerOrAdminMiddleware)
  // POST /events - Crear evento (ORGANIZER/ADMIN)
  .post("/", createEventHandler, {
    body: t.Object({
      name: t.String({ minLength: 3 }),
      type: t.Union([
        t.Literal("Concierto"),
        t.Literal("Festival"),
        t.Literal("Conferencia"),
        t.Literal("Taller"),
        t.Literal("Deportivo"),
        t.Literal("Otro"),
      ]),
      description: t.Optional(t.String()),
      location: t.String({ minLength: 3 }),
      startDate: t.String(),
      endDate: t.String(),
      imageUrl: t.Optional(t.String()),
      capacity: t.Number({ minimum: 1 }),
      price: t.Number({ minimum: 0 }),
      isPublished: t.Optional(t.Boolean()),
    }),
    detail: {
      tags: ["Events"],
      summary: "Crear evento",
      description: "Crea un nuevo evento (requiere rol ORGANIZER o ADMIN)",
      security: [{ bearerAuth: [] }],
    },
  })
  // PUT /events/:id - Actualizar evento (ORGANIZER/ADMIN)
  .put("/:id", updateEventHandler, {
    params: t.Object({
      id: t.String(),
    }),
    body: t.Partial(
      t.Object({
        name: t.String({ minLength: 3 }),
        type: t.Union([
          t.Literal("Concierto"),
          t.Literal("Festival"),
          t.Literal("Conferencia"),
          t.Literal("Taller"),
          t.Literal("Deportivo"),
          t.Literal("Otro"),
        ]),
        description: t.String(),
        location: t.String({ minLength: 3 }),
        startDate: t.String(),
        endDate: t.String(),
        imageUrl: t.String(),
        capacity: t.Number({ minimum: 1 }),
        price: t.Number({ minimum: 0 }),
        isPublished: t.Boolean(),
      }),
    ),
    detail: {
      tags: ["Events"],
      summary: "Actualizar evento",
      description: "Actualiza un evento existente (requiere rol ORGANIZER o ADMIN)",
      security: [{ bearerAuth: [] }],
    },
  })
  // DELETE /events/:id - Eliminar evento (ORGANIZER/ADMIN)
  .delete("/:id", deleteEventHandler, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      tags: ["Events"],
      summary: "Eliminar evento",
      description: "Elimina (soft delete) un evento (requiere rol ORGANIZER o ADMIN)",
      security: [{ bearerAuth: [] }],
    },
  });
