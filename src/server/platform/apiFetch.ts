import type { TRPCContext } from "@/integrations/trpc/context";
import { platformRequest, type PlatformFetchProps } from "./request";

/**
 * Standard AIS platform API (`/api/v1`).
 */
export function apiFetch<Payload, T>(
  ctx: TRPCContext,
  args: PlatformFetchProps<Payload>,
) {
  return platformRequest<Payload, T>(ctx, "api", args);
}
