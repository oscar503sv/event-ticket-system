// src/models/event.model.ts
import { events } from '../db/tables/events';

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export { events };