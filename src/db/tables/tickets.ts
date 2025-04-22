import { pgTable, serial, integer, varchar, timestamp, boolean, text, pgEnum } from 'drizzle-orm/pg-core';
import { events } from './events';
import { users } from './users';

export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed']);

export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').references(() => events.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  ticketCode: varchar('ticket_code', { length: 20 }).notNull().unique(),
  qrCode: text('qr_code').notNull(),
  purchaseDate: timestamp('purchase_date').defaultNow(),
  isUsed: boolean('is_used').default(false),
  usedDate: timestamp('used_date'),
  paymentId: varchar('payment_id', { length: 255 }),
  paymentStatus: paymentStatusEnum('payment_status').default('pending')
});