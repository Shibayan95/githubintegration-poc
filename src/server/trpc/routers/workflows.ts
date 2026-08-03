import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/integrations/trpc/init";
import { enterpriseApiFetch } from "@/server/platform/enterpriseApiFetch";
import type { ApiResponse } from "@/services/common";
import type {
  RunWorkflowResponse,
  DataAppSession,
  ChatMessage,
  Workflow,
} from "@/services/workflows/types";

function unwrapJsonApiList<T>(raw: unknown): T[] {
  const tryUnwrap = (arr: unknown[]): T[] => {
    if (arr.length === 0) return [];
    const first = arr[0] as Record<string, unknown>;
    if (first && typeof first === "object" && "attributes" in first) {
      return arr.map((r) => {
        const item = r as {
          id?: string | number;
          attributes: Record<string, unknown>;
        };
        return { ...item.attributes, id: Number(item.id) } as T;
      });
    }
    return arr as T[];
  };

  if (Array.isArray(raw)) return tryUnwrap(raw);
  const obj = raw as Record<string, unknown> | undefined;
  if (!obj) return [];
  if (Array.isArray(obj.data)) return tryUnwrap(obj.data);
  return [];
}

const runInput = z.object({
  workflowId: z.string(),
  workflow: z.object({
    inputs: z.record(z.string(), z.unknown()),
  }),
  dataAppId: z.string().optional(),
  dataAppToken: z.string().optional(),
  dataAppSessionId: z.string().optional(),
});

export const workflowsRouter = createTRPCRouter({
  getWorkflowDataAppConfig: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: workflowId }) => {
      return enterpriseApiFetch<undefined, ApiResponse<Workflow>>(ctx, {
        url: `agents/workflows/${workflowId}`,
        method: "GET",
      });
    }),

  run: protectedProcedure
    .input(runInput)
    .mutation(
      async ({
        ctx,
        input: {
          workflowId,
          workflow,
          dataAppId,
          dataAppToken,
          dataAppSessionId,
        },
      }) => {
        const headers: Record<string, string> = {};
        if (dataAppId) headers["Data-App-Id"] = dataAppId;
        if (dataAppToken) headers["Data-App-Token"] = dataAppToken;
        if (dataAppSessionId) headers["Data-App-Session-Id"] = dataAppSessionId;

        return enterpriseApiFetch<
          { workflow: { inputs: Record<string, unknown> } },
          RunWorkflowResponse
        >(ctx, {
          url: `agents/workflows/${workflowId}/run`,
          method: "POST",
          data: { workflow },
          options: { headers },
        });
      },
    ),

  getDataAppSessions: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: dataAppId }) => {
      const res = await enterpriseApiFetch<undefined, unknown>(ctx, {
        url: "data_app_sessions",
        method: "GET",
      });
      const all = unwrapJsonApiList<DataAppSession>(res);
      const appIdNum = Number.parseInt(dataAppId, 10);
      return all.filter((s) => s.data_app_id === appIdNum);
    }),

  getDataAppSessionMessages: protectedProcedure
    .input(z.number())
    .query(async ({ ctx, input: sessionDbId }) => {
      const res = await enterpriseApiFetch<undefined, unknown>(ctx, {
        url: `data_app_sessions/${String(sessionDbId)}/chat_messages`,
        method: "GET",
      });
      return unwrapJsonApiList<ChatMessage>(res);
    }),
});
