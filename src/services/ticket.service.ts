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
}

export const ticketService = new TicketService();
