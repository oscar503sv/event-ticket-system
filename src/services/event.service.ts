// src/services/event.service.ts
import { and, eq, gt, sql } from "drizzle-orm";
import { logger } from "../config/logger";
import { db } from "../db";
import { events } from "../db/tables/events";
import { tickets } from "../db/tables/tickets";
import type { Event, NewEvent } from "../models/event.model";

/**
 * Servicio de gestión de eventos
 */
class EventService {
  /**
   * Crea un nuevo evento
   */
  async createEvent(
    data: {
      name: string;
      type: "Concierto" | "Festival" | "Conferencia" | "Taller" | "Deportivo" | "Otro";
      description?: string;
      location: string;
      startDate: Date;
      endDate: Date;
      imageUrl?: string;
      capacity: number;
      price: number;
      isPublished?: boolean;
    },
    organizerId: number,
  ): Promise<Event> {
    try {
      // Validar que startDate < endDate
      if (data.startDate >= data.endDate) {
        throw new Error("La fecha de inicio debe ser anterior a la fecha de fin");
      }

      const newEvent: NewEvent = {
        ...data,
        organizerId,
        price: data.price.toString(),
        isPublished: data.isPublished ?? true,
      };

      const [createdEvent] = await db.insert(events).values(newEvent).returning();

      logger.info(`Evento creado: ${createdEvent.name} (ID: ${createdEvent.id})`);

      return createdEvent;
    } catch (error) {
      logger.error("Error creando evento:", error);
      throw error;
    }
  }

  /**
   * Obtiene todos los eventos publicados
   */
  async getAllEvents(): Promise<Event[]> {
    try {
      const allEvents = await db.select().from(events).where(eq(events.isPublished, true)).orderBy(events.startDate);

      return allEvents;
    } catch (error) {
      logger.error("Error obteniendo eventos:", error);
      throw error;
    }
  }

  /**
   * Obtiene eventos futuros (upcoming)
   */
  async getUpcomingEvents(): Promise<Event[]> {
    try {
      const now = new Date();

      const upcomingEvents = await db
        .select()
        .from(events)
        .where(and(eq(events.isPublished, true), gt(events.startDate, now)))
        .orderBy(events.startDate);

      return upcomingEvents;
    } catch (error) {
      logger.error("Error obteniendo eventos futuros:", error);
      throw error;
    }
  }

  /**
   * Obtiene un evento por ID
   */
  async getEventById(id: number): Promise<Event> {
    try {
      const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);

      if (!event) {
        throw new Error("Evento no encontrado");
      }

      return event;
    } catch (error) {
      logger.error("Error obteniendo evento:", error);
      throw error;
    }
  }

  /**
   * Actualiza un evento
   */
  async updateEvent(id: number, data: Partial<NewEvent>): Promise<Event> {
    try {
      // Verificar que el evento existe
      await this.getEventById(id);

      // Si se actualizan las fechas, validar
      if (data.startDate && data.endDate && data.startDate >= data.endDate) {
        throw new Error("La fecha de inicio debe ser anterior a la fecha de fin");
      }

      // Convertir price a string si existe
      if (data.price) {
        data.price = data.price.toString() as any;
      }

      const [updatedEvent] = await db
        .update(events)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(events.id, id))
        .returning();

      logger.info(`Evento actualizado: ${updatedEvent.name} (ID: ${updatedEvent.id})`);

      return updatedEvent;
    } catch (error) {
      logger.error("Error actualizando evento:", error);
      throw error;
    }
  }

  /**
   * Elimina un evento (soft delete)
   */
  async deleteEvent(id: number): Promise<void> {
    try {
      // Verificar que el evento existe
      await this.getEventById(id);

      // Soft delete: marcar como no publicado
      await db.update(events).set({ isPublished: false, updatedAt: new Date() }).where(eq(events.id, id));

      logger.info(`Evento eliminado (soft delete): ID ${id}`);
    } catch (error) {
      logger.error("Error eliminando evento:", error);
      throw error;
    }
  }

  /**
   * Verifica la capacidad disponible de un evento
   */
  async checkEventCapacity(eventId: number): Promise<{ available: number; total: number; sold: number }> {
    try {
      const event = await this.getEventById(eventId);

      // Contar tickets activos (no usados)
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tickets)
        .where(and(eq(tickets.eventId, eventId), eq(tickets.isUsed, false)));

      const soldTickets = Number(result?.count) || 0;
      const totalCapacity = event.capacity;
      const available = totalCapacity - soldTickets;

      return {
        available: available > 0 ? available : 0,
        total: totalCapacity,
        sold: soldTickets,
      };
    } catch (error) {
      logger.error("Error verificando capacidad:", error);
      throw error;
    }
  }
}

export const eventService = new EventService();
