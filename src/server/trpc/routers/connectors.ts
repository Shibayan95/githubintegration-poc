import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/integrations/trpc/init";
import { apiFetch } from "@/server/platform/apiFetch";
import type {
  ConnectorResponse,
  ListConnectorsParams,
  ListConnectorsResponse,
  QuerySourceResponse,
} from "@/services/connectors/types";

const listInput = z
  .object({
    type: z.string().optional(),
    category: z.string().optional(),
    page: z.number().optional(),
    per_page: z.number().optional(),
  })
  .optional();

export const connectorsRouter = createTRPCRouter({
  list: protectedProcedure.input(listInput).query(async ({ ctx, input }) => {
    return apiFetch<undefined, ListConnectorsResponse>(ctx, {
      url: "connectors",
      method: "GET",
      options: {
        params: input as ListConnectorsParams,
      },
    });
  }),

  get: protectedProcedure
    .input(z.union([z.string(), z.number()]))
    .query(async ({ ctx, input: id }) => {
      return apiFetch<undefined, ConnectorResponse>(ctx, {
        url: `connectors/${String(id)}`,
        method: "GET",
      });
    }),

  querySource: protectedProcedure
    .input(
      z.object({
        connectorId: z.union([z.string(), z.number()]),
        payload: z.object({ query: z.string() }),
      }),
    )
    .mutation(async ({ ctx, input: { connectorId, payload } }) => {
      return apiFetch<{ query: string }, QuerySourceResponse>(ctx, {
        url: `connectors/${String(connectorId)}/query_source`,
        method: "POST",
        data: payload,
      });
    }),
});
