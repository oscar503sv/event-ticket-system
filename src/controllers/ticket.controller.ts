import { logger } from "../config/logger";
// src/controllers/ticket.controller.ts
import { ticketService } from "../services/ticket.service";
import { errorResponse, successResponse } from "../utils/responses";

/**
 * Obtener tickets del usuario actual
 */
export async function getMyTicketsHandler(context: any) {
  try {
    const tickets = await ticketService.getUserTickets(context.user.sub);
    return successResponse(tickets, "Tickets obtenidos exitosamente");
  } catch (error) {
    logger.error("Error en getMyTicketsHandler:", error);
    return errorResponse("Error al obtener tickets", 500);
  }
}

/**
 * Obtener ticket por código
 */
export async function getTicketByCodeHandler(context: any) {
  try {
    const ticket = await ticketService.getTicketByCode(context.params.code, context.user.sub);
    return successResponse(ticket, "Ticket obtenido exitosamente");
  } catch (error) {
    logger.error("Error en getTicketByCodeHandler:", error);

    if (error instanceof Error && error.message.includes("no encontrado")) {
      return errorResponse(error.message, 404);
    }

    if (error instanceof Error && error.message.includes("no pertenece")) {
      return errorResponse(error.message, 403);
    }

    return errorResponse("Error al obtener ticket", 500);
  }
}

/**
 * Crear nuevo ticket (compra manual)
 */
export async function createTicketHandler(context: any) {
  try {
    const ticket = await ticketService.createTicket(context.body.eventId, context.user.sub);
    context.set.status = 201;
    return successResponse(ticket, "Ticket creado exitosamente", 201);
  } catch (error) {
    logger.error("Error en createTicketHandler:", error);

    if (error instanceof Error && error.message === "No hay capacidad disponible para este evento") {
      context.set.status = 409;
      return errorResponse(error.message, 409);
    }

    if (error instanceof Error && error.message === "Ya tienes un ticket activo para este evento") {
      context.set.status = 409;
      return errorResponse(error.message, 409);
    }

    if (error instanceof Error && error.message === "El evento no está disponible") {
      context.set.status = 400;
      return errorResponse(error.message, 400);
    }

    if (error instanceof Error && error.message === "Evento no encontrado") {
      context.set.status = 404;
      return errorResponse(error.message, 404);
    }

    context.set.status = 500;
    return errorResponse("Error al crear ticket", 500);
  }
}

/**
 * Validar ticket (marcar como usado)
 */
export async function validateTicketHandler(context: any) {
  try {
    const ticket = await ticketService.validateTicket(context.params.code, context.user.sub);
    return successResponse(ticket, "Ticket validado exitosamente");
  } catch (error) {
    logger.error("Error en validateTicketHandler:", error);

    if (error instanceof Error && error.message === "Ticket no encontrado") {
      context.set.status = 404;
      return errorResponse(error.message, 404);
    }

    if (error instanceof Error && error.message === "Este ticket ya ha sido utilizado") {
      context.set.status = 409;
      return errorResponse(error.message, 409);
    }

    context.set.status = 500;
    return errorResponse("Error al validar ticket", 500);
  }
}
