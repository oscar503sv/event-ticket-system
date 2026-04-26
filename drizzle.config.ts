/// <reference types="node" />

import type { Config } from "drizzle-kit";
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('Se requiere la variable de entorno DATABASE_URL');
}

export default {
  schema: "./src/db/schema.ts",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
  out: "./drizzle/migrations",
} satisfies Config;