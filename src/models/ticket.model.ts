// src/models/ticket.model.ts
import { pgTable, serial, integer, varchar, timestamp, boolean, text } from 'drizzle-orm/pg-core';

export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull(),
  userId: integer('user_id').notNull(),
  ticketCode: varchar('ticket_code', { length: 20 }).notNull().unique(),
  qrCode: text('qr_code').notNull(),
  purchaseDate: timestamp('purchase_date').defaultNow(),
  isUsed: boolean('is_used').default(false),
  usedDate: timestamp('used_date'),
  paymentId: varchar('payment_id', { length: 255 }),
  paymentStatus: varchar('payment_status', { length: 50 }).default('pending'),
});

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;