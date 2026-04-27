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
  // GET /events - List all events (public)
  .get("/", listEventsHandler, {
    detail: {
      tags: ["Events"],
      summary: "List all published events",
      description:
        "Returns list of all published events with complete information including available capacity. " +
        "No authentication required.",
    },
  })
  // GET /events/upcoming - List upcoming events (public)
  .get("/upcoming", listUpcomingEventsHandler, {
    detail: {
      tags: ["Events"],
      summary: "List upcoming events",
      description:
        "Returns events with start date in the future. Useful for showing users what events they can purchase tickets for. " +
        "No authentication required.",
    },
  })
  // GET /events/:id - Get event by ID (public)
  .get("/:id", getEventHandler, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      tags: ["Events"],
      summary: "Get event by ID",
      description:
        "Returns detailed information about a specific event including name, description, location, dates, capacity, and price. " +
        "No authentication required.",
    },
  })
  // Protected routes - require authentication and ORGANIZER or ADMIN role
  .use(authMiddleware)
  .use(organizerOrAdminMiddleware)
  // POST /events - Create event (ORGANIZER/ADMIN)
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
      startDate: t.String({ format: "date-time" }),
      endDate: t.String({ format: "date-time" }),
      imageUrl: t.Optional(t.String({ format: "uri" })),
      capacity: t.Number({ minimum: 1 }),
      price: t.Number({ minimum: 0 }),
      isPublished: t.Optional(t.Boolean()),
    }),
    detail: {
      tags: ["Events"],
      summary: "Create new event",
      description:
        "Creates a new event. Only users with ORGANIZER or ADMIN role can create events. " +
        "Dates must be in ISO 8601 format. Price is in USD. Default isPublished is true.",
      security: [{ bearerAuth: [] }],
    },
  })
  // PUT /events/:id - Update event (ORGANIZER/ADMIN)
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
        startDate: t.String({ format: "date-time" }),
        endDate: t.String({ format: "date-time" }),
        imageUrl: t.String({ format: "uri" }),
        capacity: t.Number({ minimum: 1 }),
        price: t.Number({ minimum: 0 }),
        isPublished: t.Boolean(),
      }),
    ),
    detail: {
      tags: ["Events"],
      summary: "Update existing event",
      description:
        "Updates an existing event. All fields are optional (partial update). " +
        "Only users with ORGANIZER or ADMIN role can update events.",
      security: [{ bearerAuth: [] }],
    },
  })
  // DELETE /events/:id - Delete event (ORGANIZER/ADMIN)
  .delete("/:id", deleteEventHandler, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      tags: ["Events"],
      summary: "Delete event",
      description:
        "Soft deletes an event (marks as deleted but keeps in database). " +
        "Only users with ORGANIZER or ADMIN role can delete events.",
      security: [{ bearerAuth: [] }],
    },
  });
