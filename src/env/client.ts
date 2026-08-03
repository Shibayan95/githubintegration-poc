import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * Client-side env validation. Reads `import.meta.env` at runtime.
 * This can be used in client components and server functions.
 */

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_APP_ID: z.string().optional(),
    VITE_API_BASE_URL: z.url(),
  },
  runtimeEnvStrict: {
    VITE_APP_ID: import.meta.env.VITE_APP_ID,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  },
  emptyStringAsUndefined: true,
});

export type Env = typeof env;
