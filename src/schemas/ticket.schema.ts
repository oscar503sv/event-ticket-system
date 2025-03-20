// src/schemas/ticket.schema.ts
import { z } from 'zod';

export const createTicketSchema = z.object({
  eventId: z.number().int().positive('ID de evento inválido'),
  userId: z.number().int().positive('ID de usuario inválido'),
  quantity: z.number().int().positive('La cantidad debe ser un número positivo'),
});