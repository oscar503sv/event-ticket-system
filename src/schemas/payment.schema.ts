// src/schemas/payment.schema.ts
import { z } from "zod";

/**
 * Schema para crear sesión de checkout
 */
export const createCheckoutSessionSchema = z.object({
  eventId: z.number().int().positive("eventId debe ser un número positivo"),
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;
