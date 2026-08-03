import {
  useMutation,
  useQuery,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { trpc } from "@/integrations/trpc/react";
import type { SignInPayload, SignInResponse } from "@/services/auth/types";
import type { ApiResponse } from "@/services/common";

export function useSignIn(
  options?: UseMutationOptions<
    ApiResponse<SignInResponse>,
    Error,
    SignInPayload
  >,
) {
  const t = trpc.useTRPC();
  // @ts-expect-error — merging tRPC mutation options with consumer options is not expressible in one generic
  return useMutation({
    ...t.auth.signIn.mutationOptions(),
    ...options,
  });
}

export function useSignOut() {
  const t = trpc.useTRPC();
  return useMutation(t.auth.signOut.mutationOptions());
}

export function useGetUser() {
  const t = trpc.useTRPC();
  return useQuery(t.auth.me.queryOptions());
}
