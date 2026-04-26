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
            title: "API de Gestión de Eventos y Tickets",
            version: "1.0.0",
            description: "API para gestionar eventos, tickets y pagos con autenticación JWT",
          },
          tags: [
            { name: "Auth", description: "Autenticación de usuarios" },
            { name: "Events", description: "Gestión de eventos" },
            { name: "Tickets", description: "Gestión de tickets" },
          ],
          components: {
            securitySchemes: {
              bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
              },
            },
          },
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
