import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { env } from "@/env/server";
import type { TRPCContext } from "./context";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

const requireAuth = t.middleware(({ ctx, next }) => {
  if (env.AIS_AUTH_ENABLED && !ctx.authToken) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx });
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(requireAuth);

export type { TRPCContext } from "./context";
