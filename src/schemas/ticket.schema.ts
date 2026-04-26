// src/schemas/ticket.schema.ts
import { z } from "zod";

export const createTicketSchema = z.object({
  eventId: z.number().int().positive("ID de evento inválido"),
  userId: z.number().int().positive("ID de usuario inválido"),
  ticketCode: z.string().min(1).max(20, "El código del ticket debe tener máximo 20 caracteres"),
  qrCode: z.string().min(1, "El código QR es requerido"),
  paymentId: z.string().max(255, "El ID de pago debe tener máximo 255 caracteres").optional(),
  paymentStatus: z.enum(["pending", "completed", "failed"]).default("pending"),
});
