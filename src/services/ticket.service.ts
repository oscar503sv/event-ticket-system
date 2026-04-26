// src/services/ticket.service.ts
import { and, eq } from "drizzle-orm";
import { logger } from "../config/logger";
import { db } from "../db";
import { tickets } from "../db/tables/tickets";
import type { NewTicket, Ticket } from "../models/ticket.model";
import { generateQR } from "../utils/qr.util";
import { eventService } from "./event.service";

/**
 * Servicio de gestión de tickets
 */
class TicketService {
  /**
   * Crea un nuevo ticket para un evento
   * Implementa toda la lógica de negocio: verificación de capacidad, duplicados, generación de QR
   */
  async createTicket(eventId: number, userId: number): Promise<Ticket> {
    try {
      // 1. Verificar que el evento existe y está publicado
      const event = await eventService.getEventById(eventId);

      if (!event.isPublished) {
        throw new Error("El evento no está disponible");
      }

      // 2. Verificar capacidad disponible
      const { available } = await eventService.checkEventCapacity(eventId);

      if (available <= 0) {
        throw new Error("No hay capacidad disponible para este evento");
      }

      // 3. Verificar que el usuario no tiene ya un ticket activo para este evento
      const existingTicket = await db
        .select()
        .from(tickets)
        .where(and(eq(tickets.eventId, eventId), eq(tickets.userId, userId), eq(tickets.isUsed, false)))
        .limit(1);

      if (existingTicket.length > 0) {
        throw new Error("Ya tienes un ticket activo para este evento");
      }

      // 4. Generar código único de ticket
      const ticketCode = await this.generateUniqueTicketCode();

      // 5. Generar código QR
      const qrCode = await generateQR(ticketCode);

      // 6. Crear ticket en BD
      const newTicket: NewTicket = {
        eventId,
        userId,
        ticketCode,
        qrCode,
        isUsed: false,
        paymentStatus: "pending", // Campo presente pero sin lógica de pago
      };

      const [createdTicket] = await db.insert(tickets).values(newTicket).returning();

      logger.info(`Ticket creado: ${createdTicket.ticketCode} para evento ${eventId}`);

      return createdTicket;
    } catch (error) {
      logger.error("Error creando ticket:", error);
      throw error;
    }
  }

  /**
   * Genera un código único de ticket
   * Formato: EVT-{timestamp}-{random}
   */
  private async generateUniqueTicketCode(maxRetries = 5): Promise<string> {
    for (let i = 0; i < maxRetries; i++) {
      // Generar código: EVT-{timestamp}-{random}
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const code = `EVT-${timestamp}-${random}`;

      // Verificar que no existe en BD
      const existing = await db.select().from(tickets).where(eq(tickets.ticketCode, code)).limit(1);

      if (existing.length === 0) {
        return code;
      }

      // Si existe, reintentar
      logger.warn(`Código de ticket duplicado: ${code}, reintentando...`);
    }

    throw new Error("No se pudo generar un código único de ticket");
  }

  /**
   * Obtiene todos los tickets de un usuario
   */
  async getUserTickets(userId: number): Promise<Ticket[]> {
    try {
      const userTickets = await db.select().from(tickets).where(eq(tickets.userId, userId));

      return userTickets;
    } catch (error) {
      logger.error("Error obteniendo tickets del usuario:", error);
      throw error;
    }
  }

  /**
   * Obtiene un ticket por su código
   * Verifica que pertenezca al usuario (seguridad)
   */
  async getTicketByCode(code: string, userId: number): Promise<Ticket> {
    try {
      const [ticket] = await db
        .select()
        .from(tickets)
        .where(and(eq(tickets.ticketCode, code), eq(tickets.userId, userId)))
        .limit(1);

      if (!ticket) {
        throw new Error("Ticket no encontrado o no pertenece al usuario");
      }

      return ticket;
    } catch (error) {
      logger.error("Error obteniendo ticket por código:", error);
      throw error;
    }
  }

