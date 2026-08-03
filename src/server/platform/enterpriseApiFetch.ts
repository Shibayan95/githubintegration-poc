import type { TRPCContext } from "@/integrations/trpc/context";
import { platformRequest, type PlatformFetchProps } from "./request";

/**
 * Enterprise AIS API (`/enterprise/api/v1`).
 */
export function enterpriseApiFetch<Payload, T>(
  ctx: TRPCContext,
  args: PlatformFetchProps<Payload>,
) {
  return platformRequest<Payload, T>(ctx, "enterprise", args);
}
