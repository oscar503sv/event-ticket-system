// src/models/user.model.ts
import { users } from "../db/tables/users";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export { users };
