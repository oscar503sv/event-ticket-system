import { pgTable, serial, varchar, timestamp, integer, boolean, text, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const eventTypeEnum = pgEnum('event_type', ['Concierto', 'Festival', 'Conferencia', 'Taller', 'Deportivo', 'Otro']);

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: eventTypeEnum('type').notNull(),
  organizerId: integer('organizer_id').references(() => users.id).notNull(),
  description: text('description'),
  location: varchar('location', { length: 255 }).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  imageUrl: varchar('image_url', { length: 255 }),
  capacity: integer('capacity').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  isPublished: boolean('is_published').default(false)
});