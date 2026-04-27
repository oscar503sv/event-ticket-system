import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { swagger } from "@elysiajs/swagger";
// src/config/server.ts
import { Elysia } from "elysia";
import { errorMiddleware } from "../middlewares/error.middleware";
import { routes } from "../routes";
import { logger } from "./logger";

export function createServer() {
  const app = new Elysia()
    .use(cors())
    .use(
      jwt({
        name: "jwt",
        secret: process.env.JWT_SECRET || "your_super_secret_key_change_in_production",
      }),
    )
    .use(
      swagger({
        path: "/docs",
        documentation: {
          info: {
            title: "Event Ticket Management API",
            version: "1.0.0",
            description:
              "Complete backend API for event management, ticket sales, and Stripe payment processing. " +
              "All endpoints return standardized responses with { success, message, data } structure.",
          },
          tags: [
            { name: "Auth", description: "User authentication and registration" },
            { name: "Events", description: "Event management (CRUD operations)" },
            { name: "Tickets", description: "Ticket management and validation" },
            { name: "Payments", description: "Stripe payment processing" },
            { name: "Webhooks", description: "Stripe webhook handlers" },
          ],
          components: {
            securitySchemes: {
              bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "JWT token obtained from /auth/login endpoint",
              },
            },
          },
          servers: [
            {
              url: "http://localhost:3000",
              description: "Development server",
            },
          ],
        },
      }),
    )
    // Registrar todas las rutas
    .use(routes)
    // Error middleware global (debe ir al final)
    .use(errorMiddleware);

  logger.info("Servidor configurado correctamente");

  return app;
}
