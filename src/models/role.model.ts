import { roles } from '../db/tables/roles';

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

export { roles };