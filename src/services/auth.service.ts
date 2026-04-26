// src/services/auth.service.ts
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { logger } from "../config/logger";
import { db } from "../db";
import { users } from "../db/tables/users";
import type { NewUser, User } from "../models/user.model";
import { signToken } from "../utils/jwt.util";

/**
 * Servicio de autenticación
 */
class AuthService {
  /**
   * Registra un nuevo usuario
   * @param data - Datos del usuario a registrar
   * @returns Usuario creado (sin password)
   */
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: "USER" | "ORGANIZER" | "VALIDATOR" | "ADMIN";
  }): Promise<Omit<User, "password">> {
    try {
      // Verificar si el email ya existe
      const existingUser = await db.select().from(users).where(eq(users.email, data.email)).limit(1);

      if (existingUser.length > 0) {
        throw new Error("El email ya está registrado");
      }

      // Hash del password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Crear usuario
      const newUser: NewUser = {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || "USER",
        isActive: true,
      };

      const [createdUser] = await db.insert(users).values(newUser).returning();

      logger.info(`Usuario registrado: ${createdUser.email}`);

      // Retornar usuario sin password
      const { password: _, ...userWithoutPassword } = createdUser;
      return userWithoutPassword;
    } catch (error) {
      logger.error("Error en registro de usuario:", error);
      throw error;
    }
  }

  /**
   * Inicia sesión de un usuario
   * @param email - Email del usuario
   * @param password - Contraseña del usuario
   * @returns Usuario y token JWT
   */
  async login(email: string, password: string): Promise<{ user: Omit<User, "password">; token: string }> {
    try {
      // Buscar usuario por email
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      if (!user) {
        throw new Error("Credenciales inválidas");
      }

      // Verificar que el usuario esté activo
      if (!user.isActive) {
        throw new Error("Usuario inactivo");
      }

      // Verificar password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new Error("Credenciales inválidas");
      }

      // Generar token JWT
      const token = await signToken({
        sub: user.id,
        role: user.role,
      });

      logger.info(`Usuario autenticado: ${user.email}`);

      // Retornar usuario sin password y token
      const { password: _, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        token,
      };
    } catch (error) {
      logger.error("Error en login:", error);
      throw error;
    }
  }

  /**
   * Obtiene el perfil de un usuario por ID
   * @param userId - ID del usuario
   * @returns Datos del usuario (sin password)
   */
  async getProfile(userId: number): Promise<Omit<User, "password">> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      if (!user) {
        throw new Error("Usuario no encontrado");
      }

      // Retornar usuario sin password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      logger.error("Error obteniendo perfil:", error);
      throw error;
    }
  }
}

export const authService = new AuthService();
