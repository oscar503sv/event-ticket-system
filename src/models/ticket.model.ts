// src/models/ticket.model.ts
import { tickets } from '../db/tables/tickets';

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;

export { tickets };