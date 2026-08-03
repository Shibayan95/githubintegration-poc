import { createTRPCRouter, publicProcedure } from "@/integrations/trpc/init";
import { DATABASE_ENABLED } from "@/env/server";

/** Feature flags for optional server-side capabilities. */
export const capabilitiesRouter = createTRPCRouter({
  get: publicProcedure.query(() => ({
    databaseEnabled: DATABASE_ENABLED,
    s3Enabled: false,
  })),
});
