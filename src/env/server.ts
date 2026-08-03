import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import "dotenv/config";

const boolFromEnv = z
  .string()
  .optional()
  .default("true")
  .transform((s) => s === "true");

/**
 * Server-side env validation. Reads `process.env` at runtime.
 * Only import this inside tRPC, server functions, and server entry — never in client code.
 */

export const env = createEnv({
  server: {
    AIS_AUTH_ENABLED: boolFromEnv,
    WORKSPACE_ID: z.string().min(1).default("1"),
    DATABASE_URL: z.url().optional(),
    S3_ENDPOINT: z.url().optional(),
    S3_REGION: z.string().optional(),
    S3_ACCESS_KEY: z.string().optional(),
    S3_SECRET_KEY: z.string().optional(),
    AWS_SESSION_TOKEN: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    S3_PREFIX: z.string().optional(),
    S3_TOKEN_LIFETIME: z.string().optional(),
    AIS_API_BASE_URL: z.url().optional(),
    APPGEN_APP_ID: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export const DATABASE_ENABLED = Boolean(env.DATABASE_URL);

export const S3_ENABLED = Boolean(
  (env.S3_ENDPOINT || env.S3_REGION) &&
    env.S3_BUCKET &&
    env.S3_ACCESS_KEY &&
    env.S3_SECRET_KEY &&
    env.S3_PREFIX,
);

export type Env = typeof env;
