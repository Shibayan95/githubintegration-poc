// server-only guard — importing this module in a client bundle is a build error.
import "@tanstack/react-start/server-only";

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { env } from "@/env/server";
import * as schema from "@/server/db/schema";

// Infer the typed Drizzle client so callers get full query autocompletion.
type Database = ReturnType<typeof drizzle<typeof schema>>;

// Module-level cache: reuse the same client across requests within the same
// server process lifetime (avoids recreating the HTTP transport on every call).
let cachedDb: Database | null = null;

/**
 * Server-only Drizzle client over Neon HTTP (stateless, no TCP pool).
 * Works reliably in serverless/ephemeral environments (Modal sandboxes).
 * Requires DATABASE_URL to be injected into the running server environment.
 */
export async function getDb(): Promise<Database> {
  // Fail fast with a clear message if the platform hasn't provisioned a DB yet.
  if (!env.DATABASE_URL) {
    throw new Error("Database is not configured (DATABASE_URL is not set)");
  }

  // Return the cached instance if already initialised.
  if (cachedDb) return cachedDb;

  // Create the Neon HTTP SQL executor and wrap it with Drizzle + our schema.
  const sql = neon(env.DATABASE_URL);
  cachedDb = drizzle(sql, { schema });
  return cachedDb;
}
