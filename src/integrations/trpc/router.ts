import { createTRPCRouter } from "./init";
import { authRouter } from "@/server/trpc/routers/auth";
import { capabilitiesRouter } from "@/server/trpc/routers/capabilities";
import { connectorsRouter } from "@/server/trpc/routers/connectors";
import { workflowsRouter } from "@/server/trpc/routers/workflows";

export const trpcRouter = createTRPCRouter({
  auth: authRouter,
  capabilities: capabilitiesRouter,
  connectors: connectorsRouter,
  workflows: workflowsRouter,
});

export type TRPCAppRouter = typeof trpcRouter;
