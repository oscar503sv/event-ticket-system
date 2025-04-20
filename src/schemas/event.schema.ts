// src/schemas/event.schema.ts
import { z } from 'zod';

export const createEventSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  type: z.enum(['Concierto', 'Festival', 'Conferencia', 'Taller','Deportivo', 'Otro'], {
    errorMap: () => ({ message: 'Tipo de evento inválido' }),
  }),
  location: z.string().min(3, 'La ubicación debe tener al menos 3 caracteres'),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  imageUrl: z.string().url('URL de imagen inválida').optional(),
  capacity: z.number().int().positive('La capacidad debe ser un número positivo'),
  price: z.number().positive('El precio debe ser un número positivo'),
  isPublished: z.boolean().optional(),
});

export const updateEventSchema = createEventSchema.partial();