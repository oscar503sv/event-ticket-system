import { logger } from "../config/logger";
// src/controllers/event.controller.ts
import { eventService } from "../services/event.service";
import { errorResponse, successResponse } from "../utils/responses";

/**
 * Listar todos los eventos
 */
export async function listEventsHandler() {
  try {
    const events = await eventService.getAllEvents();
    return successResponse(events, "Eventos obtenidos exitosamente");
  } catch (error) {
    logger.error("Error en listEventsHandler:", error);
    return errorResponse("Error al obtener eventos", 500);
  }
}

/**
 * Listar eventos futuros
 */
export async function listUpcomingEventsHandler() {
  try {
    const events = await eventService.getUpcomingEvents();
    return successResponse(events, "Eventos futuros obtenidos exitosamente");
  } catch (error) {
    logger.error("Error en listUpcomingEventsHandler:", error);
    return errorResponse("Error al obtener eventos futuros", 500);
  }
}

/**
 * Obtener evento por ID
 */
export async function getEventHandler({ params }: { params: { id: string } }) {
  try {
    const eventId = Number.parseInt(params.id, 10);

    if (Number.isNaN(eventId)) {
      return errorResponse("ID de evento inválido", 400);
    }

    const event = await eventService.getEventById(eventId);
    return successResponse(event, "Evento obtenido exitosamente");
  } catch (error) {
    logger.error("Error en getEventHandler:", error);

    if (error instanceof Error && error.message === "Evento no encontrado") {
      return errorResponse(error.message, 404);
    }

    return errorResponse("Error al obtener evento", 500);
  }
}

/**
 * Crear nuevo evento
 */
export async function createEventHandler(context: any) {
  try {
    const body = context.body;

    // Convertir fechas de string a Date
    const eventData = {
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    };

    const event = await eventService.createEvent(eventData, context.user.sub);

    return successResponse(event, "Evento creado exitosamente", 201);
  } catch (error) {
    logger.error("Error en createEventHandler:", error);

    if (error instanceof Error && error.message.includes("fecha")) {
      return errorResponse(error.message, 400);
    }

    return errorResponse("Error al crear evento", 500);
  }
}

/**
 * Actualizar evento
 */
export async function updateEventHandler(context: any) {
  try {
    const eventId = Number.parseInt(context.params.id, 10);

    if (Number.isNaN(eventId)) {
      return errorResponse("ID de evento inválido", 400);
    }

    const body = context.body;

    // Convertir fechas si están presentes
    const updateData: any = { ...body };
    if (body.startDate) {
      updateData.startDate = new Date(body.startDate);
    }
    if (body.endDate) {
      updateData.endDate = new Date(body.endDate);
    }

    const event = await eventService.updateEvent(eventId, updateData);
    return successResponse(event, "Evento actualizado exitosamente");
  } catch (error) {
    logger.error("Error en updateEventHandler:", error);

    if (error instanceof Error && error.message === "Evento no encontrado") {
      return errorResponse(error.message, 404);
    }

    if (error instanceof Error && error.message.includes("fecha")) {
      return errorResponse(error.message, 400);
    }

    return errorResponse("Error al actualizar evento", 500);
  }
}

/**
 * Eliminar evento (soft delete)
 */
export async function deleteEventHandler({ params }: { params: { id: string } }) {
  try {
    const eventId = Number.parseInt(params.id, 10);

    if (Number.isNaN(eventId)) {
      return errorResponse("ID de evento inválido", 400);
    }

    await eventService.deleteEvent(eventId);
    return successResponse(null, "Evento eliminado exitosamente", 204);
  } catch (error) {
    logger.error("Error en deleteEventHandler:", error);

    if (error instanceof Error && error.message === "Evento no encontrado") {
      return errorResponse(error.message, 404);
    }

    return errorResponse("Error al eliminar evento", 500);
  }
}
