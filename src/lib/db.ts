import "@tanstack/react-start/server-only";

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { env } from "@/env/server";
import * as schema from "@/server/db/schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

let cachedDb: Database | null = null;

/**
 * Server-only Drizzle client over Neon HTTP (stateless, no TCP pool).
 * Works reliably in serverless/ephemeral environments (Modal sandboxes).
 * Requires DATABASE_URL to be injected into the running server environment.
 */
export async function getDb(): Promise<Database> {
  if (!env.DATABASE_URL) {
    throw new Error("Database is not configured (DATABASE_URL is not set)");
  }

  if (cachedDb) return cachedDb;

  const sql = neon(env.DATABASE_URL);
  cachedDb = drizzle(sql, { schema });
  return cachedDb;
}
