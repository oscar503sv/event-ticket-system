import { pgTable, serial, varchar, pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['USER', 'ORGANIZER', 'VALIDATOR', 'ADMIN']);

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: roleEnum('name').notNull().default('USER')
});