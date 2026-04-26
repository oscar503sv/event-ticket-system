// src/routes/auth.routes.ts
import { Elysia, t } from "elysia";
import { getMeHandler, loginHandler, registerHandler } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { loginUserSchema, registerUserSchema } from "../schemas/user.schema";

export const authRoutes = new Elysia({ prefix: "/auth" })
  // POST /auth/register - Registro de usuarios
  .post("/register", registerHandler, {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 8 }),
      firstName: t.String({ minLength: 2 }),
      lastName: t.String({ minLength: 2 }),
      role: t.Optional(
        t.Union([t.Literal("USER"), t.Literal("ORGANIZER"), t.Literal("VALIDATOR"), t.Literal("ADMIN")]),
      ),
    }),
    detail: {
      tags: ["Auth"],
      summary: "Registrar nuevo usuario",
      description: "Crea una nueva cuenta de usuario",
    },
  })
  // POST /auth/login - Inicio de sesión
  .post("/login", loginHandler, {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 1 }),
    }),
    detail: {
      tags: ["Auth"],
      summary: "Iniciar sesión",
      description: "Autentica un usuario y retorna un token JWT",
    },
  })
  // GET /auth/me - Obtener perfil del usuario actual (protegido)
  .use(authMiddleware)
  .get("/me", getMeHandler, {
    detail: {
      tags: ["Auth"],
      summary: "Obtener perfil actual",
      description: "Retorna los datos del usuario autenticado",
      security: [{ bearerAuth: [] }],
    },
  });
