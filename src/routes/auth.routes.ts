// src/routes/auth.routes.ts
import { Elysia, t } from "elysia";
import { getMeHandler, loginHandler, registerHandler } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { loginUserSchema, registerUserSchema } from "../schemas/user.schema";

export const authRoutes = new Elysia({ prefix: "/auth" })
  // POST /auth/register - User registration
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
      summary: "Register new user",
      description:
        "Creates a new user account. Default role is USER if not specified. " +
        "Returns user data and JWT token for immediate authentication.",
    },
  })
  // POST /auth/login - User login
  .post("/login", loginHandler, {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 1 }),
    }),
    detail: {
      tags: ["Auth"],
      summary: "User login",
      description:
        "Authenticates user credentials and returns a JWT token. " +
        "Token expires in 24 hours (configurable via JWT_EXPIRES_IN env var).",
    },
  })
  // GET /auth/me - Get current user profile (protected)
  .use(authMiddleware)
  .get("/me", getMeHandler, {
    detail: {
      tags: ["Auth"],
      summary: "Get current user profile",
      description: "Returns authenticated user's data including ID, email, name, role, and account status.",
      security: [{ bearerAuth: [] }],
    },
  });