  /**
   * Valida un ticket (marca como usado)
   * Solo puede ser llamado por VALIDATOR o ADMIN
   */
  async validateTicket(code: string, validatorId: number): Promise<Ticket> {
    try {
      // Buscar ticket por código
      const [ticket] = await db.select().from(tickets).where(eq(tickets.ticketCode, code)).limit(1);

      if (!ticket) {
        throw new Error("Ticket no encontrado");
      }

      // Verificar que no está usado
      if (ticket.isUsed) {
        throw new Error("Este ticket ya ha sido utilizado");
      }

      // Marcar como usado
      const [validatedTicket] = await db
        .update(tickets)
        .set({
          isUsed: true,
          usedDate: new Date(),
        })
        .where(eq(tickets.id, ticket.id))
        .returning();

      logger.info(`Ticket validado: ${code} por usuario ${validatorId}`);

      return validatedTicket;
    } catch (error) {
      logger.error("Error validando ticket:", error);
      throw error;
    }
  }

  /**
   * Obtiene un ticket por código sin restricciones de usuario
   * Para uso administrativo
   */
  async getTicketByCodeAdmin(code: string): Promise<Ticket> {
    try {
      const [ticket] = await db.select().from(tickets).where(eq(tickets.ticketCode, code)).limit(1);

      if (!ticket) {
        throw new Error("Ticket no encontrado");
      }

      return ticket;
    } catch (error) {
      logger.error("Error obteniendo ticket (admin):", error);
      throw error;
    }
  }

  /**
   * Crea un ticket después de un pago exitoso
   * Solo debe ser llamado desde el webhook handler de Stripe
   *
   * Incluye validaciones de seguridad:
   * - Re-valida capacidad disponible
   * - Previene duplicados por paymentId (idempotencia)
   *
   * @param data - Datos del pago para crear el ticket
   * @returns Ticket creado
   */
  async createTicketFromPayment(data: {
    eventId: number;
    userId: number;
    paymentId: string;
    paymentStatus: "completed";
  }): Promise<Ticket> {
    try {
      // 1. Re-validar capacidad (por si cambió durante el checkout)
      const { available } = await eventService.checkEventCapacity(data.eventId);

      if (available <= 0) {
        // Si no hay capacidad, el ticket no se crea
        // NOTA: En este caso, considerar implementar reembolso automático
        logger.error(`Sin capacidad al crear ticket desde pago`, {
          eventId: data.eventId,
          paymentId: data.paymentId,
        });
        throw new Error("No hay capacidad disponible - se requiere reembolso");
      }

      // 2. Verificar duplicados por paymentId (idempotencia para webhooks)
      const existingByPayment = await db.select().from(tickets).where(eq(tickets.paymentId, data.paymentId)).limit(1);

      if (existingByPayment.length > 0) {
        logger.warn(`Ticket ya existe para paymentId: ${data.paymentId}`, {
          ticketCode: existingByPayment[0].ticketCode,
        });
        return existingByPayment[0];
      }

      // 3. Generar código único y QR
      const ticketCode = await this.generateUniqueTicketCode();
      const qrCode = await generateQR(ticketCode);

      // 4. Crear ticket en base de datos
      const newTicket: NewTicket = {
        eventId: data.eventId,
        userId: data.userId,
        ticketCode,
        qrCode,
        isUsed: false,
        paymentId: data.paymentId,
        paymentStatus: data.paymentStatus,
      };

      const [createdTicket] = await db.insert(tickets).values(newTicket).returning();

      logger.info(`Ticket creado desde pago exitoso`, {
        ticketCode: createdTicket.ticketCode,
        eventId: data.eventId,
        userId: data.userId,
        paymentId: data.paymentId,
      });

      return createdTicket;
    } catch (error) {
      logger.error("Error creando ticket desde pago:", error);
      throw error;
    }
  }

  /**
   * Verifica si un usuario ya tiene un ticket completado para un evento
   * Usado para prevenir compras duplicadas
   *
   * @param eventId - ID del evento
   * @param userId - ID del usuario
   * @returns true si ya tiene un ticket completado
   */
  async checkExistingTicket(eventId: number, userId: number): Promise<boolean> {
    try {
      const existing = await db
        .select()
        .from(tickets)
        .where(and(eq(tickets.eventId, eventId), eq(tickets.userId, userId), eq(tickets.paymentStatus, "completed")))
        .limit(1);

      return existing.length > 0;
    } catch (error) {
      logger.error("Error verificando ticket existente:", error);
      throw error;
    }
  }
}

export const ticketService = new TicketService();
