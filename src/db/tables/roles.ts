import { pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { roleEnum } from "./users";

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: roleEnum("name").notNull().default("USER"),
});
